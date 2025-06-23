# WellnessGrid Document Embedding System

A clean, organized system for managing medical document embeddings with external source management and duplicate prevention.

## 📁 File Structure

- **`sources_to_embed.json`** - Define what documents to embed
- **`embedded_registry.json`** - Track what has been embedded (auto-generated)
- **`embed_documents.py`** - Main embedding script

## 🚀 Quick Start

### 1. Clear Database and Start Fresh
```bash
python scripts/embed_documents.py --clear-db
```

### 2. Add New Sources Only
```bash
python scripts/embed_documents.py
```

### 3. Force Re-embed Everything
```bash
python scripts/embed_documents.py --force
```

## 📝 Adding Sources

Edit `scripts/sources_to_embed.json` to add new sources:

### URL Sources
```json
{
  "type": "url",
  "url": "https://www.cdc.gov/diabetes/basics/diabetes.html",
  "title": "CDC - What is Diabetes?",
  "description": "Comprehensive diabetes overview from CDC",
  "category": "diabetes",
  "subcategory": "basics"
}
```

### Text Sources
```json
{
  "type": "text",
  "title": "Custom Medical Guide",
  "content": "Your custom medical content here...",
  "category": "custom",
  "subcategory": "guides"
}
```

### File Sources
```json
{
  "type": "file",
  "title": "Medical Research Paper",
  "file_path": "./docs/medical_research.pdf",
  "category": "research",
  "subcategory": "papers"
}
```

## 📊 Tracking Embedded Documents

The system automatically tracks:
- ✅ **What's been embedded** - Prevents duplicates
- 📅 **When it was embedded** - Timestamps for each session
- 🔍 **Content changes** - Re-embeds if source content changes
- 📈 **Statistics** - Total documents, chunks, sessions

Check `scripts/embedded_registry.json` to see what's been processed.

## 🛠️ Features

- **Duplicate Prevention** - Won't re-embed unchanged content
- **Source Management** - External JSON file for easy source management
- **Content Hashing** - Detects when sources have been updated
- **Session Tracking** - Complete audit trail of embedding sessions
- **Database Clearing** - Clean slate when needed
- **PubMedBERT Embeddings** - Medical-specific embeddings
- **Supabase Integration** - Uses your existing database

## 📋 Registry Structure

The `embedded_registry.json` file tracks:

```json
{
  "embedded_documents": {
    "diabetes_basics_abc123": {
      "source_id": "diabetes_basics_abc123",
      "title": "CDC - What is Diabetes?",
      "content_hash": "abc123def456",
      "embedding_date": "2024-01-01T12:00:00",
      "chunk_count": 15,
      "category": "diabetes",
      "subcategory": "basics"
    }
  },
  "embedding_sessions": [...],
  "statistics": {
    "total_documents_embedded": 5,
    "total_chunks_created": 75,
    "last_embedding_session": "2024-01-01T12:00:00"
  }
}
```

## 🔧 Environment Setup

Make sure you have these environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📚 Example Workflow

1. **Add sources** to `sources_to_embed.json`
2. **Run embedding**: `python scripts/embed_documents.py`
3. **Check results** in `embedded_registry.json`
4. **Query documents** using `notebooks/query_rag_system.ipynb`

The system is designed to be:
- 🧹 **Clean** - No sample content cluttering your database
- 📝 **Documented** - Everything tracked in external files
- 🔄 **Efficient** - No duplicate work
- 🎯 **Focused** - Only embed what you specify 