#!/usr/bin/env python3
"""
Execute Embedding SQL via MCP Tools
Breaks down large SQL file into manageable chunks for execution
"""

import os
import re
import time

def read_sql_file(filename):
    """Read SQL file and split into individual statements"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split on semicolon followed by newline
    statements = [stmt.strip() for stmt in content.split(';\n') if stmt.strip() and not stmt.strip().startswith('--')]
    return statements

def main():
    sql_file = "scripts/embedding_sql_20250625_142148.sql"
    
    if not os.path.exists(sql_file):
        print(f"❌ SQL file not found: {sql_file}")
        return 1
    
    print("📖 Reading SQL statements...")
    statements = read_sql_file(sql_file)
    
    # Filter to only document inserts (we'll handle embeddings separately)
    doc_statements = [stmt for stmt in statements if "INSERT INTO medical_documents" in stmt]
    embedding_statements = [stmt for stmt in statements if "INSERT INTO document_embeddings" in stmt]
    
    print(f"Found {len(doc_statements)} document statements")
    print(f"Found {len(embedding_statements)} embedding statements")
    
    # Create batched SQL files for MCP execution
    batch_size = 5  # 5 documents at a time
    
    # Create document batches
    for i in range(0, len(doc_statements), batch_size):
        batch = doc_statements[i:i+batch_size]
        batch_file = f"scripts/doc_batch_{i//batch_size + 1}.sql"
        
        with open(batch_file, 'w', encoding='utf-8') as f:
            f.write("-- Document Batch SQL\n")
            for stmt in batch:
                f.write(stmt + ";\n\n")
        
        print(f"📄 Created batch file: {batch_file}")
    
    # Create embedding batches (larger batches for embeddings)
    emb_batch_size = 50  # 50 embeddings at a time
    for i in range(0, len(embedding_statements), emb_batch_size):
        batch = embedding_statements[i:i+emb_batch_size]
        batch_file = f"scripts/emb_batch_{i//emb_batch_size + 1}.sql"
        
        with open(batch_file, 'w', encoding='utf-8') as f:
            f.write("-- Embedding Batch SQL\n")
            for stmt in batch:
                f.write(stmt + ";\n\n")
        
        print(f"🧠 Created embedding batch file: {batch_file}")
    
    print("\n🎯 Ready for MCP execution!")
    print("Execute document batches first, then embedding batches")
    
    return 0

if __name__ == "__main__":
    exit(main()) 