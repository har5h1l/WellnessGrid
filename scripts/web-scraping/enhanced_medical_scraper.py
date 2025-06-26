#!/usr/bin/env python3
"""
Enhanced Medical Document Scraper for WellnessGrid RAG System
TARGET: 500-1000 high-quality medical documents from credible sources
"""

import os
import requests
import json
import hashlib
import time
import logging
import asyncio
import aiohttp
from datetime import datetime
from typing import List, Dict, Any, Optional, Set
from urllib.parse import urljoin, urlparse, quote
from concurrent.futures import ThreadPoolExecutor, as_completed
import xml.etree.ElementTree as ET
import re

# Web scraping libraries
try:
    from bs4 import BeautifulSoup
    import feedparser
    from aiohttp import ClientSession, ClientTimeout
except ImportError:
    print("Please install required packages:")
    print("pip install beautifulsoup4 feedparser aiohttp lxml requests")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedMedicalScraper:
    """Enhanced medical document scraper targeting 10x expansion (500-1000+ documents)"""
    
    def __init__(self, config_file: str = "scripts/web-scraping/comprehensive_medical_sources.json"):
        # Load configuration
        try:
            with open(config_file, 'r') as f:
                self.config = json.load(f)
        except FileNotFoundError:
            logger.error(f"Configuration file not found: {config_file}")
            raise
        
        self.medical_sources = self.config['medical_sources']
        self.api_sources = self.config.get('api_sources', {})
        self.scraping_config = self.config['scraping_config']
        self.content_filters = self.config['content_filters']
        
        # Initialize session
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.scraping_config['user_agent']
        })
        
        # Statistics and tracking
        self.scraped_documents = []
        self.failed_urls = []
        self.processed_urls: Set[str] = set()
        self.source_stats = {}
        self.duplicate_hashes: Set[str] = set()
        
        # Content processing
        self.chunk_size = self.scraping_config.get('chunk_size', 1000)
        self.chunk_overlap = self.scraping_config.get('chunk_overlap', 200)
        
        logger.info(f"🏥 Enhanced Medical Scraper initialized")
        logger.info(f"🎯 TARGET: 500-1000 high-quality medical documents")
        logger.info(f"📊 Loaded {len(self.medical_sources)} source categories")
        logger.info(f"🔗 API sources: {len(self.api_sources)}")
    
    async def scrape_all_sources(self) -> List[Dict[str, Any]]:
        """Scrape all sources with prioritization and parallel processing"""
        start_time = time.time()
        logger.info("🚀 Starting comprehensive medical document scraping...")
        
        all_documents = []
        
        # Sort categories by priority
        sorted_categories = sorted(
            self.medical_sources.items(),
            key=lambda x: {'high': 0, 'medium': 1, 'low': 2}.get(x[1].get('priority', 'low'), 2)
        )
        
        # Process high-priority sources first
        for category_name, category_data in sorted_categories:
            logger.info(f"📂 Processing category: {category_name} (Priority: {category_data.get('priority', 'low')})")
            
            try:
                category_docs = await self.scrape_source_category(category_name, category_data)
                all_documents.extend(category_docs)
                
                logger.info(f"✅ {category_name}: {len(category_docs)} documents collected")
                
                # Progress update
                total_so_far = len(all_documents)
                logger.info(f"📊 Progress: {total_so_far} total documents collected")
                
            except Exception as e:
                logger.error(f"❌ Failed to process category {category_name}: {str(e)}")
                continue
        
        # Process API sources (PubMed, etc.)
        logger.info("🔬 Processing API sources...")
        api_docs = await self.scrape_api_sources()
        all_documents.extend(api_docs)
        
        # Remove duplicates
        logger.info("🔍 Removing duplicates and filtering content...")
        unique_documents = self.remove_duplicates(all_documents)
        
        # Filter and validate content
        filtered_documents = self.filter_documents(unique_documents)
        
        # Chunk large documents
        chunked_documents = self.chunk_large_documents(filtered_documents)
        
        # Final statistics
        end_time = time.time()
        duration = end_time - start_time
        
        logger.info(f"✅ Scraping completed!")
        logger.info(f"⏱️  Duration: {duration:.1f} seconds")
        logger.info(f"📄 Total documents: {len(chunked_documents)}")
        logger.info(f"🗑️  Duplicates removed: {len(all_documents) - len(unique_documents)}")
        logger.info(f"🚫 Filtered out: {len(unique_documents) - len(filtered_documents)}")
        logger.info(f"📊 Failed URLs: {len(self.failed_urls)}")
        
        # Print source statistics
        logger.info("📈 Source Statistics:")
        for source_name, count in self.source_stats.items():
            logger.info(f"   {source_name}: {count} documents")
        
        return chunked_documents
    
    async def scrape_source_category(self, category_name: str, category_data: Dict) -> List[Dict[str, Any]]:
        """Scrape all sources in a category with enhanced error handling"""
        documents = []
        category_sources = category_data.get('sources', [])
        
        # Process sources in parallel for this category
        tasks = []
        
        for source in category_sources:
            task = self.scrape_web_source(source, category_name)
            tasks.append(task)
        
        # Execute category sources concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                documents.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Source failed in {category_name}: {result}")
        
        return documents
    
    async def scrape_web_source(self, source: Dict, category: str) -> List[Dict[str, Any]]:
        """Enhanced web source scraping with better content extraction"""
        source_name = source['name']
        base_url = source['base_url']
        endpoints = source.get('endpoints', [])
        feeds = source.get('feeds', [])
        
        logger.info(f"  📡 Scraping {source_name} (Target: {len(endpoints) + len(feeds)} URLs)...")
        documents = []
        
        # Scrape RSS feeds first
        for feed_url in feeds:
            try:
                feed_docs = await self.scrape_rss_feed(feed_url, source_name, category)
                documents.extend(feed_docs)
            except Exception as e:
                logger.error(f"RSS feed failed {feed_url}: {e}")
                self.failed_urls.append(feed_url)
        
        # Scrape web endpoints with improved session management
        connector = aiohttp.TCPConnector(limit=self.scraping_config['max_concurrent_requests'])
        timeout = ClientTimeout(total=self.scraping_config['timeout'])
        
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': self.scraping_config['user_agent']}
        ) as session:
            
            # Batch process endpoints
            batch_size = 10
            for i in range(0, len(endpoints), batch_size):
                batch = endpoints[i:i + batch_size]
                
                tasks = []
                for endpoint in batch:
                    url = urljoin(base_url, endpoint)
                    if url not in self.processed_urls:
                        task = self.scrape_single_url(session, url, source_name, category)
                        tasks.append(task)
                        self.processed_urls.add(url)
                
                # Execute batch
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for result in batch_results:
                    if isinstance(result, dict) and result:
                        documents.append(result)
                    elif isinstance(result, Exception):
                        logger.debug(f"URL failed: {result}")
                
                # Rate limiting between batches
                await asyncio.sleep(self.scraping_config['request_delay'])
        
        # Update statistics
        self.source_stats[source_name] = len(documents)
        logger.info(f"    ✅ {source_name}: {len(documents)} documents collected")
        
        return documents
    
    async def scrape_single_url(self, session: ClientSession, url: str, source_name: str, category: str) -> Optional[Dict[str, Any]]:
        """Enhanced single URL scraping with better content extraction"""
        try:
            await asyncio.sleep(self.scraping_config['request_delay'] / 5)  # Micro-delay for rate limiting
            
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.text()
                    
                    # Extract and process content
                    extracted_content = self.extract_content_from_html(content, url)
                    
                    if extracted_content and len(extracted_content.strip()) >= self.scraping_config['content_min_length']:
                        
                        # Generate content hash for duplicate detection
                        content_hash = hashlib.md5(extracted_content.encode()).hexdigest()
                        if content_hash in self.duplicate_hashes:
                            return None
                        self.duplicate_hashes.add(content_hash)
                        
                        # Extract metadata
                        title = self.extract_title_from_html(content, url)
                        topic = self.extract_topic_from_url(url, extracted_content)
                        
                        return {
                            'title': title,
                            'content': extracted_content,
                            'source': source_name,
                            'topic': topic,
                            'url': url,
                            'document_type': self.determine_document_type(category, url),
                            'category': category,
                            'subcategory': source_name.lower().replace(' ', '_'),
                            'scraped_date': datetime.now().isoformat(),
                            'content_hash': content_hash,
                            'word_count': len(extracted_content.split()),
                            'metadata': {
                                'status_code': response.status,
                                'content_type': response.headers.get('content-type', ''),
                                'language': self.detect_language(extracted_content)
                            }
                        }
                elif response.status == 404:
                    logger.debug(f"404 Not Found: {url}")
                else:
                    logger.debug(f"HTTP {response.status}: {url}")
                    
        except asyncio.TimeoutError:
            logger.debug(f"Timeout: {url}")
        except Exception as e:
            logger.debug(f"Error scraping {url}: {e}")
        
        self.failed_urls.append(url)
        return None
    
    def extract_content_from_html(self, html_content: str, url: str) -> Optional[str]:
        """Enhanced HTML content extraction with better text processing"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'form', 'noscript']):
                element.decompose()
            
            # Remove ads and navigation
            for class_name in ['advertisement', 'ad', 'sidebar', 'menu', 'navigation', 'breadcrumb']:
                for element in soup.find_all(class_=re.compile(class_name, re.I)):
                    element.decompose()
            
            # Target content areas (priority order)
            content_selectors = [
                'main', 'article', '.content', '.main-content', '.article-content', 
                '.post-content', '#content', '.page-content', '.entry-content',
                '[role="main"]', '.container'
            ]
            
            extracted_text = ""
            
            # Try each selector
            for selector in content_selectors:
                content_area = soup.select_one(selector)
                if content_area:
                    extracted_text = content_area.get_text(separator=' ', strip=True)
                    break
            
            # Fallback to body
            if not extracted_text:
                body = soup.find('body')
                if body:
                    extracted_text = body.get_text(separator=' ', strip=True)
            
            # Clean up text
            if extracted_text:
                # Remove extra whitespace
                extracted_text = re.sub(r'\s+', ' ', extracted_text)
                # Remove short lines (likely navigation/menu items)
                lines = extracted_text.split('\n')
                meaningful_lines = [line.strip() for line in lines if len(line.strip()) > 20]
                extracted_text = ' '.join(meaningful_lines)
                
                # Basic content validation
                if self.validate_medical_content(extracted_text):
                    return extracted_text
            
        except Exception as e:
            logger.debug(f"HTML parsing error for {url}: {e}")
        
        return None
    
    def extract_title_from_html(self, html_content: str, url: str) -> str:
        """Extract title from HTML with fallbacks"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Try multiple title sources
            title_selectors = [
                'title',
                'h1',
                '.page-title',
                '.article-title',
                '.entry-title',
                '[property="og:title"]'
            ]
            
            for selector in title_selectors:
                element = soup.select_one(selector)
                if element:
                    title = element.get_text(strip=True) or element.get('content', '')
                    if title and len(title) > 5:
                        return title[:200]  # Limit title length
            
        except Exception:
            pass
        
        # Fallback to URL-based title
        return self.extract_title_from_url(url)
    
    def extract_title_from_url(self, url: str) -> str:
        """Extract title from URL path"""
        try:
            path = urlparse(url).path
            # Get last meaningful segment
            segments = [s for s in path.split('/') if s and not s.endswith('.html')]
            if segments:
                title = segments[-1].replace('-', ' ').replace('_', ' ')
                return title.title()
        except Exception:
            pass
        
        return "Medical Document"
    
    def validate_medical_content(self, content: str) -> bool:
        """Validate that content is medical/health related"""
        content_lower = content.lower()
        
        # Check for required medical keywords
        required_keywords = self.content_filters['required_keywords']
        keyword_count = sum(1 for keyword in required_keywords if keyword in content_lower)
        
        # Check for excluded keywords
        excluded_keywords = self.content_filters['excluded_keywords']
        has_excluded = any(keyword in content_lower for keyword in excluded_keywords)
        
        # Word count validation
        word_count = len(content.split())
        min_words = self.content_filters['min_word_count']
        max_words = self.content_filters['max_word_count']
        
        return (
            keyword_count >= 2 and  # At least 2 medical keywords
            not has_excluded and
            min_words <= word_count <= max_words
        )
    
    def detect_language(self, text: str) -> str:
        """Simple language detection"""
        # Basic English check
        english_indicators = ['the', 'and', 'or', 'is', 'are', 'was', 'were', 'have', 'has']
        text_lower = text.lower()
        english_count = sum(1 for word in english_indicators if f' {word} ' in text_lower)
        
        return 'en' if english_count >= 3 else 'unknown'
    
    async def scrape_api_sources(self) -> List[Dict[str, Any]]:
        """Scrape API sources like PubMed"""
        documents = []
        
        for api_name, api_config in self.api_sources.items():
            logger.info(f"🔬 Scraping API source: {api_name}")
            
            if api_name == 'pubmed_central':
                api_docs = await self.scrape_pubmed_api(api_config)
                documents.extend(api_docs)
                self.source_stats[f"API_{api_name}"] = len(api_docs)
        
        return documents
    
    async def scrape_pubmed_api(self, config: Dict) -> List[Dict[str, Any]]:
        """Scrape PubMed Central for medical research"""
        documents = []
        base_url = config['base_url']
        search_terms = config['search_terms']
        max_results = config.get('max_results', 50)
        
        async with aiohttp.ClientSession() as session:
            for search_term in search_terms:
                try:
                    # Search for articles
                    search_url = f"{base_url}esearch.fcgi"
                    params = {
                        'db': 'pmc',
                        'term': search_term,
                        'retmax': max_results // len(search_terms),
                        'retmode': 'json'
                    }
                    
                    async with session.get(search_url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            pmcids = data.get('esearchresult', {}).get('idlist', [])
                            
                            # Fetch abstracts for found articles
                            if pmcids:
                                fetch_docs = await self.fetch_pubmed_abstracts(session, pmcids, search_term)
                                documents.extend(fetch_docs)
                    
                    await asyncio.sleep(0.5)  # Be nice to NCBI servers
                    
                except Exception as e:
                    logger.error(f"PubMed API error for '{search_term}': {e}")
        
        return documents
    
    async def fetch_pubmed_abstracts(self, session: ClientSession, pmcids: List[str], search_term: str) -> List[Dict[str, Any]]:
        """Fetch abstracts from PubMed"""
        documents = []
        
        # Batch fetch abstracts
        batch_size = 10
        for i in range(0, len(pmcids), batch_size):
            batch_ids = pmcids[i:i + batch_size]
            
            try:
                fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
                params = {
                    'db': 'pmc',
                    'id': ','.join(batch_ids),
                    'retmode': 'xml'
                }
                
                async with session.get(fetch_url, params=params) as response:
                    if response.status == 200:
                        xml_content = await response.text()
                        batch_docs = self.parse_pubmed_xml(xml_content, search_term)
                        documents.extend(batch_docs)
                
                await asyncio.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                logger.error(f"Error fetching PubMed batch: {e}")
        
        return documents
    
    def parse_pubmed_xml(self, xml_content: str, search_term: str) -> List[Dict[str, Any]]:
        """Parse PubMed XML response"""
        documents = []
        
        try:
            root = ET.fromstring(xml_content)
            
            for article in root.findall('.//article'):
                try:
                    # Extract title
                    title_elem = article.find('.//article-title')
                    title = title_elem.text if title_elem is not None else "PubMed Article"
                    
                    # Extract abstract
                    abstract_elem = article.find('.//abstract')
                    if abstract_elem is not None:
                        abstract_text = ' '.join([p.text or '' for p in abstract_elem.findall('.//p')])
                        
                        if len(abstract_text) > 100:  # Ensure meaningful content
                            documents.append({
                                'title': title,
                                'content': abstract_text,
                                'source': 'PubMed_Central',
                                'topic': search_term.replace('+', ' '),
                                'url': f"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{article.get('id', '')}",
                                'document_type': 'research_abstract',
                                'category': 'scientific_literature',
                                'subcategory': 'pubmed_central',
                                'scraped_date': datetime.now().isoformat(),
                                'metadata': {
                                    'search_term': search_term,
                                    'source_database': 'PMC'
                                }
                            })
                
                except Exception as e:
                    logger.debug(f"Error parsing article: {e}")
                    continue
        
        except ET.ParseError as e:
            logger.error(f"XML parse error: {e}")
        
        return documents
    
    def chunk_large_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Chunk large documents for better embeddings"""
        chunked_docs = []
        
        for doc in documents:
            content = doc['content']
            
            if len(content) <= self.chunk_size:
                chunked_docs.append(doc)
            else:
                # Split into chunks
                chunks = self.split_text_into_chunks(content)
                
                for i, chunk in enumerate(chunks):
                    chunk_doc = doc.copy()
                    chunk_doc['content'] = chunk
                    chunk_doc['title'] = f"{doc['title']} (Part {i+1})"
                    chunk_doc['metadata'] = doc.get('metadata', {}).copy()
                    chunk_doc['metadata']['chunk_index'] = i
                    chunk_doc['metadata']['total_chunks'] = len(chunks)
                    chunk_doc['metadata']['is_chunked'] = True
                    
                    chunked_docs.append(chunk_doc)
        
        return chunked_docs
    
    def split_text_into_chunks(self, text: str) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        
        chunk_words = self.chunk_size // 5  # Approximate words per chunk
        overlap_words = self.chunk_overlap // 5
        
        for i in range(0, len(words), chunk_words - overlap_words):
            chunk = ' '.join(words[i:i + chunk_words])
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    def extract_topic_from_url(self, url: str, content: str = "") -> str:
        """Enhanced topic extraction"""
        # URL-based topic detection
        url_lower = url.lower()
        
        topic_mapping = {
            'diabetes': 'diabetes',
            'heart': 'cardiovascular',
            'cardiac': 'cardiovascular',
            'mental': 'mental_health',
            'depression': 'mental_health',
            'anxiety': 'mental_health',
            'cancer': 'cancer',
            'nutrition': 'nutrition',
            'exercise': 'fitness',
            'fitness': 'fitness',
            'sleep': 'sleep',
            'obesity': 'weight_management',
            'stroke': 'cardiovascular',
            'copd': 'respiratory',
            'asthma': 'respiratory',
            'kidney': 'kidney_disease',
            'liver': 'liver_disease'
        }
        
        for keyword, topic in topic_mapping.items():
            if keyword in url_lower:
                return topic
        
        # Content-based topic detection
        if content:
            content_lower = content.lower()
            for keyword, topic in topic_mapping.items():
                if keyword in content_lower:
                    return topic
        
        return 'general_health'
    
    def determine_document_type(self, category: str, url: str = "") -> str:
        """Determine document type based on category and URL"""
        type_mapping = {
            'global_health_organizations': 'guidelines',
            'us_government_health': 'government_resource',
            'medical_associations': 'professional_guidelines',
            'international_health': 'international_guidelines',
            'clinical_guidelines': 'clinical_guidelines',
            'nutrition_health': 'nutrition_guide',
            'fitness_wellness': 'fitness_guide'
        }
        
        # URL-based type detection
        if url:
            url_lower = url.lower()
            if 'guideline' in url_lower:
                return 'guidelines'
            elif 'research' in url_lower or 'study' in url_lower:
                return 'research'
            elif 'news' in url_lower or 'blog' in url_lower:
                return 'news_article'
        
        return type_mapping.get(category, 'medical_information')
    
    def filter_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter documents based on quality criteria"""
        filtered = []
        
        for doc in documents:
            content = doc.get('content', '')
            
            # Content quality checks
            if (
                self.validate_medical_content(content) and
                len(content.split()) >= 50 and  # Minimum meaningful content
                not self.is_duplicate_content(doc, filtered)
            ):
                filtered.append(doc)
        
        return filtered
    
    def is_duplicate_content(self, doc: Dict[str, Any], existing_docs: List[Dict[str, Any]]) -> bool:
        """Check for duplicate content using hash"""
        doc_hash = doc.get('content_hash')
        if not doc_hash:
            return False
        
        existing_hashes = {d.get('content_hash') for d in existing_docs}
        return doc_hash in existing_hashes
    
    def remove_duplicates(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate documents based on content hash"""
        seen_hashes = set()
        unique_docs = []
        
        for doc in documents:
            content_hash = doc.get('content_hash')
            if content_hash and content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_docs.append(doc)
            elif not content_hash:
                # Generate hash for documents without one
                content = doc.get('content', '')
                doc_hash = hashlib.md5(content.encode()).hexdigest()
                if doc_hash not in seen_hashes:
                    doc['content_hash'] = doc_hash
                    seen_hashes.add(doc_hash)
                    unique_docs.append(doc)
        
        return unique_docs
    
    def save_documents(self, documents: List[Dict[str, Any]], filename: str = None) -> str:
        """Save scraped documents to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"scripts/web-scraping/scraped_medical_documents_{timestamp}.json"
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # Add summary metadata
        summary = {
            'scraping_summary': {
                'total_documents': len(documents),
                'scraping_date': datetime.now().isoformat(),
                'target_achieved': len(documents) >= 500,
                'source_breakdown': self.source_stats,
                'failed_urls_count': len(self.failed_urls),
                'categories': list(set(doc.get('category', 'unknown') for doc in documents)),
                'document_types': list(set(doc.get('document_type', 'unknown') for doc in documents)),
                'average_word_count': sum(doc.get('word_count', 0) for doc in documents) // max(len(documents), 1)
            },
            'documents': documents
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Documents saved to: {filename}")
        logger.info(f"📊 Total saved: {len(documents)} documents")
        
        return filename

async def main():
    """Main scraping function"""
    try:
        scraper = EnhancedMedicalScraper()
        
        # Run comprehensive scraping
        documents = await scraper.scrape_all_sources()
        
        # Save results
        output_file = scraper.save_documents(documents)
        
        # Print final statistics
        print("\n" + "="*60)
        print("🏥 ENHANCED MEDICAL SCRAPING COMPLETED")
        print("="*60)
        print(f"📄 Total documents collected: {len(documents)}")
        print(f"🎯 Target achievement: {'✅ SUCCESS' if len(documents) >= 500 else '⚠️ PARTIAL'}")
        print(f"💾 Output file: {output_file}")
        print(f"🚫 Failed URLs: {len(scraper.failed_urls)}")
        
        print("\n📊 Source Statistics:")
        for source, count in sorted(scraper.source_stats.items(), key=lambda x: x[1], reverse=True):
            print(f"   {source}: {count} documents")
        
        print("\n🎯 Next Steps:")
        print("1. Review the scraped documents")
        print("2. Run embedding script to process into vector database")
        print("3. Update RAG system with new documents")
        print("\n✅ Ready for embedding and RAG integration!")
        
        return output_file
        
    except Exception as e:
        logger.error(f"❌ Scraping failed: {str(e)}")
        raise

if __name__ == "__main__":
    # Run the enhanced scraper
    asyncio.run(main()) 