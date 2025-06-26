#!/usr/bin/env python3
"""
Batch upload script for medical documents and embeddings to Supabase
"""

import os
import json
import time
from pathlib import Path

# Directory containing SQL batch files
BATCH_DIR = Path(__file__).parent

def upload_documents():
    """Upload documents to Supabase"""
    print("Starting document upload...")
    
    # Read the documents SQL file
    doc_file = BATCH_DIR / "new_documents_20250626_130806.sql"
    if not doc_file.exists():
        print(f"Document file not found: {doc_file}")
        return False
    
    with open(doc_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into individual INSERT statements
    lines = content.strip().split('\n')
    insert_statements = []
    current_statement = ""
    
    for line in lines:
        if line.startswith('--') or not line.strip():
            continue
        
        if line.startswith('INSERT INTO medical_documents'):
            if current_statement:
                insert_statements.append(current_statement.strip())
            current_statement = line
        else:
            current_statement += "\n" + line
    
    if current_statement:
        insert_statements.append(current_statement.strip())
    
    print(f"Found {len(insert_statements)} document insert statements")
    
    # Note: In practice, these would be executed via MCP tools
    # For demonstration, we'll show the structure
    batch_size = 10
    total_batches = (len(insert_statements) + batch_size - 1) // batch_size
    
    for i in range(0, len(insert_statements), batch_size):
        batch = insert_statements[i:i+batch_size]
        batch_num = i // batch_size + 1
        
        print(f"Processing document batch {batch_num}/{total_batches} ({len(batch)} records)")
        
        # Combine multiple INSERT statements into one batch
        batch_sql = "\n".join(batch)
        
        # Save batch for manual execution if needed
        batch_file = BATCH_DIR / f"doc_batch_{batch_num:03d}.sql"
        with open(batch_file, 'w', encoding='utf-8') as f:
            f.write(batch_sql)
        
        time.sleep(0.1)  # Small delay between batches
    
    print("Document upload preparation complete!")
    return True

def upload_embeddings():
    """Upload embeddings to Supabase"""
    print("Starting embedding upload...")
    
    # Find all embedding batch files
    embedding_files = sorted(BATCH_DIR.glob("new_embeddings_batch_*_20250626_130806.sql"))
    
    if not embedding_files:
        print("No embedding batch files found")
        return False
    
    print(f"Found {len(embedding_files)} embedding batch files")
    
    for i, file in enumerate(embedding_files, 1):
        print(f"Processing embedding file {i}/{len(embedding_files)}: {file.name}")
        
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Count INSERT statements
        insert_count = content.count('INSERT INTO document_embeddings')
        print(f"  - Contains {insert_count} embedding records")
        
        time.sleep(0.1)  # Small delay between files
    
    print("Embedding upload preparation complete!")
    return True

def verify_data():
    """Verify uploaded data"""
    print("Data verification would check:")
    print("- Document count in medical_documents table")
    print("- Embedding count in document_embeddings table")
    print("- Vector dimensions (should be 768)")
    print("- Foreign key relationships")
    
def main():
    """Main upload process"""
    print("=" * 60)
    print("RAG System Database Upload Script")
    print("=" * 60)
    
    # Upload documents first
    if not upload_documents():
        print("Document upload failed!")
        return
    
    # Upload embeddings
    if not upload_embeddings():
        print("Embedding upload failed!")
        return
    
    # Verify data
    verify_data()
    
    print("\nBatch upload preparation complete!")
    print("Next steps:")
    print("1. Execute document batches via MCP tools")
    print("2. Execute embedding batches via MCP tools")
    print("3. Verify data integrity")
    print("4. Test RAG system with new documents")

if __name__ == "__main__":
    main() 