#!/usr/bin/env python3
"""
Smart upload script for remaining medical documents.
Converts SQL format to match actual database schema with metadata JSONB column.
Only uploads documents that don't already exist in the database.
"""

import json
import re
import hashlib
from datetime import datetime
import sys
import os

# Add the parent directory to the path to import the Supabase MCP functions
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

def parse_sql_insert(line):
    """Parse an SQL INSERT line to extract values."""
    # Pattern to match INSERT INTO ... VALUES (...)
    pattern = r"INSERT INTO medical_documents \(.*?\) VALUES \((.*?)\);"
    match = re.search(pattern, line)
    if not match:
        return None
    
    values_str = match.group(1)
    
    # Parse the values (this is simplified and may need adjustment for complex strings)
    values = []
    current_value = ""
    in_quotes = False
    quote_char = None
    
    i = 0
    while i < len(values_str):
        char = values_str[i]
        
        if not in_quotes:
            if char in ["'", '"']:
                in_quotes = True
                quote_char = char
                current_value += char
            elif char == ',' and not in_quotes:
                values.append(current_value.strip())
                current_value = ""
            else:
                current_value += char
        else:
            if char == quote_char and (i == 0 or values_str[i-1] != '\\'):
                in_quotes = False
                quote_char = None
            current_value += char
        
        i += 1
    
    # Add the last value
    if current_value.strip():
        values.append(current_value.strip())
    
    return values

def clean_sql_value(value):
    """Clean SQL value by removing quotes and handling NULL."""
    value = value.strip()
    if value.upper() == 'NULL':
        return None
    if value.startswith("'") and value.endswith("'"):
        # Remove quotes and handle escaped quotes
        return value[1:-1].replace("\\'", "'").replace("''", "'")
    return value

def load_existing_documents():
    """Load existing document IDs from database."""
    try:
        # Import inside function to avoid issues if modules aren't available
        from mcp_supabase_execute_sql import mcp_supabase_execute_sql
        
        result = mcp_supabase_execute_sql(
            query="SELECT id FROM medical_documents"
        )
        
        if result.get('success'):
            existing_ids = set()
            for row in result.get('data', []):
                existing_ids.add(row['id'])
            return existing_ids
        else:
            print(f"Error loading existing documents: {result.get('error', 'Unknown error')}")
            return set()
    except Exception as e:
        print(f"Error importing MCP function or querying database: {e}")
        return set()

def upload_document(doc_data):
    """Upload a single document to the database."""
    try:
        from mcp_supabase_execute_sql import mcp_supabase_execute_sql
        
        # Build metadata object
        metadata = {
            'document_type': doc_data.get('document_type'),
            'category': doc_data.get('category'),
            'scraped_date': doc_data.get('scraped_date'),
            'content_hash': doc_data.get('content_hash'),
            'word_count': doc_data.get('word_count'),
            'embedding_date': doc_data.get('embedding_date')
        }
        
        # Clean None values from metadata
        metadata = {k: v for k, v in metadata.items() if v is not None}
        
        # Build the SQL insert query
        query = """
        INSERT INTO medical_documents (id, title, content, source, topic, url, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """
        
        # Execute the query
        result = mcp_supabase_execute_sql(
            query=query,
            params=[
                doc_data['id'],
                doc_data['title'],
                doc_data['content'],
                doc_data['source'],
                doc_data['topic'],
                doc_data['url'],
                json.dumps(metadata),
                doc_data['created_at']
            ]
        )
        
        if result.get('success'):
            print(f"✓ Uploaded document: {doc_data['id'][:12]}... ({doc_data['source']})")
            return True
        else:
            print(f"✗ Failed to upload document {doc_data['id'][:12]}...: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"✗ Error uploading document {doc_data.get('id', 'unknown')[:12]}...: {e}")
        return False

def main():
    print("Smart Medical Document Upload Tool")
    print("=" * 50)
    
    # Path to the comprehensive documents file
    sql_file = os.path.join(os.path.dirname(__file__), 'new_documents_20250626_130806.sql')
    
    if not os.path.exists(sql_file):
        print(f"Error: SQL file not found: {sql_file}")
        return
    
    print(f"Reading documents from: {sql_file}")
    
    # Load existing document IDs from database
    print("Loading existing documents from database...")
    existing_ids = load_existing_documents()
    print(f"Found {len(existing_ids)} existing documents in database")
    
    # Parse documents from SQL file
    documents_to_upload = []
    total_documents = 0
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('INSERT INTO medical_documents'):
                total_documents += 1
                values = parse_sql_insert(line)
                if values and len(values) >= 13:
                    # Map values to column names based on the original schema
                    doc_data = {
                        'id': clean_sql_value(values[0]),
                        'title': clean_sql_value(values[1]),
                        'content': clean_sql_value(values[2]),
                        'source': clean_sql_value(values[3]),
                        'topic': clean_sql_value(values[4]),
                        'url': clean_sql_value(values[5]),
                        'document_type': clean_sql_value(values[6]),
                        'category': clean_sql_value(values[7]),
                        'scraped_date': clean_sql_value(values[8]),
                        'content_hash': clean_sql_value(values[9]),
                        'word_count': clean_sql_value(values[10]),
                        'created_at': clean_sql_value(values[11]),
                        'embedding_date': clean_sql_value(values[12])
                    }
                    
                    # Convert word_count to integer if possible
                    if doc_data['word_count'] and doc_data['word_count'].isdigit():
                        doc_data['word_count'] = int(doc_data['word_count'])
                    
                    # Only add if document doesn't exist
                    if doc_data['id'] not in existing_ids:
                        documents_to_upload.append(doc_data)
    
    print(f"Parsed {total_documents} total documents from SQL file")
    print(f"Found {len(documents_to_upload)} new documents to upload")
    
    if not documents_to_upload:
        print("No new documents to upload. All documents already exist in database.")
        return
    
    # Upload documents in batches
    batch_size = 10
    uploaded_count = 0
    failed_count = 0
    
    print(f"\nUploading {len(documents_to_upload)} documents in batches of {batch_size}...")
    
    for i in range(0, len(documents_to_upload), batch_size):
        batch = documents_to_upload[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (len(documents_to_upload) + batch_size - 1) // batch_size
        
        print(f"\nBatch {batch_num}/{total_batches} ({len(batch)} documents):")
        
        for doc_data in batch:
            if upload_document(doc_data):
                uploaded_count += 1
            else:
                failed_count += 1
    
    print(f"\n" + "=" * 50)
    print(f"Upload Summary:")
    print(f"Successfully uploaded: {uploaded_count}")
    print(f"Failed uploads: {failed_count}")
    print(f"Total processed: {uploaded_count + failed_count}")
    
    if uploaded_count > 0:
        print(f"\n✓ Successfully added {uploaded_count} new medical documents to the database!")
    
    if failed_count > 0:
        print(f"\n⚠ {failed_count} documents failed to upload. Check the error messages above.")

if __name__ == "__main__":
    main() 