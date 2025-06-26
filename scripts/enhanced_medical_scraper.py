#!/usr/bin/env python3
"""
Enhanced Medical Document Scraper for WellnessGrid RAG System
Uses comprehensive source configuration to scrape 10x more medical documents
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
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import xml.etree.ElementTree as ET

# Web scraping libraries
try:
    from bs4 import BeautifulSoup
    import feedparser
    from aiohttp import ClientSession, ClientTimeout
except ImportError:
    print("Please install required packages: pip install beautifulsoup4 feedparser aiohttp lxml")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedMedicalScraper:
    """Enhanced medical document scraper using comprehensive source configuration"""
    
    def __init__(self, config_file: str = "scripts/comprehensive_medical_sources.json"):
        # Load configuration
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        self.medical_sources = self.config['medical_sources']
        self.scraping_config = self.config['scraping_config']
        self.content_filters = self.config['content_filters']
        
        # Initialize session
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': self.scraping_config['user_agent']
        })
        
        # Statistics
        self.scraped_documents = []
        self.failed_urls = []
        self.processed_urls: Set[str] = set()
        self.source_stats = {}
        
        logger.info(f"🏥 Enhanced Medical Scraper initialized")
        logger.info(f"📊 Target: 10x expansion (30 → 300+ documents)")
        logger.info(f"🎯 Loaded {len(self.medical_sources)} source categories")
    
    async def scrape_source_category(self, category_name: str, category_data: Dict) -> List[Dict[str, Any]]:
        """Scrape all sources in a category"""
        logger.info(f"🔄 Scraping category: {category_name} ({category_data['priority']} priority)")
        
        documents = []
        category_sources = category_data.get('sources', [])
        
        # Handle regular web sources
        for source in category_sources:
            source_docs = await self.scrape_web_source(source, category_name)
            documents.extend(source_docs)
        
        # Handle API sources
        api_sources = category_data.get('api_sources', [])
        for source in api_sources:
            source_docs = await self.scrape_api_source(source, category_name)
            documents.extend(source_docs)
        
        logger.info(f"✅ Category {category_name}: {len(documents)} documents")
        return documents
    
    async def scrape_web_source(self, source: Dict, category: str) -> List[Dict[str, Any]]:
        """Scrape documents from a web source"""
        source_name = source['name']
        base_url = source['base_url']
        endpoints = source.get('endpoints', [])
        feeds = source.get('feeds', [])
        
        logger.info(f"  📡 Scraping {source_name}...")
        documents = []
        
        # Scrape RSS feeds first
        for feed_url in feeds:
            try:
                feed_docs = await self.scrape_rss_feed(feed_url, source_name, category)
                documents.extend(feed_docs)
            except Exception as e:
                logger.error(f"Failed to scrape feed {feed_url}: {e}")
        
        # Scrape web endpoints
        async with aiohttp.ClientSession(
            timeout=ClientTimeout(total=self.scraping_config['timeout']),
            headers={'User-Agent': self.scraping_config['user_agent']}
        ) as session:
            
            tasks = []
            for endpoint in endpoints[:self.scraping_config['max_documents_per_source']]:
                url = urljoin(base_url, endpoint)
                if url not in self.processed_urls:
                    task = self.scrape_single_url(session, url, source_name, category)
                    tasks.append(task)
                    self.processed_urls.add(url)
            
            # Execute tasks concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, dict) and result:
                    documents.append(result)
                elif isinstance(result, Exception):
                    logger.error(f"Task failed: {result}")
        
        # Update source statistics
        self.source_stats[source_name] = len(documents)
        logger.info(f"    ✅ {source_name}: {len(documents)} documents")
        
        return documents
    
    async def scrape_single_url(self, session: ClientSession, url: str, source_name: str, category: str) -> Optional[Dict[str, Any]]:
        """Scrape a single URL asynchronously"""
        try:
            await asyncio.sleep(self.scraping_config['request_delay'])  # Rate limiting
            
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.text()
                    extracted_content = self.extract_content_from_html(content)
                    
                    if extracted_content and len(extracted_content) >= self.scraping_config['content_min_length']:
                        return {
                            'title': self.extract_title_from_url(url, extracted_content),
                            'content': extracted_content,
                            'source': source_name,
                            'topic': self.extract_topic_from_url(url),
                            'url': url,
                            'document_type': self.determine_document_type(category),
                            'category': category,
                            'subcategory': source_name.lower().replace(' ', '_'),
                            'scraped_date': datetime.now().isoformat()
                        }
                    
        except Exception as e:
            logger.error(f"Failed to scrape {url}: {e}")
            self.failed_urls.append(url)
        
        return None
    
    async def scrape_rss_feed(self, feed_url: str, source_name: str, category: str) -> List[Dict[str, Any]]:
        """Scrape RSS/Atom feeds"""
        documents = []
        
        try:
            # Parse feed
            feed = feedparser.parse(feed_url)
            
            # Limit entries
            entries = feed.entries[:self.scraping_config['max_documents_per_source'] // 2]
            
            for entry in entries:
                if hasattr(entry, 'link') and entry.link not in self.processed_urls:
                    content = await self.extract_content_from_feed_entry(entry)
                    
                    if content and len(content) >= self.scraping_config['content_min_length']:
                        documents.append({
                            'title': entry.get('title', 'RSS Feed Article'),
                            'content': content,
                            'source': source_name,
                            'topic': 'news_updates',
                            'url': entry.link,
                            'document_type': 'news_article',
                            'category': category,
                            'subcategory': f'{source_name.lower()}_feed',
                            'published_date': entry.get('published', ''),
                            'scraped_date': datetime.now().isoformat()
                        })
                        
                        self.processed_urls.add(entry.link)
                        
        except Exception as e:
            logger.error(f"Failed to parse RSS feed {feed_url}: {e}")
        
        return documents
    
    async def extract_content_from_feed_entry(self, entry) -> Optional[str]:
        """Extract content from RSS feed entry"""
        # Try different content fields
        content_fields = ['content', 'summary', 'description']
        
        for field in content_fields:
            if hasattr(entry, field):
                content_obj = getattr(entry, field)
                if isinstance(content_obj, list) and content_obj:
                    return content_obj[0].get('value', '')
                elif isinstance(content_obj, str):
                    return content_obj
        
        # Fallback: scrape the linked article
        if hasattr(entry, 'link'):
            try:
                async with aiohttp.ClientSession() as session:
                    return await self.scrape_single_url(session, entry.link, 'feed_content', 'news')
            except:
                pass
        
        return None
    
    async def scrape_api_source(self, source: Dict, category: str) -> List[Dict[str, Any]]:
        """Scrape API-based sources like PubMed Central"""
        source_name = source['name']
        logger.info(f"  🔬 Scraping API: {source_name}")
        
        documents = []
        
        if source_name == "PubMed_Central":
            documents = await self.scrape_pubmed_api(source, category)
        elif source_name == "DOAJ":
            documents = await self.scrape_doaj_api(source, category)
        
        logger.info(f"    ✅ {source_name} API: {len(documents)} documents")
        return documents
    
    async def scrape_pubmed_api(self, source: Dict, category: str) -> List[Dict[str, Any]]:
        """Scrape PubMed Central API"""
        documents = []
        base_url = source['base_url']
        search_terms = source['search_terms']
        
        async with aiohttp.ClientSession() as session:
            for term in search_terms[:10]:  # Limit API calls
                try:
                    # Search for articles
                    search_url = f"{base_url}esearch.fcgi?db=pmc&term={term}&retmax=5&usehistory=y"
                    
                    async with session.get(search_url) as response:
                        if response.status == 200:
                            search_content = await response.text()
                            search_root = ET.fromstring(search_content)
                            
                            # Get PMC IDs
                            pmc_ids = [id_elem.text for id_elem in search_root.findall('.//Id')]
                            
                            if pmc_ids:
                                # Fetch article details
                                ids_str = ','.join(pmc_ids)
                                fetch_url = f"{base_url}efetch.fcgi?db=pmc&id={ids_str}&retmode=xml"
                                
                                async with session.get(fetch_url) as fetch_response:
                                    if fetch_response.status == 200:
                                        fetch_content = await fetch_response.text()
                                        term_docs = self.parse_pubmed_xml(fetch_content, term, category)
                                        documents.extend(term_docs)
                    
                    # Rate limiting for API
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Failed to scrape PubMed for term {term}: {e}")
        
        return documents
    
    async def scrape_doaj_api(self, source: Dict, category: str) -> List[Dict[str, Any]]:
        """Scrape Directory of Open Access Journals API"""
        documents = []
        # DOAJ API implementation would go here
        # Placeholder for now
        return documents
    
    def parse_pubmed_xml(self, xml_content: str, search_term: str, category: str) -> List[Dict[str, Any]]:
        """Parse PubMed Central XML content"""
        documents = []
        
        try:
            root = ET.fromstring(xml_content)
            
            for article in root.findall('.//article'):
                try:
                    # Extract title
                    title_elem = article.find('.//article-title')
                    title = title_elem.text if title_elem is not None else f"PubMed Article - {search_term}"
                    
                    # Extract abstract
                    abstract_elem = article.find('.//abstract')
                    abstract = ""
                    if abstract_elem is not None:
                        abstract_parts = []
                        for p in abstract_elem.findall('.//p'):
                            if p.text:
                                abstract_parts.append(p.text)
                        abstract = ' '.join(abstract_parts)
                    
                    # Extract body content (if available)
                    body_elem = article.find('.//body')
                    body_content = ""
                    if body_elem is not None:
                        body_parts = []
                        for p in body_elem.findall('.//p'):
                            if p.text:
                                body_parts.append(p.text)
                        body_content = ' '.join(body_parts)
                    
                    # Combine content
                    full_content = f"{abstract} {body_content}".strip()
                    
                    if len(full_content) >= self.scraping_config['content_min_length']:
                        documents.append({
                            'title': title,
                            'content': full_content,
                            'source': 'PubMed_Central',
                            'topic': search_term.replace('+', '_'),
                            'url': f"https://www.ncbi.nlm.nih.gov/pmc/",
                            'document_type': 'research_article',
                            'category': category,
                            'subcategory': 'pubmed_research',
                            'scraped_date': datetime.now().isoformat()
                        })
                        
                except Exception as e:
                    logger.error(f"Failed to parse PubMed article: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to parse PubMed XML: {e}")
        
        return documents
    
    def extract_content_from_html(self, html_content: str) -> Optional[str]:
        """Extract clean text content from HTML"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(self.content_filters['remove_elements']):
                element.decompose()
            
            # Find main content
            content = None
            for selector in self.content_filters['content_selectors']:
                content_elem = soup.select_one(selector)
                if content_elem:
                    content = content_elem.get_text()
                    break
            
            # Fallback to body
            if not content:
                body = soup.find('body')
                if body:
                    content = body.get_text()
            
            if content:
                # Clean up text
                lines = (line.strip() for line in content.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                cleaned_content = ' '.join(chunk for chunk in chunks if chunk)
                
                # Check word count
                word_count = len(cleaned_content.split())
                if (self.content_filters['min_words'] <= word_count <= self.content_filters['max_words']):
                    return cleaned_content
            
        except Exception as e:
            logger.error(f"Failed to extract content from HTML: {e}")
        
        return None
    
    def extract_title_from_url(self, url: str, content: str) -> str:
        """Extract or generate title from URL and content"""
        try:
            # Try to extract from HTML if possible
            soup = BeautifulSoup(content, 'html.parser')
            title_elem = soup.find('title')
            if title_elem and title_elem.text:
                return title_elem.text.strip()
        except:
            pass
        
        # Fallback: generate from URL
        path = urlparse(url).path
        if path:
            parts = path.strip('/').split('/')
            return ' '.join(part.replace('-', ' ').replace('_', ' ').title() for part in parts[-2:])
        
        return f"Medical Document from {urlparse(url).netloc}"
    
    def extract_topic_from_url(self, url: str) -> str:
        """Extract topic from URL path"""
        path = urlparse(url).path
        if path:
            parts = path.strip('/').split('/')
            return parts[1] if len(parts) > 1 else 'general'
        return 'general'
    
    def determine_document_type(self, category: str) -> str:
        """Determine document type based on category"""
        type_mapping = {
            'global_health_organizations': 'guideline',
            'us_government_health': 'government_resource',
            'medical_associations': 'professional_guideline',
            'evidence_based_medicine': 'evidence_review',
            'clinical_guidelines': 'clinical_protocol',
            'international_health': 'health_information',
            'medical_education': 'educational_resource',
            'specialty_medicine': 'specialty_guideline',
            'preventive_health': 'prevention_guide',
            'open_access_research': 'research_article',
            'drug_information': 'drug_reference',
            'emergency_medicine': 'emergency_protocol'
        }
        return type_mapping.get(category, 'medical_document')
    
    async def scrape_all_sources(self) -> List[Dict[str, Any]]:
        """Scrape all medical sources concurrently"""
        logger.info("🚀 Starting comprehensive medical document scraping...")
        logger.info(f"📊 Processing {len(self.medical_sources)} categories")
        
        all_documents = []
        
        # Process high priority categories first
        high_priority = [(name, data) for name, data in self.medical_sources.items() if data['priority'] == 'high']
        medium_priority = [(name, data) for name, data in self.medical_sources.items() if data['priority'] == 'medium']
        
        # Scrape high priority sources
        logger.info("🎯 Processing HIGH priority sources...")
        for category_name, category_data in high_priority:
            try:
                documents = await self.scrape_source_category(category_name, category_data)
                all_documents.extend(documents)
                
                # Log progress
                logger.info(f"📈 Current total: {len(all_documents)} documents")
                
            except Exception as e:
                logger.error(f"Failed to scrape category {category_name}: {e}")
        
        # Scrape medium priority sources
        logger.info("📋 Processing MEDIUM priority sources...")
        for category_name, category_data in medium_priority:
            try:
                documents = await self.scrape_source_category(category_name, category_data)
                all_documents.extend(documents)
                
                logger.info(f"📈 Current total: {len(all_documents)} documents")
                
            except Exception as e:
                logger.error(f"Failed to scrape category {category_name}: {e}")
        
        # Remove duplicates
        unique_documents = self.remove_duplicates(all_documents)
        
        logger.info(f"🎯 Scraping completed!")
        logger.info(f"📄 Total documents: {len(unique_documents)}")
        logger.info(f"🗑️ Duplicates removed: {len(all_documents) - len(unique_documents)}")
        logger.info(f"❌ Failed URLs: {len(self.failed_urls)}")
        
        return unique_documents
    
    def remove_duplicates(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate documents based on content hash"""
        unique_documents = []
        seen_hashes = set()
        
        for doc in documents:
            content_hash = hashlib.sha256(doc['content'].encode()).hexdigest()
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_documents.append(doc)
        
        return unique_documents
    
    def save_documents(self, documents: List[Dict[str, Any]], filename: str = "enhanced_scraped_medical_documents.json") -> str:
        """Save scraped documents to JSON file"""
        output_data = {
            'scraping_session': {
                'timestamp': datetime.now().isoformat(),
                'total_documents': len(documents),
                'failed_urls': len(self.failed_urls),
                'processed_urls': len(self.processed_urls),
                'source_statistics': self.source_stats,
                'sources_covered': list(set(doc['source'] for doc in documents)),
                'categories_covered': list(set(doc['category'] for doc in documents)),
                'document_types': list(set(doc['document_type'] for doc in documents)),
                'scraper_version': 'enhanced_v2.0'
            },
            'documents': documents,
            'failed_urls': list(self.failed_urls)
        }
        
        filepath = os.path.join('scripts', filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved {len(documents)} documents to {filepath}")
        return filepath

async def main():
    """Main async function to run the enhanced medical document scraper"""
    scraper = EnhancedMedicalScraper()
    
    logger.info("🏥 Enhanced WellnessGrid Medical Document Scraper v2.0")
    logger.info("📊 Target: 10x current database (30 → 300+ documents)")
    logger.info("🎯 Comprehensive source coverage with async processing")
    
    try:
        # Scrape all sources
        documents = await scraper.scrape_all_sources()
        
        if documents:
            # Save documents
            filepath = scraper.save_documents(documents)
            
            logger.info("✅ Enhanced scraping completed successfully!")
            logger.info(f"📄 Documents scraped: {len(documents)}")
            logger.info(f"💾 Saved to: {filepath}")
            logger.info("🔄 Next step: Run embed_scraped_documents.py to add to database")
            
            # Print comprehensive statistics
            logger.info("\n📊 Comprehensive Statistics:")
            
            # Source distribution
            source_counts = {}
            category_counts = {}
            type_counts = {}
            
            for doc in documents:
                source_counts[doc['source']] = source_counts.get(doc['source'], 0) + 1
                category_counts[doc['category']] = category_counts.get(doc['category'], 0) + 1
                type_counts[doc['document_type']] = type_counts.get(doc['document_type'], 0) + 1
            
            logger.info(f"\n📚 Source Distribution ({len(source_counts)} sources):")
            for source, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"   {source}: {count} documents")
            
            logger.info(f"\n🏷️ Category Distribution:")
            for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"   {category}: {count} documents")
            
            logger.info(f"\n📋 Document Type Distribution:")
            for doc_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
                logger.info(f"   {doc_type}: {count} documents")
            
            # Check if we reached 10x goal
            target_docs = 300
            if len(documents) >= target_docs:
                logger.info(f"\n🎉 SUCCESS: Achieved 10x expansion goal!")
                logger.info(f"🎯 Target: {target_docs}+ documents | Actual: {len(documents)} documents")
            else:
                logger.info(f"\n📈 Progress toward 10x goal:")
                logger.info(f"🎯 Target: {target_docs} documents | Current: {len(documents)} documents ({len(documents)/target_docs*100:.1f}%)")
        
        else:
            logger.error("❌ No documents were scraped successfully")
    
    except Exception as e:
        logger.error(f"❌ Enhanced scraping failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 