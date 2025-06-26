# WellnessGrid RAG System 10x Expansion

This directory contains a comprehensive system to expand the WellnessGrid RAG (Retrieval-Augmented Generation) database by 10x through automated scraping and embedding of credible medical documents.

## 🎯 Overview

**Current State:** ~30 documents, ~502 chunks  
**Target:** 300+ documents, 5000+ chunks  
**Sources:** WHO, CDC, NIH, Medical Associations, International Health Organizations, Research Papers

## 📁 Files Structure

```
scripts/
├── RAG_EXPANSION_README.md          # This file
├── requirements_scraper.txt         # Dependencies
├── comprehensive_medical_sources.json  # Source configuration
├── medical_document_scraper.py      # Main scraper
├── embed_scraped_documents.py       # Embedding processor
├── run_rag_expansion.py            # Automation script
└── (generated files during process)
```

## 🚀 Quick Start (Automated)

### Option 1: One-Click Expansion
```bash
# Install dependencies
pip install -r scripts/requirements_scraper.txt

# Set environment variables in .env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run complete expansion (1-2 hours)
python scripts/run_rag_expansion.py
```

### Option 2: Manual Step-by-Step

#### Step 1: Install Dependencies
```bash
pip install beautifulsoup4 feedparser aiohttp lxml requests sentence-transformers supabase python-dotenv
```

#### Step 2: Configure Environment
Create/update your `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### Step 3: Run Scraper
```bash
python scripts/medical_document_scraper.py
```

#### Step 4: Embed Documents
```bash
python scripts/embed_scraped_documents.py
```

## 📊 What Gets Scraped

### High Priority Sources (300+ documents expected)

#### 🏥 WHO (World Health Organization)
- Health topic guidelines for 15+ major conditions
- Latest publications and news feeds
- Global health recommendations

#### 🏛️ CDC (Centers for Disease Control)
- Disease prevention information
- Health promotion guidelines  
- Public health resources
- Emergency preparedness

#### 🔬 NIH (National Institutes of Health)
- MedlinePlus patient education
- NHLBI heart/lung health
- NIDDK diabetes/kidney health
- NIMH mental health resources

#### 📚 PubMed Central
- Open access research articles
- Recent medical studies
- Evidence-based reviews

#### 🏥 Medical Associations
- American Heart Association
- American Cancer Society
- American Diabetes Association
- American Lung Association
- American Psychiatric Association

### Medium Priority Sources (100+ documents expected)

#### 🌍 International Health
- NHS UK health information
- Health Canada resources
- Australian health guidelines

#### 🛡️ Preventive Health
- USPSTF recommendations
- Red Cross first aid
- Emergency medicine protocols

## 🔧 Technical Details

### Document Processing Pipeline

1. **Web Scraping**
   - Respectful crawling with rate limiting
   - Content extraction using BeautifulSoup
   - Duplicate detection and removal

2. **Content Filtering**
   - Minimum 500 characters per document
   - Medical relevance validation
   - Clean text extraction

3. **Embedding Generation**
   - PubMedBERT model (768 dimensions)
   - Chunking with sentence boundaries
   - 1000 character chunks with 100 char overlap

4. **Database Storage**
   - Supabase pgvector integration
   - Metadata preservation
   - Content hash deduplication

### Quality Controls

- **Source Credibility:** Only authoritative medical sources
- **Content Validation:** Medical relevance filtering
- **Deduplication:** Hash-based duplicate detection
- **Error Handling:** Graceful failure management
- **Rate Limiting:** Respectful API usage

## 📈 Expected Results

### Document Distribution
```
WHO Guidelines:           40-60 documents
CDC Resources:           50-70 documents  
NIH/MedlinePlus:         60-80 documents
Medical Associations:    40-60 documents
PubMed Research:         30-50 documents
International Health:    30-40 documents
Preventive Health:       20-30 documents
Total:                   270-390 documents
```

### Content Categories
- **Patient Education:** 35%
- **Clinical Guidelines:** 25%
- **Research Literature:** 15%
- **Prevention Guides:** 15%
- **Emergency Protocols:** 10%

## 🔍 Monitoring Progress

### Real-time Logs
The scraper provides detailed logging:
```
🏥 Scraping WHO Guidelines...
✅ Scraped 45 WHO documents
🏛️ Scraping CDC Resources...
✅ Scraped 52 CDC documents
...
🎯 Total documents scraped: 287
```

### Final Report
Generates comprehensive JSON report with:
- Documents scraped by source
- Embedding statistics
- Database expansion metrics
- Processing time and errors

## 🛠️ Troubleshooting

### Common Issues

#### 1. Missing Dependencies
```bash
# Error: ModuleNotFoundError: No module named 'beautifulsoup4'
pip install -r scripts/requirements_scraper.txt
```

#### 2. Environment Variables
```bash
# Error: Missing Supabase credentials
# Add to .env file:
NEXT_PUBLIC_SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

#### 3. Network Issues
```bash
# Some sources may be temporarily unavailable
# The scraper continues with available sources
# Check failed_urls in the final report
```

#### 4. Rate Limiting
```bash
# APIs may rate limit requests
# The scraper includes delays and retries
# PubMed API: 1 second delay between requests
```

### Performance Optimization

#### For Faster Processing:
```python
# Increase concurrent workers in medical_document_scraper.py
max_workers=6  # Default: 4

# Reduce content per source
max_documents_per_source=10  # Default: 20
```

#### For Better Quality:
```python
# Increase minimum content length
content_min_length=1000  # Default: 500

# Add more detailed filtering
```

## 📊 Database Schema

### Tables Used

#### `medical_documents`
```sql
id          UUID PRIMARY KEY
title       TEXT NOT NULL
content     TEXT NOT NULL  
source      TEXT NOT NULL
topic       TEXT
url         TEXT
document_type TEXT
metadata    JSONB
content_length INTEGER
created_at  TIMESTAMP
```

#### `document_embeddings`
```sql
id            UUID PRIMARY KEY
document_id   UUID REFERENCES medical_documents(id)
chunk_index   INTEGER
chunk_content TEXT
embedding     VECTOR(768)
created_at    TIMESTAMP
```

## 🔒 Security & Ethics

### Compliance
- **Robots.txt:** Respects website crawling policies
- **Rate Limiting:** Prevents server overload
- **Attribution:** Preserves source URLs and metadata
- **Terms of Service:** Only scrapes publicly available content

### Data Quality
- **Authoritative Sources:** Only credible medical organizations
- **Medical Disclaimer:** Content flagged as educational only
- **Currency:** Focuses on recent and updated information
- **Relevance:** Medical topic filtering

## 🚀 Post-Expansion

### Testing RAG System
```bash
# Test the expanded database
cd notebooks/
jupyter notebook query_rag_system.ipynb
```

### Integration
The expanded database automatically enhances:
- `/api/ask` endpoint responses
- Medical query relevance
- Source diversity in answers
- Coverage of health topics

### Monitoring
- Check Supabase dashboard for document counts
- Monitor API response quality
- Review source attribution in responses

## 📞 Support

### Issues & Debugging
1. **Check logs:** All scripts provide detailed logging
2. **Verify environment:** Ensure all variables are set
3. **Test database:** Use Supabase dashboard to verify
4. **Check disk space:** Ensure sufficient storage

### Customization
- **Add sources:** Edit `comprehensive_medical_sources.json`
- **Adjust filters:** Modify content validation in scraper
- **Change embedding model:** Update PubMedBERT reference
- **Modify chunking:** Adjust chunk size parameters

## 🎉 Success Metrics

### Quantitative Goals
- ✅ **10x Document Increase:** 30 → 300+ documents
- ✅ **10x Chunk Increase:** 502 → 5000+ chunks
- ✅ **Source Diversity:** 22 → 50+ unique sources
- ✅ **Category Coverage:** All major health topics

### Qualitative Improvements
- **Better Query Responses:** More relevant and detailed answers
- **Source Authority:** Responses from WHO, CDC, NIH
- **Topic Coverage:** Comprehensive health information
- **User Experience:** More helpful and accurate assistance

---

**🏥 Ready to 10x your WellnessGrid RAG system?**  
**Run `python scripts/run_rag_expansion.py` and watch the magic happen!** ✨ 