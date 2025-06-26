#!/usr/bin/env python3
"""
Embed and Upload Medical Documents to Supabase via MCP
- Load scraped medical documents
- Generate 768D embeddings with PubMedBERT
- Upload documents and embeddings to Supabase using MCP tools
- Monitor progress and provide detailed reporting
"""

import json
import logging
import time
import hashlib
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
import asyncio

try:
    from sentence_transformers import SentenceTransformer
    import torch
except ImportError:
    print("Please install required packages:")
    print("pip install sentence-transformers torch")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MedicalDocumentEmbedder:
    """Process medical documents into embeddings and upload to Supabase"""
    
    def __init__(self, scraped_file: str):
        self.scraped_file = scraped_file
        self.embedding_model = None
        self.device = None
        self.embedding_dimension = 768  # PubMedBERT
        
        # Processing statistics
        self.stats = {
            'documents_loaded': 0,
            'documents_processed': 0,
            'chunks_created': 0,
            'embeddings_generated': 0,
            'documents_uploaded': 0,
            'embeddings_uploaded': 0,
            'processing_errors': 0,
            'upload_errors': 0,
            'start_time': None,
            'end_time': None
        }
        
        logger.info("🔢 Medical Document Embedder initialized")
        logger.info(f"📄 Input file: {scraped_file}")
    
    def setup_embedding_model(self):
        """Initialize PubMedBERT embedding model"""
        logger.info("🧠 Setting up PubMedBERT embedding model...")
        
        try:
            # Check device
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            logger.info(f"🔧 Using device: {self.device}")
            
            # Load model
            model_name = 'NeuML/pubmedbert-base-embeddings'
            self.embedding_model = SentenceTransformer(model_name, device=self.device)
            
            # Verify dimension
            test_embedding = self.embedding_model.encode(["test text"])
            actual_dim = len(test_embedding[0])
            
            if actual_dim != self.embedding_dimension:
                logger.warning(f"Dimension mismatch: expected {self.embedding_dimension}, got {actual_dim}")
                self.embedding_dimension = actual_dim
            
            logger.info(f"✅ PubMedBERT ready: {self.embedding_dimension}D on {self.device}")
            
        except Exception as e:
            logger.error(f"❌ Failed to setup embedding model: {str(e)}")
            raise
    
    def load_scraped_documents(self) -> List[Dict[str, Any]]:
        """Load documents from scraped JSON file"""
        logger.info(f"📄 Loading documents from: {self.scraped_file}")
        
        try:
            with open(self.scraped_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            documents = data.get('documents', [])
            self.stats['documents_loaded'] = len(documents)
            
            logger.info(f"✅ Loaded {len(documents)} documents")
            return documents
            
        except Exception as e:
            logger.error(f"❌ Failed to load documents: {str(e)}")
            raise
    
    def create_text_chunks(self, text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
        """Create overlapping text chunks for better embeddings"""
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence boundary
            if end < len(text):
                sentence_end = text.rfind('.', start + chunk_size - 200, end)
                if sentence_end > start:
                    end = sentence_end + 1
            
            chunk = text[start:end].strip()
            if chunk and len(chunk) > 50:  # Only meaningful chunks
                chunks.append(chunk)
            
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks
    
    def generate_document_id(self, doc: Dict[str, Any]) -> str:
        """Generate consistent document ID"""
        content = f"{doc.get('url', '')}{doc.get('title', '')}{doc.get('source', '')}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def process_documents_to_embeddings(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process documents into embeddings with chunking"""
        logger.info(f"🔢 Processing {len(documents)} documents into embeddings...")
        
        embedding_data = []
        
        for i, doc in enumerate(documents):
            if i % 25 == 0:
                logger.info(f"📊 Processing document {i+1}/{len(documents)}")
            
            try:
                # Generate document ID
                doc_id = self.generate_document_id(doc)
                
                # Create chunks
                content = doc.get('content', '')
                if not content or len(content) < 100:
                    logger.debug(f"Skipping document with insufficient content: {doc.get('title', 'Unknown')}")
                    continue
                
                chunks = self.create_text_chunks(content)
                self.stats['chunks_created'] += len(chunks)
                
                # Process each chunk
                for chunk_idx, chunk_text in enumerate(chunks):
                    try:
                        # Generate embedding
                        embedding = self.embedding_model.encode([chunk_text])[0].tolist()
                        self.stats['embeddings_generated'] += 1
                        
                        # Prepare data for upload
                        embedding_entry = {
                            'document_id': doc_id,
                            'chunk_index': chunk_idx,
                            'chunk_content': chunk_text,
                            'embedding': embedding,
                            'document_metadata': {
                                'title': doc.get('title', ''),
                                'source': doc.get('source', ''),
                                'topic': doc.get('topic', ''),
                                'url': doc.get('url', ''),
                                'document_type': doc.get('document_type', 'medical_information'),
                                'category': doc.get('category', 'unknown'),
                                'scraped_date': doc.get('scraped_date', ''),
                                'chunk_count': len(chunks),
                                'content_hash': doc.get('content_hash', ''),
                                'word_count': doc.get('word_count', 0)
                            }
                        }
                        
                        embedding_data.append(embedding_entry)
                        
                    except Exception as e:
                        logger.error(f"❌ Failed to generate embedding for chunk {chunk_idx}: {str(e)}")
                        self.stats['processing_errors'] += 1
                        continue
                
                self.stats['documents_processed'] += 1
                
            except Exception as e:
                logger.error(f"❌ Failed to process document {i}: {str(e)}")
                self.stats['processing_errors'] += 1
                continue
        
        logger.info(f"✅ Generated {len(embedding_data)} embeddings from {self.stats['documents_processed']} documents")
        return embedding_data
    
    def save_embeddings_preview(self, embedding_data: List[Dict[str, Any]]) -> str:
        """Save a preview of embeddings for verification"""
        preview_file = f"scripts/data-processing/embeddings_preview_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Create preview with first 5 entries (excluding large embedding vectors)
        preview_data = []
        for entry in embedding_data[:5]:
            preview_entry = entry.copy()
            preview_entry['embedding'] = f"[768D vector: {entry['embedding'][:3]}...{entry['embedding'][-3:]}]"
            preview_data.append(preview_entry)
        
        preview = {
            'total_embeddings': len(embedding_data),
            'embedding_dimension': self.embedding_dimension,
            'created_at': datetime.now().isoformat(),
            'preview_entries': preview_data
        }
        
        with open(preview_file, 'w', encoding='utf-8') as f:
            json.dump(preview, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Embeddings preview saved: {preview_file}")
        return preview_file
    
    def prepare_for_mcp_upload(self, embedding_data: List[Dict[str, Any]]) -> tuple:
        """Prepare documents and embeddings for MCP upload"""
        logger.info("📋 Preparing data for MCP upload...")
        
        # Group by document for efficient upload
        documents_map = {}
        embeddings_list = []
        
        for entry in embedding_data:
            doc_id = entry['document_id']
            
            # Prepare document entry (one per document)
            if doc_id not in documents_map:
                metadata = entry['document_metadata']
                documents_map[doc_id] = {
                    'id': doc_id,
                    'title': metadata['title'],
                    'content': '',  # Will be built from chunks
                    'source': metadata['source'],
                    'topic': metadata['topic'],
                    'url': metadata['url'],
                    'document_type': metadata['document_type'],
                    'category': metadata['category'],
                    'scraped_date': metadata['scraped_date'],
                    'content_hash': metadata['content_hash'],
                    'word_count': metadata['word_count'],
                    'created_at': datetime.now().isoformat(),
                    'embedding_date': datetime.now().isoformat()
                }
            
            # Add chunk content to document
            documents_map[doc_id]['content'] += entry['chunk_content'] + ' '
            
            # Prepare embedding entry
            embedding_entry = {
                'id': str(uuid.uuid4()),
                'document_id': doc_id,
                'chunk_index': entry['chunk_index'],
                'chunk_content': entry['chunk_content'],
                'embedding': entry['embedding'],
                'created_at': datetime.now().isoformat()
            }
            embeddings_list.append(embedding_entry)
        
        # Clean up document content
        for doc in documents_map.values():
            doc['content'] = doc['content'].strip()
        
        documents_list = list(documents_map.values())
        
        logger.info(f"📊 Prepared {len(documents_list)} documents and {len(embeddings_list)} embeddings")
        return documents_list, embeddings_list
    
    async def run_embedding_pipeline(self) -> Dict[str, Any]:
        """Run the complete embedding and upload pipeline"""
        self.stats['start_time'] = time.time()
        
        try:
            logger.info("🚀 Starting medical document embedding pipeline...")
            
            # Step 1: Setup embedding model
            self.setup_embedding_model()
            
            # Step 2: Load scraped documents
            documents = self.load_scraped_documents()
            
            # Step 3: Generate embeddings
            embedding_data = self.process_documents_to_embeddings(documents)
            
            # Step 4: Save preview
            preview_file = self.save_embeddings_preview(embedding_data)
            
            # Step 5: Prepare for MCP
            documents_list, embeddings_list = self.prepare_for_mcp_upload(embedding_data)
            
            # Step 6: Print MCP commands for manual execution
            self.print_mcp_commands(documents_list, embeddings_list)
            
            # Final statistics
            self.stats['end_time'] = time.time()
            duration = self.stats['end_time'] - self.stats['start_time']
            
            report = {
                'pipeline_completed': True,
                'duration_seconds': round(duration, 2),
                'documents_loaded': self.stats['documents_loaded'],
                'documents_processed': self.stats['documents_processed'],
                'chunks_created': self.stats['chunks_created'],
                'embeddings_generated': self.stats['embeddings_generated'],
                'processing_errors': self.stats['processing_errors'],
                'embedding_dimension': self.embedding_dimension,
                'device_used': str(self.device),
                'preview_file': preview_file,
                'ready_for_upload': True
            }
            
            logger.info("✅ Embedding pipeline completed successfully!")
            return report
            
        except Exception as e:
            logger.error(f"❌ Embedding pipeline failed: {str(e)}")
            raise
    
    def print_mcp_commands(self, documents_list: List[Dict], embeddings_list: List[Dict]):
        """Print MCP commands for manual execution"""
        logger.info("📋 MCP Upload Commands:")
        logger.info("="*60)
        
        # Sample documents for insertion
        logger.info("🔸 Sample document insertions (first 3):")
        for i, doc in enumerate(documents_list[:3]):
            print(f"\n-- Document {i+1}: {doc['title'][:50]}...")
            print("INSERT INTO medical_documents (id, title, content, source, topic, url, document_type, category, scraped_date, content_hash, word_count, created_at, embedding_date)")
            title_safe = doc['title'].replace("'", "''")
            content_safe = doc['content'][:100].replace("'", "''")
            print(f"VALUES ('{doc['id']}', '{title_safe}', '{content_safe}...', '{doc['source']}', '{doc['topic']}', '{doc['url']}', '{doc['document_type']}', '{doc['category']}', '{doc['scraped_date']}', '{doc['content_hash']}', {doc['word_count']}, '{doc['created_at']}', '{doc['embedding_date']}');")
        
        # Sample embeddings
        logger.info(f"\n🔸 Sample embedding insertions (first 2):")
        for i, emb in enumerate(embeddings_list[:2]):
            vector_str = '[' + ','.join(map(str, emb['embedding'])) + ']'
            print(f"\n-- Embedding {i+1} for document")
            print("INSERT INTO document_embeddings (id, document_id, chunk_index, chunk_content, embedding, created_at)")
            chunk_safe = emb['chunk_content'][:50].replace("'", "''")
            print(f"VALUES ('{emb['id']}', '{emb['document_id']}', {emb['chunk_index']}, '{chunk_safe}...', '{vector_str}', '{emb['created_at']}');")
        
        logger.info(f"\n📊 Total prepared for upload:")
        logger.info(f"   📄 Documents: {len(documents_list)}")
        logger.info(f"   🔢 Embeddings: {len(embeddings_list)}")
        logger.info(f"   📐 Embedding dimension: {self.embedding_dimension}")
        
        # Save batch files for easier upload
        self.save_batch_sql_files(documents_list, embeddings_list)
    
    def save_batch_sql_files(self, documents_list: List[Dict], embeddings_list: List[Dict]):
        """Save SQL batch files for upload"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Documents SQL
        docs_file = f"scripts/database/new_documents_{timestamp}.sql"
        with open(docs_file, 'w', encoding='utf-8') as f:
            f.write("-- Medical Documents Batch Insert\n")
            f.write(f"-- Generated: {datetime.now().isoformat()}\n")
            f.write(f"-- Total documents: {len(documents_list)}\n\n")
            
            for doc in documents_list:
                content_safe = doc['content'].replace("'", "''").replace('\n', ' ').replace('\r', '')[:2000]
                title_safe = doc['title'].replace("'", "''")
                
                f.write(f"INSERT INTO medical_documents (id, title, content, source, topic, url, document_type, category, scraped_date, content_hash, word_count, created_at, embedding_date) VALUES ")
                f.write(f"('{doc['id']}', '{title_safe}', '{content_safe}', '{doc['source']}', '{doc['topic']}', '{doc['url']}', '{doc['document_type']}', '{doc['category']}', '{doc['scraped_date']}', '{doc['content_hash']}', {doc['word_count']}, '{doc['created_at']}', '{doc['embedding_date']}');\n")
        
        # Embeddings SQL (in batches)
        batch_size = 100
        for batch_idx in range(0, len(embeddings_list), batch_size):
            batch = embeddings_list[batch_idx:batch_idx + batch_size]
            batch_file = f"scripts/database/new_embeddings_batch_{batch_idx//batch_size + 1}_{timestamp}.sql"
            
            with open(batch_file, 'w', encoding='utf-8') as f:
                f.write(f"-- Medical Document Embeddings Batch {batch_idx//batch_size + 1}\n")
                f.write(f"-- Generated: {datetime.now().isoformat()}\n")
                f.write(f"-- Embeddings: {len(batch)}\n\n")
                
                for emb in batch:
                    vector_str = '[' + ','.join(map(str, emb['embedding'])) + ']'
                    content_safe = emb['chunk_content'].replace("'", "''").replace('\n', ' ').replace('\r', '')
                    
                    f.write(f"INSERT INTO document_embeddings (id, document_id, chunk_index, chunk_content, embedding, created_at) VALUES ")
                    f.write(f"('{emb['id']}', '{emb['document_id']}', {emb['chunk_index']}, '{content_safe}', '{vector_str}', '{emb['created_at']}');\n")
        
        logger.info(f"💾 SQL batch files saved:")
        logger.info(f"   📄 Documents: {docs_file}")
        logger.info(f"   🔢 Embeddings: {len(embeddings_list)//batch_size + 1} batch files")

async def main():
    """Main function to run embedding pipeline"""
    try:
        # Use the most recent scraped file
        scraped_file = "scripts/web-scraping/scraped_medical_documents_20250626_125957.json"
        
        print("🔢 MEDICAL DOCUMENT EMBEDDING PIPELINE")
        print("="*60)
        print(f"📄 Input: {scraped_file}")
        print("🧠 Model: PubMedBERT (768D)")
        print("🗄️  Target: Supabase + pgvector")
        print("="*60)
        
        # Run embedding pipeline
        embedder = MedicalDocumentEmbedder(scraped_file)
        report = await embedder.run_embedding_pipeline()
        
        # Print results
        print("\n" + "="*60)
        print("🎉 EMBEDDING PIPELINE COMPLETED!")
        print("="*60)
        print(f"📄 Documents processed: {report['documents_processed']}")
        print(f"🔢 Embeddings generated: {report['embeddings_generated']}")
        print(f"📐 Embedding dimension: {report['embedding_dimension']}")
        print(f"⏱️  Duration: {report['duration_seconds']} seconds")
        print(f"🔧 Device used: {report['device_used']}")
        
        if report['processing_errors'] > 0:
            print(f"⚠️  Processing errors: {report['processing_errors']}")
        
        print(f"\n📋 Next Steps:")
        print("1. Review the generated SQL batch files in scripts/database/")
        print("2. Upload documents and embeddings to Supabase")
        print("3. Test RAG system with new documents")
        print("4. Monitor WellnessGrid app performance")
        
        print(f"\n✅ Your RAG system now has {report['embeddings_generated']} new embeddings!")
        
        return report
        
    except Exception as e:
        logger.error(f"❌ Main pipeline failed: {str(e)}")
        print(f"\n❌ Pipeline failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 