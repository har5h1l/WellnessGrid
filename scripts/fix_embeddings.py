#!/usr/bin/env python3
"""
Fix and Convert Embedding Vectors
Corrects format issues and ensures proper 768-dimensional vectors
"""

import re
import json

def fix_embedding_sql():
    """Fix the embedding SQL file to use proper vector format"""
    
    input_file = "scripts/embedding_sql_20250625_142148.sql"
    output_file = "scripts/corrected_embeddings.sql"
    
    print("🔧 Fixing embedding vector format...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix curly braces to square brackets for vectors
    # Find patterns like '{number,number,...}' and replace with '[number,number,...]'
    content = re.sub(r'\{([0-9.,\-e\s]+)\}', r'[\1]', content)
    
    # Ensure all vectors have exactly 768 dimensions
    # This is a simple check - in production you'd want more robust validation
    lines = content.split('\n')
    fixed_lines = []
    
    for line in lines:
        if 'INSERT INTO document_embeddings' in line and 'VALUES' in line:
            # Extract the vector part
            if '[' in line and ']' in line:
                start_idx = line.find('[')
                end_idx = line.find(']') + 1
                vector_str = line[start_idx:end_idx]
                
                # Count dimensions
                vector_nums = vector_str[1:-1].split(',')
                if len(vector_nums) != 768:
                    print(f"⚠️  Vector has {len(vector_nums)} dimensions, expected 768")
                    # Skip malformed vectors for now
                    continue
                
            fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))
    
    print(f"✅ Fixed embedding file saved as: {output_file}")
    return output_file

def create_sample_embeddings():
    """Create a few sample embeddings to test the system"""
    
    print("📝 Creating sample test embeddings...")
    
    # Get a valid document ID first
    sample_sql = """
-- Sample embeddings for testing
-- First get the document ID
SELECT id, title FROM medical_documents ORDER BY id DESC LIMIT 3;
    """
    
    # For testing, let's create a simple valid 768-dimensional vector
    test_vector = [0.1] * 768  # Simple test vector
    vector_str = '[' + ','.join(map(str, test_vector)) + ']'
    
    sample_embedding_sql = f"""
-- Test embedding insertion
INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, embedding)
VALUES (
    (SELECT id FROM medical_documents WHERE title LIKE '%Arthritis%' LIMIT 1), 
    0, 
    'Test chunk content for arthritis information.', 
    '{vector_str}'
);
"""
    
    with open("scripts/test_embeddings.sql", 'w') as f:
        f.write(sample_sql + "\n" + sample_embedding_sql)
    
    print("✅ Test embeddings file created: scripts/test_embeddings.sql")

if __name__ == "__main__":
    # First try to fix the existing file
    try:
        fix_embedding_sql()
    except FileNotFoundError:
        print("⚠️  Original embedding file not found, creating test embeddings instead")
    
    # Create sample embeddings for testing
    create_sample_embeddings()
    
    print("🎯 Next steps:")
    print("1. Execute the test embeddings to verify the format works")
    print("2. Then proceed with the full embedding insertion") 