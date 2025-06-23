# Notebooks

This directory contains Jupyter notebooks for the WellnessGrid RAG system.

## 📁 Active Notebooks

- `query_rag_system.ipynb` - Main RAG query system for medical knowledge base

## 📁 Archive

- `archive/wellness_llm_notebook.ipynb` - Deprecated Flask/LLM integration notebook

## 🚀 Usage

### RAG Query System
The main notebook for querying the medical knowledge base using Supabase and PubMedBERT:

1. First, run the embedding script: `python scripts/embed_documents.py`
2. Open `query_rag_system.ipynb`
3. Configure your Supabase credentials
4. Run cells to query the medical database

## 🔧 Requirements

- Python 3.8+
- Jupyter Notebook or JupyterLab
- Supabase account and credentials
- Medical documents embedded using `scripts/embed_documents.py`
- Required packages (installed via notebook)

## 📝 Note

For document embedding, use the Python script at `scripts/embed_documents.py` instead of notebooks for better performance and reliability. 