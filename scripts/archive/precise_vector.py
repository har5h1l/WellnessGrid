#!/usr/bin/env python3
"""
Create Precisely 768-dimensional Vector
"""

def create_precise_768_vector():
    """Create a vector with exactly 768 dimensions"""
    # Create exactly 768 values
    vector_values = ['0.1'] * 768
    vector_str = '[' + ','.join(vector_values) + ']'
    
    # Verify count
    actual_count = len(vector_values)
    parsed_count = len(vector_str[1:-1].split(','))
    
    print(f"Vector values created: {actual_count}")
    print(f"Parsed count: {parsed_count}")
    print(f"Vector string length: {len(vector_str)}")
    
    return vector_str

if __name__ == "__main__":
    vector_str = create_precise_768_vector()
    
    # Double check by parsing
    parsed_values = vector_str[1:-1].split(',')
    print(f"Final verification - parsed elements: {len(parsed_values)}")
    
    # Create SQL
    sql = f'''INSERT INTO document_embeddings (document_id, chunk_index, chunk_content, embedding)
VALUES (
    (SELECT id FROM medical_documents WHERE title LIKE '%Arthritis%' LIMIT 1), 
    0, 
    'Test chunk content for arthritis information.', 
    '{vector_str}'
);'''
    
    with open("scripts/precise_768_vector.sql", 'w') as f:
        f.write(sql)
    
    print("✅ Precise 768-dimensional vector SQL created") 