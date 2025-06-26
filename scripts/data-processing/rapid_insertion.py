#!/usr/bin/env python3
"""
Rapid Document and Embedding Insertion
Efficiently processes scraped documents and creates real medical embeddings
"""

import json
import os
from sentence_transformers import SentenceTransformer
import time

def load_scraped_documents():
    """Load documents from the scraped JSON file"""
    scraped_file = "scripts/scraped_medical_documents_20250625_142110.json"
    
    if not os.path.exists(scraped_file):
        print(f"❌ Scraped documents file not found: {scraped_file}")
        return []
    
    with open(scraped_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"📄 Loaded {len(data)} scraped documents")
    return data

def create_medical_embeddings(text_chunks, model):
    """Create medical embeddings using PubMedBERT"""
    print(f"🧠 Creating embeddings for {len(text_chunks)} chunks...")
    embeddings = model.encode(text_chunks, show_progress_bar=True)
    return embeddings

def chunk_text(text, chunk_size=1000, overlap=100):
    """Split text into overlapping chunks"""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to break at sentence boundary
        if end < len(text) and '.' in chunk[-100:]:
            last_period = chunk.rfind('.')
            if last_period > chunk_size - 200:  # Don't make chunks too small
                chunk = chunk[:last_period + 1]
                end = start + len(chunk)
        
        chunks.append(chunk.strip())
        start = end - overlap
        
        if end >= len(text):
            break
    
    return chunks

def generate_batch_sql(documents, start_idx=0, batch_size=10):
    """Generate SQL for a batch of documents with embeddings"""
    
    print("🤖 Loading PubMedBERT model...")
    model = SentenceTransformer('NeuML/pubmedbert-base-embeddings')
    
    doc_sql_statements = []
    embedding_sql_statements = []
    
    batch_docs = documents[start_idx:start_idx + batch_size]
    
    for doc in batch_docs:
        # Clean and prepare document content
        content = doc['content'][:50000]  # Limit content size
        title = doc['title'].replace("'", "''")  # Escape quotes
        content_clean = content.replace("'", "''").replace("\\", "\\\\")
        source = doc.get('source', 'scraped').replace("'", "''")
        
        # Generate document insertion SQL
        doc_sql = f"""
INSERT INTO medical_documents (title, content, source, topic, url, document_type, metadata, content_length)
VALUES (
    '{title}',
    '{content_clean}',
    '{source}',
    'general_health',
    '{doc.get('url', '')}',
    'article',
    '{{}}',
    {len(content)}
) RETURNING id;
"""
        doc_sql_statements.append(doc_sql.strip())
        
        # Create chunks and embeddings
        chunks = chunk_text(content, chunk_size=1000, overlap=100)
        if chunks:
            # Create embeddings for all chunks at once
            embeddings = create_medical_embeddings(chunks, model)
            
            # Generate embedding SQL statements
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_clean = chunk.replace("'", "''").replace("\\", "\\\\")
                embedding_vector = '[' + ','.join(map(str, embedding.tolist())) + ']'
                
                emb_sql = f"""
INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, embedding)
VALUES (
    (SELECT id FROM medical_documents WHERE title = '{title}' AND source = '{source}' LIMIT 1),
    {i},
    '{chunk_clean}',
    '{embedding_vector}'
);
"""
                embedding_sql_statements.append(emb_sql.strip())
    
    return doc_sql_statements, embedding_sql_statements

def main():
    """Main execution function"""
    print("🚀 Starting rapid document and embedding insertion...")
    
    # Load scraped documents
    documents = load_scraped_documents()
    if not documents:
        return
    
    # Process first batch of 5 documents to demonstrate
    print("📊 Processing first batch of 5 documents with real embeddings...")
    
    doc_sqls, emb_sqls = generate_batch_sql(documents, start_idx=0, batch_size=5)
    
    # Write to files for execution
    with open("scripts/batch_documents.sql", 'w', encoding='utf-8') as f:
        f.write("-- Document insertions\\n")
        for sql in doc_sqls:
            f.write(sql + "\\n\\n")
    
    with open("scripts/batch_embeddings.sql", 'w', encoding='utf-8') as f:
        f.write("-- Embedding insertions\\n")
        for sql in emb_sqls:
            f.write(sql + "\\n\\n")
    
    print(f"✅ Generated SQL for:")
    print(f"   • {len(doc_sqls)} documents")
    print(f"   • {len(emb_sqls)} embeddings")
    print(f"   • Files: scripts/batch_documents.sql, scripts/batch_embeddings.sql")
    
    print("\\n🎯 Next steps:")
    print("1. Execute the document SQL via MCP")
    print("2. Execute the embedding SQL via MCP")
    print("3. Verify the results")

if __name__ == "__main__":
    main() 