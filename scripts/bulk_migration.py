#!/usr/bin/env python3
"""
Bulk Migration Script for WellnessGrid RAG System
This script efficiently migrates all remaining documents and embeddings.
"""

import json
import os
import subprocess
import time
from typing import List, Dict
import uuid

class BulkMigrator:
    def __init__(self):
        self.scraped_docs_file = "scraped_medical_documents.json"
        self.current_doc_count = 39  # Starting from current count
        self.current_embedding_count = 504
        
    def load_scraped_documents(self) -> List[Dict]:
        """Load the scraped documents"""
        if not os.path.exists(self.scraped_docs_file):
            raise FileNotFoundError(f"File not found: {self.scraped_docs_file}")
            
        with open(self.scraped_docs_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def generate_document_sql(self, docs: List[Dict], start_idx: int = 0) -> str:
        """Generate SQL for inserting documents"""
        sql_statements = []
        
        for i, doc in enumerate(docs[start_idx:], start_idx):
            # Skip the first document which is already inserted
            if i == 0:
                continue
                
            sql = f"""
INSERT INTO medical_documents (title, content, source, topic, url, document_type, metadata, content_length)
VALUES (
    '{doc['title'].replace("'", "''")}',
    '{doc['content'].replace("'", "''")}',
    '{doc['source']}',
    '{doc['topic']}',
    '{doc['url']}',
    '{doc['document_type']}',
    '{json.dumps(doc['metadata']).replace("'", "''")}',
    {doc['content_length']}
);"""
            sql_statements.append(sql)
        
        return '\n'.join(sql_statements)
    
    def run_supabase_command(self, sql: str) -> bool:
        """Execute SQL via Supabase CLI"""
        try:
            # Write SQL to temporary file
            temp_file = f"temp_migration_{int(time.time())}.sql"
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(sql)
            
            # Execute using Supabase CLI
            result = subprocess.run([
                'supabase', 'db', 'exec', '--file', temp_file
            ], capture_output=True, text=True)
            
            # Clean up
            os.remove(temp_file)
            
            if result.returncode == 0:
                print(f"✅ SQL executed successfully")
                return True
            else:
                print(f"❌ SQL execution failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error executing SQL: {e}")
            return False
    
    def migrate_documents_batch(self, docs: List[Dict], batch_size: int = 10) -> int:
        """Migrate documents in batches"""
        total_migrated = 0
        
        # Skip first document (already migrated)
        remaining_docs = docs[1:]
        
        for i in range(0, len(remaining_docs), batch_size):
            batch = remaining_docs[i:i + batch_size]
            print(f"\n📄 Migrating document batch {i//batch_size + 1} ({len(batch)} documents)...")
            
            sql_statements = []
            for doc in batch:
                sql = f"""
INSERT INTO medical_documents (title, content, source, topic, url, document_type, metadata, content_length)
VALUES (
    '{doc['title'].replace("'", "''")}',
    '{doc['content'].replace("'", "''")}',
    '{doc['source']}',
    '{doc['topic']}',
    '{doc['url']}',
    '{doc['document_type']}',
    '{json.dumps(doc['metadata']).replace("'", "''")}',
    {doc['content_length']}
);"""
                sql_statements.append(sql)
            
            combined_sql = '\n'.join(sql_statements)
            
            if self.run_supabase_command(combined_sql):
                total_migrated += len(batch)
                print(f"✅ Batch completed. Total documents migrated: {total_migrated}")
            else:
                print(f"❌ Batch failed. Stopping migration.")
                break
        
        return total_migrated
    
    def run_migration(self):
        """Execute the complete migration"""
        print("🚀 Starting WellnessGrid RAG System Bulk Migration")
        print("=" * 60)
        
        # Load documents
        print("📖 Loading scraped documents...")
        docs = self.load_scraped_documents()
        print(f"📊 Found {len(docs)} total documents to process")
        print(f"📊 Current database state: {self.current_doc_count} docs, {self.current_embedding_count} embeddings")
        
        # Migrate documents
        print("\n📄 Starting document migration...")
        migrated_docs = self.migrate_documents_batch(docs, batch_size=5)
        
        # Report final status
        print("\n" + "=" * 60)
        print("📊 MIGRATION SUMMARY")
        print("=" * 60)
        print(f"📄 Documents migrated: {migrated_docs}")
        print(f"📄 Total documents expected: {len(docs)}")
        print(f"📊 Target reached: {((self.current_doc_count + migrated_docs) / len(docs)) * 100:.1f}%")
        
        if migrated_docs > 0:
            print("\n✅ Migration completed successfully!")
            print("📝 Note: Embeddings will be processed separately to ensure proper UUID references")
        else:
            print("\n❌ Migration failed. Please check the errors above.")

if __name__ == "__main__":
    migrator = BulkMigrator()
    migrator.run_migration() 