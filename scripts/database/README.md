# Database Scripts

This directory contains SQL files and scripts for database operations.

## Files

### 🗄️ Active Database Files
- `corrected_embeddings.sql` - Corrected embedding data
- `embedding_sql_20250625_142148.sql` - Latest embedding SQL file
- `emb_batch_16.sql` - Recent embedding batch 16
- `emb_batch_17.sql` - Recent embedding batch 17  
- `emb_batch_18.sql` - Recent embedding batch 18
- `emb_batch_19.sql` - Recent embedding batch 19

### 📦 old-batches/
Contains older batch files that are kept for reference:
- `batch_*.sql` - Document batch insertion files (001-020)
- `doc_batch_*.sql` - Document batch files (1-17)
- `emb_batch_*.sql` - Older embedding batch files (1-15)

## Usage

### Current Embedding Files
The most recent embedding files are in the main directory and represent the latest state of the database.

### Batch Files
The old-batches directory contains historical batch insertion files that were used during the initial database setup and can be referenced if needed.

## File Sizes
Note: Some embedding SQL files are quite large (15MB+) due to vector data. These are essential for the RAG system functionality. 