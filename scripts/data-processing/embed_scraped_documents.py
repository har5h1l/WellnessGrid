#!/usr/bin/env python3
"""
Embed Scraped Medical Documents for WellnessGrid RAG System
Takes documents from medical_document_scraper.py and embeds them into Supabase
"""

import os
import json
import logging
import hashlib
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import embedding functionality
try:
    from sentence_transformers import SentenceTransformer
    from supabase import create_client
except ImportError:
    print("Please install required packages: pip install sentence-transformers supabase")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ScrapedDocumentEmbedder:
    """Embeds scraped medical documents into Supabase"""
    
    def __init__(self):
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('NeuML/pubmedbert-base-embeddings')
        logger.info("🧠 Loaded PubMedBERT embedding model (768 dimensions)")
        
        # Initialize Supabase client
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        
        self.supabase = create_client(supabase_url, supabase_key)
        logger.info("✅ Connected to Supabase")
        
        # Stats tracking
        self.embedded_count = 0
        self.skipped_count = 0
        self.failed_count = 0
        self.total_chunks = 0
        
    def chunk_text(self, text: str, max_chunk_size: int = 1000, overlap: int = 100) -> List[str]:
        """Split text into overlapping chunks for better embedding"""
        if len(text) <= max_chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + max_chunk_size
            
            # Find the last sentence boundary within the chunk
            if end < len(text):
                last_period = text.rfind('.', start, end)
                last_exclamation = text.rfind('!', start, end)
                last_question = text.rfind('?', start, end)
                
                # Find the latest sentence boundary
                boundary = max(last_period, last_exclamation, last_question)
                
                if boundary > start + max_chunk_size // 2:  # Ensure chunk isn't too small
                    end = boundary + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - overlap if end < len(text) else end
        
        return chunks
    
    def generate_content_hash(self, content: str) -> str:
        """Generate hash for content deduplication"""
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def document_exists(self, title: str, content_hash: str) -> bool:
        """Check if document already exists in database"""
        try:
            result = self.supabase.table('medical_documents').select('id').eq('title', title).execute()
            
            if result.data:
                # Check if any existing document has the same content hash
                for doc in result.data:
                    doc_result = self.supabase.table('medical_documents').select('metadata').eq('id', doc['id']).execute()
                    if doc_result.data and doc_result.data[0].get('metadata', {}).get('content_hash') == content_hash:
                        return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking document existence: {e}")
            return False
    
    def embed_document(self, document: Dict[str, Any]) -> bool:
        """Embed a single document into Supabase"""
        try:
            title = document['title']
            content = document['content']
            content_hash = self.generate_content_hash(content)
            
            # Check if document already exists
            if self.document_exists(title, content_hash):
                logger.info(f"⏭️ Skipping existing document: {title}")
                self.skipped_count += 1
                return False
            
            logger.info(f"🔄 Embedding: {title}")
            
            # Prepare document metadata
            metadata = {
                'content_hash': content_hash,
                'embedding_date': datetime.now().isoformat(),
                'scraper_source': document.get('source', ''),
                'category': document.get('category', ''),
                'subcategory': document.get('subcategory', ''),
                'document_type': document.get('document_type', ''),
                'published_date': document.get('published_date', ''),
                'original_url': document.get('url', '')
            }
            
            # Insert document record
            doc_data = {
                'title': title,
                'content': content,
                'source': document.get('source', 'scraped'),
                'topic': document.get('topic', 'general'),
                'url': document.get('url', ''),
                'document_type': document.get('document_type', 'scraped'),
                'metadata': metadata,
                'content_length': len(content)
            }
            
            doc_result = self.supabase.table('medical_documents').insert(doc_data).execute()
            
            if not doc_result.data:
                raise Exception("Failed to insert document")
            
            doc_id = doc_result.data[0]['id']
            
            # Chunk the content
            chunks = self.chunk_text(content)
            logger.info(f"  📄 Created {len(chunks)} chunks")
            
            # Generate embeddings for chunks
            logger.info(f"  🧠 Generating embeddings...")
            embeddings = self.embedding_model.encode(chunks, show_progress_bar=False)
            
            # Prepare embedding data
            embedding_data = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                embedding_data.append({
                    'document_id': doc_id,
                    'chunk_index': i,
                    'chunk_content': chunk,
                    'embedding': embedding.tolist()
                })
            
            # Insert embeddings in batches
            batch_size = 50
            for i in range(0, len(embedding_data), batch_size):
                batch = embedding_data[i:i + batch_size]
                self.supabase.table('document_embeddings').insert(batch).execute()
            
            self.embedded_count += 1
            self.total_chunks += len(chunks)
            
            logger.info(f"  ✅ Embedded {len(chunks)} chunks for: {title}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to embed document '{document.get('title', 'Unknown')}': {e}")
            self.failed_count += 1
            return False
    
    def embed_scraped_documents(self, json_file: str = "scripts/scraped_medical_documents.json"):
        """Embed all documents from scraped JSON file"""
        logger.info("🚀 Starting embedding process for scraped documents")
        
        # Load scraped documents
        if not os.path.exists(json_file):
            raise FileNotFoundError(f"Scraped documents file not found: {json_file}")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        documents = data.get('documents', [])
        session_info = data.get('scraping_session', {})
        
        logger.info(f"📚 Loaded {len(documents)} documents from {json_file}")
        logger.info(f"🕐 Scraped on: {session_info.get('timestamp', 'Unknown')}")
        logger.info(f"📊 Sources: {', '.join(session_info.get('sources_covered', []))}")
        
        # Get current database stats
        try:
            current_docs = self.supabase.table('medical_documents').select('count').execute()
            current_count = len(current_docs.data) if current_docs.data else 0
            logger.info(f"📈 Current database: {current_count} documents")
        except Exception as e:
            logger.warning(f"Could not get current document count: {e}")
            current_count = 0
        
        # Embed documents
        start_time = time.time()
        
        for i, document in enumerate(documents, 1):
            logger.info(f"\n[{i}/{len(documents)}] Processing document...")
            self.embed_document(document)
            
            # Progress update every 10 documents
            if i % 10 == 0:
                elapsed = time.time() - start_time
                avg_time = elapsed / i
                remaining = (len(documents) - i) * avg_time
                logger.info(f"🚀 Progress: {i}/{len(documents)} ({i/len(documents)*100:.1f}%) - ETA: {remaining/60:.1f} minutes")
        
        # Final statistics
        end_time = time.time()
        total_time = end_time - start_time
        
        logger.info(f"\n🎉 Embedding completed!")
        logger.info(f"⏱️ Total time: {total_time/60:.1f} minutes")
        logger.info(f"✅ Successfully embedded: {self.embedded_count} documents")
        logger.info(f"⏭️ Skipped (already exists): {self.skipped_count} documents")
        logger.info(f"❌ Failed: {self.failed_count} documents")
        logger.info(f"📄 Total chunks created: {self.total_chunks}")
        
        # Get updated database stats
        try:
            updated_docs = self.supabase.table('medical_documents').select('count').execute()
            updated_count = len(updated_docs.data) if updated_docs.data else 0
            logger.info(f"📈 Database now contains: {updated_count} documents (+{updated_count - current_count})")
            
            updated_chunks = self.supabase.table('document_embeddings').select('count').execute()
            chunk_count = len(updated_chunks.data) if updated_chunks.data else 0
            logger.info(f"📄 Total chunks in database: {chunk_count}")
            
        except Exception as e:
            logger.warning(f"Could not get updated document count: {e}")
        
        # Save embedding session info
        self.save_embedding_session(session_info, documents)
        
        return {
            'embedded': self.embedded_count,
            'skipped': self.skipped_count,
            'failed': self.failed_count,
            'total_chunks': self.total_chunks,
            'total_time': total_time
        }
    
    def save_embedding_session(self, scraping_session: Dict, documents: List[Dict]):
        """Save embedding session information"""
        session_data = {
            'embedding_session': {
                'timestamp': datetime.now().isoformat(),
                'scraping_session': scraping_session,
                'embedding_results': {
                    'embedded_count': self.embedded_count,
                    'skipped_count': self.skipped_count,
                    'failed_count': self.failed_count,
                    'total_chunks': self.total_chunks
                },
                'model_info': {
                    'embedding_model': 'NeuML/pubmedbert-base-embeddings',
                    'dimensions': 768,
                    'chunk_size': 1000,
                    'chunk_overlap': 100
                }
            }
        }
        
        filepath = f"scripts/embedding_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(session_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved embedding session info to {filepath}")

def main():
    """Main function to embed scraped documents"""
    embedder = ScrapedDocumentEmbedder()
    
    # Check for scraped documents file
    json_file = "scripts/scraped_medical_documents.json"
    
    if not os.path.exists(json_file):
        logger.error(f"❌ Scraped documents file not found: {json_file}")
        logger.info("🔄 Please run medical_document_scraper.py first")
        return
    
    try:
        # Embed the scraped documents
        results = embedder.embed_scraped_documents(json_file)
        
        if results['embedded'] > 0:
            logger.info("\n🎯 Mission accomplished!")
            logger.info(f"📊 Database expanded with {results['embedded']} new medical documents")
            logger.info(f"📄 Added {results['total_chunks']} new knowledge chunks")
            logger.info("🚀 Your WellnessGrid RAG system is now significantly more powerful!")
        else:
            logger.warning("⚠️ No new documents were embedded. They may already exist in the database.")
        
    except Exception as e:
        logger.error(f"❌ Embedding process failed: {e}")
        raise

if __name__ == "__main__":
    main() 