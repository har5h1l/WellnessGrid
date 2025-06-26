#!/usr/bin/env python3
"""
Create Test Vector with Exactly 768 Dimensions
"""

def create_768_vector():
    """Create a test vector with exactly 768 dimensions"""
    vector = [0.1] * 768
    return '[' + ','.join(map(str, vector)) + ']'

if __name__ == "__main__":
    vector_str = create_768_vector()
    print(f"Vector dimensions: {len(vector_str[1:-1].split(','))}")
    print(f"Vector (first 20 elements): {vector_str[:100]}...")
    
    # Write SQL for testing
    sql = f"""
INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, embedding)
VALUES (
    (SELECT id FROM medical_documents WHERE title LIKE '%Arthritis%' LIMIT 1), 
    0, 
    'Test chunk content for arthritis information.', 
    '{vector_str}'
);
"""
    
    with open("scripts/test_768_vector.sql", 'w') as f:
        f.write(sql)
    
    print("✅ 768-dimensional test vector SQL created: scripts/test_768_vector.sql") 