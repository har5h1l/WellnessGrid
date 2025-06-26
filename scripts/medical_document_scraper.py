#!/usr/bin/env python3
"""
Medical Document Scraper for WellnessGrid RAG System
Scrapes credible, open-source medical information from multiple authoritative sources
"""

import os
import requests
import json
import hashlib
import time
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import xml.etree.ElementTree as ET

# Web scraping libraries
try:
    from bs4 import BeautifulSoup
    import feedparser
except ImportError:
    print("Please install required packages: pip install beautifulsoup4 feedparser lxml")
    exit(1)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MedicalDocumentScraper:
    """Comprehensive medical document scraper for authoritative sources"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'WellnessGrid-RAG-System/1.0 (Medical Research; Contact: research@wellnessgrid.com)'
        })
        self.scraped_documents = []
        self.failed_urls = []
        
    def scrape_who_guidelines(self) -> List[Dict[str, Any]]:
        """Scrape WHO health guidelines and recommendations"""
        logger.info("🏥 Scraping WHO Guidelines...")
        documents = []
        
        # WHO Publications Feed
        who_feeds = [
            'https://www.who.int/feeds/entity/mediacentre/news/en/rss.xml',
            'https://www.who.int/feeds/entity/publications/en/rss.xml'
        ]
        
        for feed_url in who_feeds:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:20]:  # Limit to recent entries
                    content = self._extract_article_content(entry.link)
                    if content and len(content) > 500:
                        documents.append({
                            'title': entry.title,
                            'content': content,
                            'source': 'WHO',
                            'topic': 'global_health_guidelines',
                            'url': entry.link,
                            'document_type': 'guideline',
                            'published_date': entry.get('published', ''),
                            'category': 'global_health',
                            'subcategory': 'who_guidelines'
                        })
            except Exception as e:
                logger.error(f"Failed to scrape WHO feed {feed_url}: {e}")
        
        # WHO specific health topics
        who_topics = [
            'https://www.who.int/health-topics/diabetes',
            'https://www.who.int/health-topics/cardiovascular-diseases',
            'https://www.who.int/health-topics/mental-disorders',
            'https://www.who.int/health-topics/cancer',
            'https://www.who.int/health-topics/respiratory-diseases',
            'https://www.who.int/health-topics/infectious-diseases',
            'https://www.who.int/health-topics/nutrition',
            'https://www.who.int/health-topics/physical-activity',
            'https://www.who.int/health-topics/hypertension',
            'https://www.who.int/health-topics/obesity',
            'https://www.who.int/health-topics/stroke',
            'https://www.who.int/health-topics/chronic-kidney-disease',
            'https://www.who.int/health-topics/liver-disease',
            'https://www.who.int/health-topics/epilepsy'
        ]
        
        for url in who_topics:
            try:
                content = self._extract_article_content(url)
                if content and len(content) > 500:
                    topic_name = url.split('/')[-1].replace('-', ' ').title()
                    documents.append({
                        'title': f'WHO Health Topic: {topic_name}',
                        'content': content,
                        'source': 'WHO',
                        'topic': 'health_topics',
                        'url': url,
                        'document_type': 'health_topic',
                        'category': 'global_health',
                        'subcategory': 'who_health_topics'
                    })
            except Exception as e:
                logger.error(f"Failed to scrape WHO topic {url}: {e}")
        
        logger.info(f"✅ Scraped {len(documents)} WHO documents")
        return documents
    
    def scrape_cdc_resources(self) -> List[Dict[str, Any]]:
        """Scrape CDC health information and guidelines"""
        logger.info("🏛️ Scraping CDC Resources...")
        documents = []
        
        # CDC health topics
        cdc_topics = [
            'https://www.cdc.gov/diabetes/basics/diabetes.html',
            'https://www.cdc.gov/heartdisease/about.htm',
            'https://www.cdc.gov/mentalhealth/basics/mental-illness/index.htm',
            'https://www.cdc.gov/cancer/dcpc/about/index.htm',
            'https://www.cdc.gov/copd/basics-about.html',
            'https://www.cdc.gov/bloodpressure/about.htm',
            'https://www.cdc.gov/cholesterol/about.htm',
            'https://www.cdc.gov/obesity/basics/causes.html',
            'https://www.cdc.gov/physicalactivity/basics/pa-health/index.htm',
            'https://www.cdc.gov/nutrition/basics/index.html',
            'https://www.cdc.gov/sleep/about_sleep/sleep_hygiene.html',
            'https://www.cdc.gov/tobacco/basic_information/health_effects/index.htm',
            'https://www.cdc.gov/alcohol/basics/index.htm',
            'https://www.cdc.gov/vaccines/basics/index.html',
            'https://www.cdc.gov/handwashing/when-how-handwashing.html',
            'https://www.cdc.gov/stroke/about.htm',
            'https://www.cdc.gov/arthritis/basics/index.html',
            'https://www.cdc.gov/aging/basics/index.html'
        ]
        
        for url in cdc_topics:
            try:
                content = self._extract_article_content(url)
                if content and len(content) > 500:
                    # Extract topic from URL
                    path_parts = urlparse(url).path.split('/')
                    topic = path_parts[1] if len(path_parts) > 1 else 'general'
                    
                    documents.append({
                        'title': f'CDC: {topic.replace("-", " ").title()} Information',
                        'content': content,
                        'source': 'CDC',
                        'topic': topic,
                        'url': url,
                        'document_type': 'health_information',
                        'category': 'public_health',
                        'subcategory': 'cdc_resources'
                    })
            except Exception as e:
                logger.error(f"Failed to scrape CDC topic {url}: {e}")
        
        logger.info(f"✅ Scraped {len(documents)} CDC documents")
        return documents
    
    def scrape_nih_resources(self) -> List[Dict[str, Any]]:
        """Scrape NIH/NLM medical resources"""
        logger.info("🔬 Scraping NIH Resources...")
        documents = []
        
        # MedlinePlus health topics
        medlineplus_topics = [
            'https://medlineplus.gov/diabetesmellitus.html',
            'https://medlineplus.gov/heartdisease.html',
            'https://medlineplus.gov/mentalhealth.html',
            'https://medlineplus.gov/cancer.html',
            'https://medlineplus.gov/copd.html',
            'https://medlineplus.gov/highbloodpressure.html',
            'https://medlineplus.gov/cholesterol.html',
            'https://medlineplus.gov/obesity.html',
            'https://medlineplus.gov/exercise.html',
            'https://medlineplus.gov/nutrition.html',
            'https://medlineplus.gov/sleep.html',
            'https://medlineplus.gov/smoking.html',
            'https://medlineplus.gov/alcoholism.html',
            'https://medlineplus.gov/immunization.html',
            'https://medlineplus.gov/germsandhygiene.html',
            'https://medlineplus.gov/stroke.html',
            'https://medlineplus.gov/arthritis.html',
            'https://medlineplus.gov/osteoporosis.html',
            'https://medlineplus.gov/kidneydisease.html',
            'https://medlineplus.gov/liverdisease.html',
            'https://medlineplus.gov/alzheimers.html',
            'https://medlineplus.gov/parkinsons.html',
            'https://medlineplus.gov/epilepsy.html',
            'https://medlineplus.gov/asthma.html'
        ]
        
        for url in medlineplus_topics:
            try:
                content = self._extract_article_content(url)
                if content and len(content) > 500:
                    # Extract topic from URL
                    topic = url.split('/')[-1].replace('.html', '').replace('medlineplus.gov/', '')
                    
                    documents.append({
                        'title': f'MedlinePlus: {topic.replace("", " ").title()}',
                        'content': content,
                        'source': 'NIH_MedlinePlus',
                        'topic': topic,
                        'url': url,
                        'document_type': 'patient_education',
                        'category': 'patient_education',
                        'subcategory': 'medlineplus'
                    })
            except Exception as e:
                logger.error(f"Failed to scrape MedlinePlus topic {url}: {e}")
        
        # NIH Institute resources
        nih_institutes = [
            'https://www.nhlbi.nih.gov/health/heart',
            'https://www.nhlbi.nih.gov/health/blood-pressure',
            'https://www.nhlbi.nih.gov/health/cholesterol',
            'https://www.nhlbi.nih.gov/health/sleep',
            'https://www.niddk.nih.gov/health-information/diabetes',
            'https://www.niddk.nih.gov/health-information/kidney-disease',
            'https://www.niddk.nih.gov/health-information/liver-disease',
            'https://www.nimh.nih.gov/health/topics/depression',
            'https://www.nimh.nih.gov/health/topics/anxiety-disorders',
            'https://www.nimh.nih.gov/health/topics/bipolar-disorder'
        ]
        
        for url in nih_institutes:
            try:
                content = self._extract_article_content(url)
                if content and len(content) > 500:
                    # Extract institute and topic
                    domain_parts = urlparse(url).netloc.split('.')
                    institute = domain_parts[0] if domain_parts else 'NIH'
                    topic = url.split('/')[-1].replace('-', '_')
                    
                    documents.append({
                        'title': f'NIH {institute.upper()}: {topic.replace("_", " ").title()}',
                        'content': content,
                        'source': f'NIH_{institute.upper()}',
                        'topic': topic,
                        'url': url,
                        'document_type': 'medical_information',
                        'category': 'government_health',
                        'subcategory': f'nih_{institute}'
                    })
            except Exception as e:
                logger.error(f"Failed to scrape NIH resource {url}: {e}")
        
        logger.info(f"✅ Scraped {len(documents)} NIH documents")
        return documents
    
    def scrape_pubmed_central(self) -> List[Dict[str, Any]]:
        """Scrape open access articles from PubMed Central"""
        logger.info("📚 Scraping PubMed Central Open Access...")
        documents = []
        
        # Search terms for medical topics
        search_terms = [
            'diabetes+management',
            'cardiovascular+disease+prevention',
            'mental+health+treatment',
            'cancer+screening',
            'chronic+disease+management',
            'nutrition+therapy',
            'exercise+medicine',
            'sleep+disorders',
            'preventive+medicine',
            'primary+care+guidelines',
            'hypertension+treatment',
            'obesity+management',
            'stroke+prevention',
            'asthma+treatment',
            'copd+management'
        ]
        
        base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
        
        for term in search_terms:
            try:
                # Search for articles
                search_url = f"{base_url}esearch.fcgi?db=pmc&term={term}&retmax=5&usehistory=y"
                search_response = self.session.get(search_url)
                search_root = ET.fromstring(search_response.content)
                
                # Get PMC IDs
                pmc_ids = [id_elem.text for id_elem in search_root.findall('.//Id')]
                
                if pmc_ids:
                    # Fetch article details
                    ids_str = ','.join(pmc_ids)
                    fetch_url = f"{base_url}efetch.fcgi?db=pmc&id={ids_str}&retmode=xml"
                    fetch_response = self.session.get(fetch_url)
                    
                    if fetch_response.status_code == 200:
                        self._parse_pubmed_xml(fetch_response.content, documents, term)
                        
            except Exception as e:
                logger.error(f"Failed to scrape PubMed for term {term}: {e}")
            
            # Rate limiting for PubMed API
            time.sleep(1)
        
        logger.info(f"✅ Scraped {len(documents)} PubMed Central documents")
        return documents
    
    def scrape_medical_associations(self) -> List[Dict[str, Any]]:
        """Scrape medical association guidelines and resources"""
        logger.info("🏥 Scraping Medical Association Resources...")
        documents = []
        
        # Medical association sources
        association_sources = [
            'https://www.heart.org/en/health-topics/consumer-healthcare/what-is-cardiovascular-disease',
            'https://www.heart.org/en/health-topics/high-blood-pressure',
            'https://www.cancer.org/cancer/breast-cancer.html',
            'https://www.cancer.org/healthy-living/eat-healthy-get-active.html',
            'https://diabetes.org/diabetes/type-1',
            'https://diabetes.org/diabetes/type-2',
            'https://www.lung.org/lung-health-diseases/lung-disease-lookup/copd',
            'https://www.lung.org/lung-health-diseases/lung-disease-lookup/asthma',
            'https://www.psychiatry.org/patients-families/depression',
            'https://www.psychiatry.org/patients-families/anxiety-disorders',
            'https://www.kidney.org/atoz',
            'https://liverfoundation.org/for-patients/about-the-liver',
            'https://www.epilepsy.com/learn/about-epilepsy-seizures'
        ]
        
        for url in association_sources:
            try:
                content = self._extract_article_content(url)
                if content and len(content) > 500:
                    # Extract organization from URL
                    domain = urlparse(url).netloc
                    org_parts = domain.split('.')
                    org = org_parts[1] if len(org_parts) > 2 else org_parts[0]
                    
                    # Extract topic from path
                    path_parts = urlparse(url).path.split('/')
                    topic = path_parts[-1] if path_parts else 'information'
                    
                    documents.append({
                        'title': f'{org.upper()} Guidelines: {topic.replace("-", " ").replace("_", " ").title()}',
                        'content': content,
                        'source': f'{org.upper()}_Association',
                        'topic': topic,
                        'url': url,
                        'document_type': 'professional_guideline',
                        'category': 'medical_associations',
                        'subcategory': f'{org}_guidelines'
                    })
            except Exception as e:
                logger.error(f"Failed to scrape association source {url}: {e}")
        
        logger.info(f"✅ Scraped {len(documents)} medical association documents")
        return documents
    
    def scrape_international_health(self) -> List[Dict[str, Any]]:
        """Scrape international health organization resources"""
        logger.info("🌍 Scraping International Health Resources...")
        documents = []
        
        # International health sources
        international_sources = [
            'https://www.nhs.uk/conditions/type-2-diabetes',
            'https://www.nhs.uk/conditions/heart-disease',
            'https://www.nhs.uk/conditions/depression',
            'https://www.nhs.uk/conditions/high-blood-pressure',
            'https://www.nhs.uk/live-well/eat-well',
            'https://www.nhs.uk/live-well/exercise',
            'https://www.canada.ca/en/health-canada/services/healthy-living',
            'https://www.health.gov.au/health-topics/diabetes',
            'https://www.health.gov.au/health-topics/heart-disease',
            'https://www.health.gov.au/health-topics/mental-health'
        ]
        
        for url in international_sources:
            try:
                content = self._extract_article_content(url)
                if content and len(content) > 500:
                    # Extract country/organization
                    domain = urlparse(url).netloc
                    if 'nhs.uk' in domain:
                        org = 'NHS_UK'
                    elif 'canada.ca' in domain:
                        org = 'Health_Canada'
                    elif 'health.gov.au' in domain:
                        org = 'Australian_Health'
                    else:
                        org = 'International_Health'
                    
                    # Extract topic
                    path_parts = urlparse(url).path.split('/')
                    topic = path_parts[-1] if path_parts else 'health_information'
                    
                    documents.append({
                        'title': f'{org}: {topic.replace("-", " ").replace("_", " ").title()}',
                        'content': content,
                        'source': org,
                        'topic': topic,
                        'url': url,
                        'document_type': 'health_information',
                        'category': 'international_health',
                        'subcategory': org.lower()
                    })
            except Exception as e:
                logger.error(f"Failed to scrape international source {url}: {e}")
        
        logger.info(f"✅ Scraped {len(documents)} international health documents")
        return documents
    
    def scrape_preventive_health(self) -> List[Dict[str, Any]]:
        """Scrape preventive health and wellness resources"""
        logger.info("🛡️ Scraping Preventive Health Resources...")
        documents = []
        
        # Preventive health sources
        preventive_sources = [
            'https://www.cdc.gov/prevention/index.html',
            'https://www.cdc.gov/cancer/dcpc/prevention/index.htm',
            'https://www.cdc.gov/heartdisease/prevention.htm',
            'https://www.cdc.gov/diabetes/prevention/index.html',
            'https://medlineplus.gov/firstaid.html',
            'https://medlineplus.gov/emergencies.html',
            'https://www.uspreventiveservicestaskforce.org/uspstf/recommendations',
            'https://www.redcross.org/take-a-class/first-aid'
        ]
        
        for url in preventive_sources:
            try:
                content = self._extract_article_content(url)
                if content and len(content) > 500:
                    # Extract organization
                    domain = urlparse(url).netloc
                    if 'cdc.gov' in domain:
                        org = 'CDC_Prevention'
                    elif 'medlineplus.gov' in domain:
                        org = 'MedlinePlus_Emergency'
                    elif 'uspreventiveservicestaskforce.org' in domain:
                        org = 'USPSTF'
                    elif 'redcross.org' in domain:
                        org = 'Red_Cross'
                    else:
                        org = 'Preventive_Health'
                    
                    # Extract topic
                    path_parts = urlparse(url).path.split('/')
                    topic = path_parts[1] if len(path_parts) > 1 else 'prevention'
                    
                    documents.append({
                        'title': f'{org}: {topic.replace("-", " ").title()}',
                        'content': content,
                        'source': org,
                        'topic': topic,
                        'url': url,
                        'document_type': 'prevention_guide',
                        'category': 'preventive_health',
                        'subcategory': org.lower()
                    })
            except Exception as e:
                logger.error(f"Failed to scrape preventive source {url}: {e}")
        
        logger.info(f"✅ Scraped {len(documents)} preventive health documents")
        return documents
    
    def _extract_article_content(self, url: str) -> Optional[str]:
        """Extract clean text content from a web page"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer", "aside", "form"]):
                script.decompose()
            
            # Find main content areas
            content_selectors = [
                'main', 'article', '.content', '.main-content', 
                '.article-content', '.post-content', '#content',
                '.entry-content', '.page-content', '.text-content'
            ]
            
            content = None
            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem:
                    content = content_elem.get_text()
                    break
            
            # Fallback to body if no main content found
            if not content:
                body = soup.find('body')
                if body:
                    content = body.get_text()
            
            if content:
                # Clean up text
                lines = (line.strip() for line in content.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                content = ' '.join(chunk for chunk in chunks if chunk)
                
                # Filter out very short content
                if len(content) > 200:
                    return content
            
        except Exception as e:
            logger.error(f"Failed to extract content from {url}: {e}")
            self.failed_urls.append(url)
        
        return None
    
    def _parse_pubmed_xml(self, xml_content: bytes, documents: List[Dict], search_term: str):
        """Parse PubMed Central XML content"""
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
                        abstract = ' '.join(p.text for p in abstract_elem.findall('.//p') if p.text)
                    
                    # Extract body content (if available)
                    body_elem = article.find('.//body')
                    body_content = ""
                    if body_elem is not None:
                        body_content = ' '.join(p.text for p in body_elem.findall('.//p') if p.text)
                    
                    # Combine content
                    full_content = f"{abstract} {body_content}".strip()
                    
                    if len(full_content) > 500:
                        documents.append({
                            'title': title,
                            'content': full_content,
                            'source': 'PubMed_Central',
                            'topic': search_term.replace('+', '_'),
                            'url': f"https://www.ncbi.nlm.nih.gov/pmc/",
                            'document_type': 'research_article',
                            'category': 'research_literature',
                            'subcategory': 'pubmed_central'
                        })
                        
                except Exception as e:
                    logger.error(f"Failed to parse PubMed article: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to parse PubMed XML: {e}")
    
    def scrape_all_sources(self) -> List[Dict[str, Any]]:
        """Scrape all medical sources concurrently"""
        logger.info("🚀 Starting comprehensive medical document scraping...")
        
        all_documents = []
        
        # Define scraping functions
        scraping_functions = [
            self.scrape_who_guidelines,
            self.scrape_cdc_resources,
            self.scrape_nih_resources,
            self.scrape_pubmed_central,
            self.scrape_medical_associations,
            self.scrape_international_health,
            self.scrape_preventive_health
        ]
        
        # Use ThreadPoolExecutor for concurrent scraping
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_function = {executor.submit(func): func.__name__ for func in scraping_functions}
            
            for future in as_completed(future_to_function):
                function_name = future_to_function[future]
                try:
                    documents = future.result()
                    all_documents.extend(documents)
                    logger.info(f"✅ Completed {function_name}: {len(documents)} documents")
                except Exception as e:
                    logger.error(f"❌ Failed {function_name}: {e}")
        
        # Remove duplicates based on content hash
        unique_documents = []
        seen_hashes = set()
        
        for doc in all_documents:
            content_hash = hashlib.sha256(doc['content'].encode()).hexdigest()
            if content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_documents.append(doc)
        
        logger.info(f"🎯 Total documents scraped: {len(unique_documents)} (removed {len(all_documents) - len(unique_documents)} duplicates)")
        logger.info(f"❌ Failed URLs: {len(self.failed_urls)}")
        
        return unique_documents
    
    def save_documents(self, documents: List[Dict[str, Any]], filename: str = "scraped_medical_documents.json"):
        """Save scraped documents to JSON file"""
        output_data = {
            'scraping_session': {
                'timestamp': datetime.now().isoformat(),
                'total_documents': len(documents),
                'failed_urls': self.failed_urls,
                'sources_covered': list(set(doc['source'] for doc in documents)),
                'categories_covered': list(set(doc['category'] for doc in documents)),
                'document_types': list(set(doc['document_type'] for doc in documents))
            },
            'documents': documents
        }
        
        filepath = os.path.join('scripts', filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved {len(documents)} documents to {filepath}")
        return filepath

def main():
    """Main function to run the medical document scraper"""
    scraper = MedicalDocumentScraper()
    
    logger.info("🏥 Starting WellnessGrid Medical Document Scraper")
    logger.info("📊 Target: 10x current database (30 → 300+ documents)")
    
    # Scrape all sources
    documents = scraper.scrape_all_sources()
    
    if documents:
        # Save documents
        filepath = scraper.save_documents(documents)
        
        logger.info("✅ Scraping completed successfully!")
        logger.info(f"📄 Documents scraped: {len(documents)}")
        logger.info(f"💾 Saved to: {filepath}")
        logger.info("🔄 Next step: Run embed_scraped_documents.py to add to database")
        
        # Print summary statistics
        source_counts = {}
        category_counts = {}
        type_counts = {}
        
        for doc in documents:
            source_counts[doc['source']] = source_counts.get(doc['source'], 0) + 1
            category_counts[doc['category']] = category_counts.get(doc['category'], 0) + 1
            type_counts[doc['document_type']] = type_counts.get(doc['document_type'], 0) + 1
        
        logger.info("\n📊 Source Distribution:")
        for source, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"   {source}: {count} documents")
        
        logger.info("\n📊 Category Distribution:")
        for category, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
            logger.info(f"   {category}: {count} documents")
        
        logger.info("\n📊 Document Type Distribution:")
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

if __name__ == "__main__":
    main() 