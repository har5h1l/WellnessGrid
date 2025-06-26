#!/usr/bin/env python3
"""
Embed Scraped Medical Documents via MCP Tools
Alternative to direct Supabase access - processes local documents and outputs SQL for MCP execution
"""

import os
import json
import logging
import hashlib
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

# Import embedding functionality
try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Please install required packages: pip install sentence-transformers")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MCPDocumentEmbedder:
    """Embeds scraped medical documents and outputs SQL for MCP execution"""
    
    def __init__(self):
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('NeuML/pubmedbert-base-embeddings')
        logger.info("🧠 Loaded PubMedBERT embedding model (768 dimensions)")
        
        # Stats tracking
        self.processed_count = 0
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
    
    def escape_sql_string(self, s: str) -> str:
        """Escape string for SQL insertion"""
        return s.replace("'", "''").replace("\\", "\\\\")
    
    def process_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single document and return SQL-ready data"""
        try:
            title = document['title']
            content = document['content']
            content_hash = self.generate_content_hash(content)
            
            logger.info(f"🔄 Processing: {title}")
            
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
            
            # Chunk the content
            chunks = self.chunk_text(content)
            logger.info(f"  📄 Created {len(chunks)} chunks")
            
            # Generate embeddings for chunks
            logger.info(f"  🧠 Generating embeddings...")
            embeddings = self.embedding_model.encode(chunks, show_progress_bar=False)
            
            # Prepare data for return
            doc_data = {
                'title': self.escape_sql_string(title),
                'content': self.escape_sql_string(content),
                'source': self.escape_sql_string(document.get('source', 'scraped')),
                'topic': self.escape_sql_string(document.get('topic', 'general')),
                'url': self.escape_sql_string(document.get('url', '')),
                'document_type': self.escape_sql_string(document.get('document_type', 'scraped')),
                'metadata': json.dumps(metadata),
                'content_length': len(content),
                'chunks': []
            }
            
            # Process chunks and embeddings
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                doc_data['chunks'].append({
                    'chunk_index': i,
                    'chunk_content': self.escape_sql_string(chunk),
                    'embedding': embedding.tolist()
                })
            
            self.processed_count += 1
            self.total_chunks += len(chunks)
            
            logger.info(f"  ✅ Processed {len(chunks)} chunks for: {title}")
            return doc_data
            
        except Exception as e:
            logger.error(f"❌ Failed to process document '{document.get('title', 'Unknown')}': {e}")
            return None
    
    def generate_sql_statements(self, processed_docs: List[Dict]) -> List[str]:
        """Generate SQL statements for insertion"""
        sql_statements = []
        
        for doc in processed_docs:
            if not doc:
                continue
                
            # Insert document
            doc_sql = f"""
INSERT INTO medical_documents (title, content, source, topic, url, document_type, metadata, content_length)
VALUES ('{doc['title']}', '{doc['content']}', '{doc['source']}', '{doc['topic']}', '{doc['url']}', '{doc['document_type']}', '{doc['metadata']}', {doc['content_length']});
"""
            sql_statements.append(doc_sql.strip())
            
            # Insert embeddings (we'll need to get the document ID first)
            for chunk in doc['chunks']:
                embedding_array = "{" + ",".join(map(str, chunk['embedding'])) + "}"
                chunk_sql = f"""
INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, embedding)
VALUES (currval(pg_get_serial_sequence('medical_documents', 'id')), {chunk['chunk_index']}, '{chunk['chunk_content']}', '{embedding_array}');
"""
                sql_statements.append(chunk_sql.strip())
        
        return sql_statements
    
    def process_scraped_documents(self, json_file: str = "scraped_medical_documents.json"):
        """Process all documents from scraped JSON file"""
        logger.info("🚀 Starting processing for scraped documents")
        
        # Load scraped documents
        if not os.path.exists(json_file):
            raise FileNotFoundError(f"Scraped documents file not found: {json_file}")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        documents = data.get('documents', [])
        logger.info(f"📚 Found {len(documents)} documents to process")
        
        # Process documents
        processed_docs = []
        for i, document in enumerate(documents):
            logger.info(f"\n[{i+1}/{len(documents)}] Processing document...")
            processed_doc = self.process_document(document)
            if processed_doc:
                processed_docs.append(processed_doc)
        
        # Generate SQL statements
        logger.info("📝 Generating SQL statements...")
        sql_statements = self.generate_sql_statements(processed_docs)
        
        # Save SQL to file
        sql_file = f"embedding_sql_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
        with open(sql_file, 'w', encoding='utf-8') as f:
            f.write("-- Medical Documents Embedding SQL\n")
            f.write(f"-- Generated: {datetime.now().isoformat()}\n")
            f.write(f"-- Documents: {len(processed_docs)}\n")
            f.write(f"-- Total chunks: {self.total_chunks}\n\n")
            
            for sql in sql_statements:
                f.write(sql + "\n\n")
        
        logger.info(f"💾 Saved SQL statements to: {sql_file}")
        
        # Create summary
        logger.info("\n🎉 Processing completed!")
        logger.info(f"✅ Successfully processed: {self.processed_count} documents")
        logger.info(f"📄 Total chunks created: {self.total_chunks}")
        logger.info(f"📝 SQL file: {sql_file}")
        
        return sql_file

def main():
    try:
        embedder = MCPDocumentEmbedder()
        sql_file = embedder.process_scraped_documents()
        
        print(f"\n🎯 Next steps:")
        print(f"1. Use MCP tools to execute the SQL in: {sql_file}")
        print(f"2. Verify documents are inserted correctly")
        print(f"3. Check embedding dimensions and counts")
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 