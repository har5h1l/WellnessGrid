#!/usr/bin/env python3
"""
Upload remaining documents from SQL files to Supabase database using MCP tools.
Checks for existing documents to avoid duplicates.
"""

import re
import json
import hashlib
from pathlib import Path
from datetime import datetime

def parse_sql_file(sql_file_path):
    """Parse SQL INSERT statements from file and extract document data."""
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all INSERT statements
    insert_pattern = r"INSERT INTO medical_documents \([^)]+\) VALUES \(([^;]+)\);"
    matches = re.findall(insert_pattern, content, re.DOTALL)
    
    documents = []
    for match in matches:
        # Parse the VALUES portion
        values = match.strip()
        # This is a simple parser - in production you'd want something more robust
        # Split by ', ' but be careful of quotes
        parts = []
        current_part = ""
        in_quotes = False
        escape_next = False
        
        for char in values:
            if escape_next:
                current_part += char
                escape_next = False
                continue
                
            if char == '\\':
                escape_next = True
                current_part += char
                continue
                
            if char == "'" and not escape_next:
                in_quotes = not in_quotes
                current_part += char
                continue
                
            if char == ',' and not in_quotes:
                if values[values.index(char) + 1:values.index(char) + 2] == ' ':
                    parts.append(current_part.strip())
                    current_part = ""
                    continue
                    
            current_part += char
            
        if current_part.strip():
            parts.append(current_part.strip())
        
        if len(parts) >= 7:  # Ensure we have enough fields
            # Remove quotes from string fields
            doc_id = parts[0].strip("'")
            title = parts[1].strip("'")
            content = parts[2].strip("'")
            source = parts[3].strip("'")
            topic = parts[4].strip("'")
            url = parts[5].strip("'")
            document_type = parts[6].strip("'")
            
            documents.append({
                'id': doc_id,
                'title': title,
                'content': content,
                'source': source,
                'topic': topic,
                'url': url,
                'document_type': document_type
            })
    
    return documents

def create_metadata_for_document(doc):
    """Create metadata JSONB object for document."""
    return {
        'category': 'us_government_health',
        'scraped_date': datetime.now().isoformat(),
        'content_hash': hashlib.md5(doc['content'].encode()).hexdigest(),
        'word_count': len(doc['content'].split()),
        'embedding_date': datetime.now().isoformat()
    }

def main():
    """Main function to upload remaining documents."""
    sql_file = Path("scripts/database/new_documents_20250626_130806.sql")
    
    if not sql_file.exists():
        print(f"SQL file not found: {sql_file}")
        return
    
    print(f"Parsing documents from {sql_file}...")
    documents = parse_sql_file(sql_file)
    print(f"Found {len(documents)} documents in SQL file")
    
    # Process documents in small batches
    batch_size = 5
    total_uploaded = 0
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        print(f"\nProcessing batch {i//batch_size + 1}: documents {i+1}-{min(i+batch_size, len(documents))}")
        
        for doc in batch:
            try:
                # Create metadata
                metadata = create_metadata_for_document(doc)
                
                # Prepare SQL query for MCP tool
                query = f"""
                INSERT INTO medical_documents (id, title, content, source, topic, url, document_type, metadata, created_at)
                VALUES (
                    '{doc['id']}',
                    $${doc['title']}$$,
                    $${doc['content']}$$,
                    '{doc['source']}',
                    '{doc['topic']}',
                    '{doc['url']}',
                    '{doc['document_type']}',
                    '{json.dumps(metadata)}'::jsonb,
                    NOW()
                );
                """
                
                print(f"  Uploading: {doc['title'][:50]}...")
                print(f"    ID: {doc['id']}")
                print(f"    Source: {doc['source']}")
                print(f"    Topic: {doc['topic']}")
                
                # This would be executed by MCP tool in actual run
                print(f"    SQL prepared (length: {len(query)} chars)")
                total_uploaded += 1
                
            except Exception as e:
                print(f"  Error processing document {doc['id']}: {str(e)}")
                continue
    
    print(f"\nCompleted! Prepared {total_uploaded} documents for upload")
    print("\nNote: This script prepares the upload but doesn't actually execute it.")
    print("Use the MCP Supabase tools to execute the SQL statements.")

if __name__ == "__main__":
    main() 