// Test script for the enhanced WellnessGrid API with Gemini/OpenRouter integration
// Run with: node tests/test-enhanced-api.js

const API_BASE_URL = 'http://localhost:3000/api';

async function testApiStatus() {
  console.log('🔍 Testing API Status...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/ask`);
    const data = await response.json();
    
    console.log('✅ API Status Response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if LLM services are available
    if (data.llmServices) {
      console.log('\n📊 LLM Services Status:');
      console.log(`- Gemini Available: ${data.llmServices.geminiAvailable ? '✅' : '❌'}`);
      console.log(`- OpenRouter Available: ${data.llmServices.openrouterAvailable ? '✅' : '❌'}`);
      console.log(`- Has Any Service: ${data.llmServices.hasAnyService ? '✅' : '❌'}`);
      
      if (data.features) {
        console.log('\n🚀 Enhanced Features:');
        console.log(`- Query Enhancement: ${data.features.queryEnhancement ? '✅' : '❌'}`);
        console.log(`- Response Improvement: ${data.features.responseImprovement ? '✅' : '❌'}`);
        console.log(`- Fallback Support: ${data.features.fallbackSupport ? '✅' : '❌'}`);
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ API Status Test Failed:', error.message);
    return null;
  }
}

async function testEnhancedQuery(query) {
  console.log(`\n🧠 Testing Enhanced Query: "${query}"\n`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    
    console.log('📝 Original Query:', data.query);
    
    if (data.enhancedQuery) {
      console.log('🔄 Enhanced Query:', data.enhancedQuery);
    } else {
      console.log('⚠️ Query was not enhanced');
    }
    
    console.log('\n💬 Final Response:');
    console.log(data.answer);
    
    if (data.improvedAnswer && data.improvedAnswer !== data.answer) {
      console.log('\n✨ Response was improved by LLM');
    } else {
      console.log('\n⚠️ Response was not improved');
    }
    
    console.log('\n📊 Enhancement Metadata:');
    if (data.metadata?.llmEnhancement) {
      const enhancement = data.metadata.llmEnhancement;
      console.log(`- Query Enhanced: ${enhancement.queryEnhanced ? '✅' : '❌'}`);
      if (enhancement.queryEnhancementService) {
        console.log(`- Query Enhancement Service: ${enhancement.queryEnhancementService}`);
      }
      console.log(`- Response Improved: ${enhancement.responseImproved ? '✅' : '❌'}`);
      if (enhancement.responseImprovementService) {
        console.log(`- Response Improvement Service: ${enhancement.responseImprovementService}`);
      }
      if (enhancement.fallbacksUsed.length > 0) {
        console.log(`- Fallbacks Used: ${enhancement.fallbacksUsed.join(', ')}`);
      }
    }
    
    console.log('\n🔬 RAG Metadata:');
    console.log(`- Documents Used: ${data.metadata?.documentsUsed || 0}`);
    console.log(`- Total Found: ${data.metadata?.totalFound || 0}`);
    console.log(`- Flask Backend Used: ${data.metadata?.flaskBackendUsed ? '✅' : '❌'}`);
    console.log(`- Sources Count: ${data.sources?.length || 0}`);
    
    return data;
  } catch (error) {
    console.error('❌ Enhanced Query Test Failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🏥 WellnessGrid Enhanced API Tests\n');
  console.log('=' .repeat(50));
  
  // Test 1: API Status
  const status = await testApiStatus();
  
  if (!status) {
    console.log('\n❌ Cannot proceed with tests - API is not responding');
    return;
  }
  
  console.log('\n' + '=' .repeat(50));
  
  // Test 2: Simple health query
  await testEnhancedQuery('I have a headache');
  
  console.log('\n' + '=' .repeat(50));
  
  // Test 3: Complex medical query
  await testEnhancedQuery('What are the symptoms of diabetes and how is it diagnosed?');
  
  console.log('\n' + '=' .repeat(50));
  
  // Test 4: Symptom query
  await testEnhancedQuery('I feel tired all the time and have joint pain');
  
  console.log('\n✅ Tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Add your Gemini API key to .env.local (GEMINI_API_KEY)');
  console.log('2. Add your OpenRouter API key to .env.local (OPENROUTER_API_KEY)');
  console.log('3. Ensure your Flask backend is running for embeddings');
  console.log('4. Check the logs above for enhancement status');
}

// Handle fetch not being available in Node.js < 18
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you can install node-fetch');
  console.log('Alternative: Run tests in browser console or use curl commands from the docs');
  process.exit(1);
}

// Run the tests
runTests().catch(console.error); 