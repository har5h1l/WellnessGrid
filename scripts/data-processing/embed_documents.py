#!/usr/bin/env python3
"""
WellnessGrid Document Embedding System

A clean, organized system for embedding medical documents that:
1. Reads sources from external JSON file (sources_to_embed.json)
2. Tracks embedded documents in registry (embedded_registry.json) 
3. Avoids duplicate embeddings
4. Clears database when requested
5. Uses PubMedBERT embeddings with Supabase pgvector

Usage:
    python embed_documents.py --clear-db    # Clear database and start fresh
    python embed_documents.py               # Process new sources only
    python embed_documents.py --force       # Re-embed everything
"""

import os
import sys
import json
import time
import hashlib
import requests
import numpy as np
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from tqdm import tqdm
import argparse
import subprocess

# Load environment variables
from dotenv import load_dotenv

def setup_environment():
    """Load environment variables and validate configuration"""
    print("🔧 Setting up environment...")
    
    # Load environment variables
    env_loaded = False
    # Try current directory first, then parent directory
    env_paths = ['.env.local', '.env', '../.env.local', '../.env']
    for env_file in env_paths:
        if os.path.exists(env_file):
            load_dotenv(env_file)
            print(f"✅ Loaded environment from {env_file}")
            env_loaded = True
            break
    
    if not env_loaded:
        print("❌ No .env.local or .env file found")
        return False
    
    # Check required environment variables
    required_vars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ All Supabase environment variables found")
    return True

def install_packages():
    """Install required packages"""
    print("📦 Installing required packages...")
    
    packages = [
        "torch>=2.6.0",
        "sentence-transformers",
        "python-dotenv", 
        "supabase",
        "beautifulsoup4",
        "requests",
        "numpy",
        "tqdm"
    ]
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package], 
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"✅ {package}")
        except Exception as e:
            print(f"⚠️ {package}: {e}")
    
    print("✅ Package installation complete!")

@dataclass
class DocumentSource:
    """Represents a source to be embedded"""
    type: str  # 'url', 'text', 'file', 'api', 'dataset'
    title: str
    category: str
    subcategory: str
    url: Optional[str] = None
    content: Optional[str] = None
    file_path: Optional[str] = None
    description: Optional[str] = None
    priority: str = "medium"
    api_params: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.api_params is None:
            self.api_params = {}

@dataclass 
class EmbeddedDocument:
    """Represents an embedded document in the registry"""
    source_id: str
    title: str
    content_hash: str
    embedding_date: str
    chunk_count: int
    category: str
    subcategory: str
    source_type: str
    metadata: Dict[str, Any]

class DocumentRegistry:
    """Manages the embedded documents registry"""
    
    def __init__(self, registry_path: str = "embedded_registry.json"):
        self.registry_path = registry_path
        self.registry = self._load_registry()
    
    def _load_registry(self) -> Dict:
        """Load the registry file"""
        if os.path.exists(self.registry_path):
            with open(self.registry_path, 'r') as f:
                return json.load(f)
        else:
            return {
                "embedded_documents": {},
                "embedding_sessions": [],
                "statistics": {
                    "total_documents_embedded": 0,
                    "total_chunks_created": 0,
                    "last_embedding_session": None,
                    "embedding_model_used": "NeuML/pubmedbert-base-embeddings",
                    "database_table": "medical_documents",
                    "embeddings_table": "document_embeddings"
                },
                "metadata": {
                    "version": "1.0",
                    "created_date": datetime.now().isoformat(),
                    "last_updated": datetime.now().isoformat(),
                    "description": "Registry of all embedded documents and their processing status"
                }
            }
    
    def save_registry(self):
        """Save the registry to file"""
        self.registry["metadata"]["last_updated"] = datetime.now().isoformat()
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2)
    
    def is_document_embedded(self, source_id: str, content_hash: str) -> bool:
        """Check if a document is already embedded"""
        if source_id in self.registry["embedded_documents"]:
            return self.registry["embedded_documents"][source_id]["content_hash"] == content_hash
        return False
    
    def add_embedded_document(self, doc: EmbeddedDocument):
        """Add a document to the registry"""
        self.registry["embedded_documents"][doc.source_id] = asdict(doc)
        self.registry["statistics"]["total_documents_embedded"] += 1
        self.registry["statistics"]["total_chunks_created"] += doc.chunk_count
        self.registry["statistics"]["last_embedding_session"] = datetime.now().isoformat()
    
    def start_embedding_session(self, session_info: Dict):
        """Start a new embedding session"""
        session = {
            "session_id": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "start_time": datetime.now().isoformat(),
            "sources_processed": 0,
            "chunks_created": 0,
            "status": "in_progress",
            **session_info
        }
        self.registry["embedding_sessions"].append(session)
        return session["session_id"]
    
    def end_embedding_session(self, session_id: str, results: Dict):
        """End an embedding session"""
        for session in self.registry["embedding_sessions"]:
            if session["session_id"] == session_id:
                session.update({
                    "end_time": datetime.now().isoformat(),
                    "status": "completed",
                    **results
                })
                break

class SourceLoader:
    """Loads sources from the sources_to_embed.json file"""
    
    def __init__(self, sources_path: str = "sources_to_embed.json"):
        self.sources_path = sources_path
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'WellnessGrid-Medical-RAG/1.0 (Educational Research)'
        })
    
    def load_sources(self) -> List[DocumentSource]:
        """Load all sources from the JSON file"""
        if not os.path.exists(self.sources_path):
            print(f"❌ Sources file not found: {self.sources_path}")
            return []
        
        with open(self.sources_path, 'r') as f:
            sources_data = json.load(f)
        
        sources = []
        
        # Process medical sources
        for category_key, category_data in sources_data.get("medical_sources", {}).items():
            for source_data in category_data.get("sources", []):
                source = DocumentSource(
                    type=source_data["type"],
                    title=source_data["title"],
                    category=source_data.get("category", category_key),
                    subcategory=source_data.get("subcategory", "general"),
                    url=source_data.get("url"),
                    content=source_data.get("content"),
                    file_path=source_data.get("file_path"),
                    description=source_data.get("description"),
                    priority=category_data.get("priority", "medium"),
                    api_params=source_data.get("api_params", {})
                )
                sources.append(source)
        
        # Process custom documents
        for category_key, category_data in sources_data.get("custom_documents", {}).items():
            for source_data in category_data.get("sources", []):
                source = DocumentSource(
                    type=source_data["type"],
                    title=source_data["title"],
                    category=source_data.get("category", category_key),
                    subcategory=source_data.get("subcategory", "general"),
                    url=source_data.get("url"),
                    content=source_data.get("content"),
                    file_path=source_data.get("file_path"),
                    description=source_data.get("description"),
                    priority=category_data.get("priority", "medium"),
                    api_params=source_data.get("api_params", {})
                )
                sources.append(source)
        
        print(f"📚 Loaded {len(sources)} sources from {self.sources_path}")
        return sources
    
    def fetch_url_content(self, url: str) -> Optional[str]:
        """Fetch content from a URL"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
                element.decompose()
            
            # Extract main content
            content_selectors = [
                'main', '[role="main"]', '.main-content', '#main-content',
                '.content', '#content', 'article', '.article'
            ]
            
            main_content = None
            for selector in content_selectors:
                main_content = soup.select_one(selector)
                if main_content:
                    break
            
            if not main_content:
                main_content = soup.find('body') or soup
            
            # Extract text
            text = main_content.get_text(separator=' ', strip=True)
            
            # Clean up text
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            clean_text = '\n'.join(lines)
            
            return clean_text
            
        except Exception as e:
            print(f"❌ Failed to fetch {url}: {e}")
            return None
    
    def fetch_api_content(self, source: DocumentSource) -> Optional[str]:
        """Fetch content from an API endpoint"""
        try:
            url = source.url
            params = source.api_params.copy()
            
            # Add default limit to prevent overwhelming responses
            if 'limit' not in params and '$limit' not in params and 'pageSize' not in params:
                params['limit'] = '50'
            
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            # Try to parse as JSON
            try:
                data = response.json()
                
                # Convert to readable text format
                if isinstance(data, list):
                    content_parts = []
                    for item in data[:20]:  # Limit to first 20 items
                        if isinstance(item, dict):
                            item_text = ""
                            for key, value in item.items():
                                if isinstance(value, str) and len(value) > 10:
                                    item_text += f"{key}: {value}\\n"
                            if item_text:
                                content_parts.append(item_text)
                    result = '\\n'.join(content_parts) if content_parts else str(data)
                    return result[:5000]  # Limit total content length
                elif isinstance(data, dict):
                    # Handle structured data
                    if 'results' in data:
                        return self._format_api_results(data['results'][:20])
                    elif 'data' in data:
                        return self._format_api_results(data['data'][:20])
                    else:
                        result = json.dumps(data, indent=2)
                        return result[:5000]  # Limit content length
                else:
                    return str(data)
                    
            except json.JSONDecodeError:
                # Return raw text if not JSON
                return response.text[:5000]  # Limit text length
                
        except Exception as e:
            print(f"❌ Failed to fetch API content from {source.url}: {e}")
            return None
    
    def _format_api_results(self, results) -> str:
        """Format API results into readable text"""
        content_parts = []
        for item in results[:15]:  # Limit to 15 items
            if isinstance(item, dict):
                item_text = ""
                for key, value in item.items():
                    if isinstance(value, str) and len(value) > 5:
                        item_text += f"{key}: {value}\\n"
                if item_text:
                    content_parts.append(item_text + "\\n")
        result = ''.join(content_parts) if content_parts else "No readable content found"
        return result[:5000]  # Limit total content length

class DocumentEmbedder:
    """Handles document embedding with Supabase"""
    
    def __init__(self):
        # Import here to avoid issues if packages aren't installed
        from sentence_transformers import SentenceTransformer
        from supabase import create_client
        
        self.embedding_model = SentenceTransformer('NeuML/pubmedbert-base-embeddings')
        print("🧠 Embedding model: PubMedBERT (medical-specific)")
        print("   - Optimized for biomedical text")
        print("   - 768-dimensional embeddings")
        
        # Initialize Supabase client
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.supabase = create_client(supabase_url, supabase_key)
        
        print("✅ Embedding model and database connection initialized")
    
    def clear_database(self):
        """Clear all embedded documents from the database"""
        print("🗑️ Clearing database...")
        
        try:
            # Get all records first, then delete them
            embeddings = self.supabase.table('document_embeddings').select('id').execute()
            if embeddings.data:
                for record in embeddings.data:
                    self.supabase.table('document_embeddings').delete().eq('id', record['id']).execute()
                print(f"✅ Cleared {len(embeddings.data)} embeddings")
            else:
                print("✅ No embeddings to clear")
            
            # Clear documents table
            documents = self.supabase.table('medical_documents').select('id').execute()
            if documents.data:
                for record in documents.data:
                    self.supabase.table('medical_documents').delete().eq('id', record['id']).execute()
                print(f"✅ Cleared {len(documents.data)} documents")
            else:
                print("✅ No documents to clear")
            
            print("✅ Database cleared successfully")
            
        except Exception as e:
            print(f"❌ Failed to clear database: {e}")
            raise
    
    def generate_content_hash(self, content: str) -> str:
        """Generate a hash for content to detect changes"""
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into chunks for embedding"""
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence boundaries
            if end < len(text):
                # Look for sentence endings within the overlap region
                for i in range(min(overlap, chunk_size // 4)):
                    if text[end - i:end - i + 1] in '.!?':
                        end = end - i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks
    
    def embed_document(self, source: DocumentSource, content: str, registry: DocumentRegistry, force: bool = False) -> bool:
        """Embed a single document"""
        source_id = f"{source.category}_{source.subcategory}_{hashlib.sha256(source.title.encode()).hexdigest()[:8]}"
        content_hash = self.generate_content_hash(content)
        
        # Check if already embedded
        if not force and registry.is_document_embedded(source_id, content_hash):
            print(f"⏭️ Skipping {source.title} (already embedded)")
            return False
        
        print(f"🔄 Embedding: {source.title}")
        
        try:
            # Insert document record
            doc_data = {
                'title': source.title,
                'content': content,
                'source': f"{source.category}_{source.type}",
                'topic': source.subcategory,
                'url': source.url,
                'document_type': source.type,
                'metadata': {
                    'source_id': source_id,
                    'content_hash': content_hash,
                    'description': source.description,
                    'priority': source.priority,
                    'category': source.category,
                    'subcategory': source.subcategory,
                    'embedding_date': datetime.now().isoformat()
                },
                'content_length': len(content)
            }
            
            doc_result = self.supabase.table('medical_documents').insert(doc_data).execute()
            doc_id = doc_result.data[0]['id']
            
            # Chunk the content
            chunks = self.chunk_text(content)
            print(f"  📄 Created {len(chunks)} chunks")
            
            # Generate embeddings for chunks
            embeddings = self.embedding_model.encode(chunks)
            
            # Insert embeddings
            embedding_data = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                embedding_data.append({
                    'document_id': doc_id,
                    'chunk_index': i,
                    'chunk_content': chunk,
                    'embedding': embedding.tolist()
                })
            
            # Batch insert embeddings
            self.supabase.table('document_embeddings').insert(embedding_data).execute()
            
            # Update registry
            embedded_doc = EmbeddedDocument(
                source_id=source_id,
                title=source.title,
                content_hash=content_hash,
                embedding_date=datetime.now().isoformat(),
                chunk_count=len(chunks),
                category=source.category,
                subcategory=source.subcategory,
                source_type=source.type,
                metadata={
                    'description': source.description,
                    'priority': source.priority,
                    'url': source.url,
                    'document_id': doc_id
                }
            )
            
            registry.add_embedded_document(embedded_doc)
            print(f"  ✅ Embedded successfully")
            return True
            
        except Exception as e:
            print(f"  ❌ Failed to embed: {e}")
            return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='WellnessGrid Document Embedding System')
    parser.add_argument('--clear-db', action='store_true', help='Clear database before embedding')
    parser.add_argument('--force', action='store_true', help='Re-embed all documents')
    args = parser.parse_args()
    
    print("🚀 WellnessGrid Document Embedding System")
    print("=" * 50)
    
    # Setup environment
    if not setup_environment():
        print("❌ Environment setup failed")
        return
    
    # Install packages
    install_packages()
    
    # Initialize components
    registry = DocumentRegistry()
    loader = SourceLoader()
    embedder = DocumentEmbedder()
    
    # Clear database if requested
    if args.clear_db:
        embedder.clear_database()
        # Clear registry as well
        registry.registry["embedded_documents"] = {}
        registry.registry["embedding_sessions"] = []
        registry.registry["statistics"]["total_documents_embedded"] = 0
        registry.registry["statistics"]["total_chunks_created"] = 0
        registry.save_registry()
        print("✅ Registry cleared")
    
    # Load sources
    sources = loader.load_sources()
    if not sources:
        print("❌ No sources to process")
        return
    
    # Start embedding session
    session_id = registry.start_embedding_session({
        "total_sources": len(sources),
        "clear_db": args.clear_db,
        "force_reembed": args.force
    })
    
    print(f"📝 Started embedding session: {session_id}")
    
    # Process sources
    processed = 0
    embedded = 0
    
    for source in tqdm(sources, desc="Processing sources"):
        # Get content based on source type
        content = None
        
        if source.type == "url" and source.url:
            content = loader.fetch_url_content(source.url)
        elif source.type == "api" and source.url:
            content = loader.fetch_api_content(source)
        elif source.type == "dataset" and source.url:
            # For datasets, try to fetch description/readme content
            if 'github.com' in source.url:
                # For GitHub datasets, fetch README
                readme_url = source.url.replace('github.com', 'raw.githubusercontent.com') + '/main/README.md'
                content = loader.fetch_url_content(readme_url)
                if not content:
                    readme_url = source.url.replace('github.com', 'raw.githubusercontent.com') + '/master/README.md'
                    content = loader.fetch_url_content(readme_url)
            else:
                # For other datasets, fetch the main page
                content = loader.fetch_url_content(source.url)
        elif source.type == "text" and source.content:
            content = source.content
        elif source.type == "file" and source.file_path:
            if os.path.exists(source.file_path):
                with open(source.file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
        
        if content and len(content.strip()) > 50:  # Ensure minimum content length
            if embedder.embed_document(source, content, registry, args.force):
                embedded += 1
            processed += 1
        else:
            print(f"⚠️ No content found for: {source.title}")
        
        time.sleep(2)  # Rate limiting for APIs
    
    # End session
    registry.end_embedding_session(session_id, {
        "sources_processed": processed,
        "documents_embedded": embedded,
        "sources_skipped": len(sources) - processed
    })
    
    # Save registry
    registry.save_registry()
    
    print("\n" + "=" * 50)
    print("✅ Embedding completed!")
    print(f"📊 Processed: {processed}/{len(sources)} sources")
    print(f"🔄 Embedded: {embedded} documents")
    print(f"📋 Total in database: {registry.registry['statistics']['total_documents_embedded']} documents")
    print(f"🧩 Total chunks: {registry.registry['statistics']['total_chunks_created']}")
    print(f"📝 Session: {session_id}")

if __name__ == "__main__":
    main() 