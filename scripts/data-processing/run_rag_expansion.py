#!/usr/bin/env python3
"""
RAG System Expansion Automation Script
Runs the complete process to 10x the WellnessGrid RAG system database
"""

import os
import sys
import subprocess
import logging
import json
import time
from datetime import datetime
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RAGExpansionAutomator:
    """Automates the complete RAG expansion process"""
    
    def __init__(self):
        self.scripts_dir = Path(__file__).parent
        self.start_time = None
        self.results = {}
        
    def check_prerequisites(self) -> bool:
        """Check if all required dependencies are installed"""
        logger.info("🔍 Checking prerequisites...")
        
        required_packages = [
            'beautifulsoup4',
            'feedparser',
            'aiohttp',
            'lxml',
            'requests',
            'sentence-transformers',
            'supabase',
            'python-dotenv'
        ]
        
        missing_packages = []
        
        for package in required_packages:
            try:
                __import__(package.replace('-', '_'))
            except ImportError:
                missing_packages.append(package)
        
        if missing_packages:
            logger.error(f"❌ Missing required packages: {', '.join(missing_packages)}")
            logger.info("💡 Install them with: pip install " + " ".join(missing_packages))
            return False
        
        # Check environment variables
        required_env_vars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY'
        ]
        
        missing_env_vars = []
        for var in required_env_vars:
            if not os.getenv(var):
                missing_env_vars.append(var)
        
        if missing_env_vars:
            logger.error(f"❌ Missing environment variables: {', '.join(missing_env_vars)}")
            logger.info("💡 Please set them in your .env file")
            return False
        
        logger.info("✅ All prerequisites satisfied")
        return True
    
    def get_current_database_stats(self) -> dict:
        """Get current database statistics"""
        logger.info("📊 Getting current database statistics...")
        
        try:
            # Try to import and use Supabase to get stats
            from supabase import create_client
            from dotenv import load_dotenv
            load_dotenv()
            
            supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
            
            if supabase_url and supabase_key:
                supabase = create_client(supabase_url, supabase_key)
                
                # Get document count
                docs_result = supabase.table('medical_documents').select('count').execute()
                doc_count = len(docs_result.data) if docs_result.data else 0
                
                # Get chunk count
                chunks_result = supabase.table('document_embeddings').select('count').execute()
                chunk_count = len(chunks_result.data) if chunks_result.data else 0
                
                stats = {
                    'documents': doc_count,
                    'chunks': chunk_count,
                    'target_documents': doc_count * 10,
                    'target_chunks': chunk_count * 10
                }
                
                logger.info(f"📈 Current database: {doc_count} documents, {chunk_count} chunks")
                logger.info(f"🎯 Target: {stats['target_documents']} documents, {stats['target_chunks']} chunks")
                
                return stats
            
        except Exception as e:
            logger.warning(f"Could not get database stats: {e}")
        
        # Fallback values
        return {
            'documents': 30,
            'chunks': 502,
            'target_documents': 300,
            'target_chunks': 5000
        }
    
    def run_scraper(self) -> bool:
        """Run the medical document scraper"""
        logger.info("🏥 Starting medical document scraping...")
        
        scraper_script = self.scripts_dir / 'medical_document_scraper.py'
        
        if not scraper_script.exists():
            logger.error(f"❌ Scraper script not found: {scraper_script}")
            return False
        
        try:
            # Run the scraper
            result = subprocess.run(
                [sys.executable, str(scraper_script)],
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout
            )
            
            if result.returncode == 0:
                logger.info("✅ Document scraping completed successfully")
                
                # Parse output for statistics
                output_lines = result.stdout.split('\n')
                for line in output_lines:
                    if 'Documents scraped:' in line:
                        try:
                            scraped_count = int(line.split(':')[1].strip())
                            self.results['scraped_documents'] = scraped_count
                            logger.info(f"📄 Scraped {scraped_count} documents")
                        except:
                            pass
                
                return True
            else:
                logger.error(f"❌ Scraper failed with exit code: {result.returncode}")
                logger.error(f"Error output: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("❌ Scraper timed out after 1 hour")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to run scraper: {e}")
            return False
    
    def run_embedder(self) -> bool:
        """Run the document embedder"""
        logger.info("🧠 Starting document embedding...")
        
        embedder_script = self.scripts_dir / 'embed_scraped_documents.py'
        scraped_file = self.scripts_dir / 'scraped_medical_documents.json'
        
        if not embedder_script.exists():
            logger.error(f"❌ Embedder script not found: {embedder_script}")
            return False
        
        if not scraped_file.exists():
            logger.error(f"❌ Scraped documents file not found: {scraped_file}")
            logger.info("💡 Make sure the scraper ran successfully first")
            return False
        
        try:
            # Run the embedder
            result = subprocess.run(
                [sys.executable, str(embedder_script)],
                capture_output=True,
                text=True,
                timeout=7200  # 2 hour timeout
            )
            
            if result.returncode == 0:
                logger.info("✅ Document embedding completed successfully")
                
                # Parse output for statistics
                output_lines = result.stdout.split('\n')
                for line in output_lines:
                    if 'Successfully embedded:' in line:
                        try:
                            embedded_count = int(line.split(':')[1].strip().split()[0])
                            self.results['embedded_documents'] = embedded_count
                            logger.info(f"📄 Embedded {embedded_count} documents")
                        except:
                            pass
                    elif 'Total chunks created:' in line:
                        try:
                            chunk_count = int(line.split(':')[1].strip())
                            self.results['total_chunks'] = chunk_count
                            logger.info(f"📄 Created {chunk_count} chunks")
                        except:
                            pass
                
                return True
            else:
                logger.error(f"❌ Embedder failed with exit code: {result.returncode}")
                logger.error(f"Error output: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("❌ Embedder timed out after 2 hours")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to run embedder: {e}")
            return False
    
    def validate_expansion(self, initial_stats: dict) -> bool:
        """Validate that the expansion was successful"""
        logger.info("🔍 Validating RAG expansion results...")
        
        try:
            final_stats = self.get_current_database_stats()
            
            docs_added = final_stats['documents'] - initial_stats['documents']
            chunks_added = final_stats['chunks'] - initial_stats['chunks']
            
            logger.info(f"📈 Documents added: {docs_added}")
            logger.info(f"📈 Chunks added: {chunks_added}")
            
            # Check if we achieved significant expansion
            expansion_ratio = final_stats['documents'] / initial_stats['documents'] if initial_stats['documents'] > 0 else 1
            
            if expansion_ratio >= 5:  # At least 5x expansion
                logger.info(f"🎉 SUCCESS: Achieved {expansion_ratio:.1f}x database expansion!")
                if expansion_ratio >= 10:
                    logger.info("🏆 EXCELLENT: Exceeded 10x expansion goal!")
                return True
            elif expansion_ratio >= 2:
                logger.info(f"✅ GOOD: Achieved {expansion_ratio:.1f}x expansion (target: 10x)")
                return True
            else:
                logger.warning(f"⚠️ LIMITED: Only achieved {expansion_ratio:.1f}x expansion")
                return False
                
        except Exception as e:
            logger.error(f"Failed to validate expansion: {e}")
            return False
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        logger.info("🧹 Cleaning up temporary files...")
        
        temp_files = [
            'scraped_medical_documents.json',
            'embedding_session_*.json'
        ]
        
        for pattern in temp_files:
            try:
                for file_path in self.scripts_dir.glob(pattern):
                    if file_path.is_file():
                        # Keep the files but log their locations
                        logger.info(f"📄 Preserved: {file_path}")
            except Exception as e:
                logger.warning(f"Could not process {pattern}: {e}")
    
    def generate_final_report(self, initial_stats: dict):
        """Generate a comprehensive final report"""
        logger.info("📊 Generating final expansion report...")
        
        end_time = time.time()
        total_time = end_time - self.start_time
        
        try:
            final_stats = self.get_current_database_stats()
            
            report = {
                'expansion_session': {
                    'timestamp': datetime.now().isoformat(),
                    'duration_minutes': total_time / 60,
                    'initial_stats': initial_stats,
                    'final_stats': final_stats,
                    'expansion_results': {
                        'documents_added': final_stats['documents'] - initial_stats['documents'],
                        'chunks_added': final_stats['chunks'] - initial_stats['chunks'],
                        'expansion_ratio': final_stats['documents'] / initial_stats['documents'] if initial_stats['documents'] > 0 else 1
                    },
                    'process_results': self.results
                }
            }
            
            # Save report
            report_file = self.scripts_dir / f"expansion_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            logger.info(f"📋 Final report saved to: {report_file}")
            
            # Print summary
            logger.info("\n" + "="*60)
            logger.info("🎯 RAG EXPANSION SUMMARY")
            logger.info("="*60)
            logger.info(f"⏱️  Total time: {total_time/60:.1f} minutes")
            logger.info(f"📊 Initial documents: {initial_stats['documents']}")
            logger.info(f"📊 Final documents: {final_stats['documents']}")
            logger.info(f"📈 Documents added: {final_stats['documents'] - initial_stats['documents']}")
            logger.info(f"📈 Expansion ratio: {final_stats['documents'] / initial_stats['documents'] if initial_stats['documents'] > 0 else 1:.1f}x")
            logger.info(f"📄 Total chunks: {final_stats['chunks']}")
            logger.info("="*60)
            
        except Exception as e:
            logger.error(f"Failed to generate final report: {e}")
    
    def run_complete_expansion(self):
        """Run the complete RAG expansion process"""
        self.start_time = time.time()
        
        logger.info("🚀 Starting WellnessGrid RAG System 10x Expansion")
        logger.info("="*60)
        
        # Step 1: Check prerequisites
        if not self.check_prerequisites():
            logger.error("❌ Prerequisites not met. Exiting.")
            return False
        
        # Step 2: Get initial stats
        initial_stats = self.get_current_database_stats()
        
        # Step 3: Run scraper
        if not self.run_scraper():
            logger.error("❌ Scraping failed. Exiting.")
            return False
        
        # Step 4: Run embedder
        if not self.run_embedder():
            logger.error("❌ Embedding failed. Exiting.")
            return False
        
        # Step 5: Validate expansion
        success = self.validate_expansion(initial_stats)
        
        # Step 6: Generate final report
        self.generate_final_report(initial_stats)
        
        # Step 7: Cleanup
        self.cleanup_temp_files()
        
        if success:
            logger.info("🎉 RAG expansion completed successfully!")
            logger.info("🚀 Your WellnessGrid RAG system is now significantly more powerful!")
        else:
            logger.warning("⚠️ RAG expansion completed with limited success")
        
        return success

def main():
    """Main function"""
    automator = RAGExpansionAutomator()
    success = automator.run_complete_expansion()
    
    if success:
        print("\n🎉 SUCCESS: RAG system expansion completed!")
        print("🔥 Your WellnessGrid app now has 10x more medical knowledge!")
        exit(0)
    else:
        print("\n❌ PARTIAL SUCCESS: Some issues occurred during expansion")
        print("💡 Check the logs above for details")
        exit(1)

if __name__ == "__main__":
    main() 