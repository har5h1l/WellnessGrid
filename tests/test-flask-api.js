const fetch = require('node-fetch');

// Flask API configuration
const FLASK_API_BASE_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

async function testFlaskEndpoint(endpoint, payload) {
  try {
    console.log(`\nTesting Flask endpoint: ${FLASK_API_BASE_URL}${endpoint}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${FLASK_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text);

    if (response.ok) {
      try {
        const json = JSON.parse(text);
        console.log('Parsed JSON:', JSON.stringify(json, null, 2));
        return json;
      } catch (e) {
        console.log('Response is not JSON');
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function runFlaskTests() {
  console.log('Starting Flask API tests...');
  console.log('Flask API URL:', FLASK_API_BASE_URL);

  // Test 1: Embedding endpoint
  console.log('\n' + '='.repeat(50));
  console.log('Test 1: BioBERT Embedding Generation');
  console.log('='.repeat(50));
  
  const embeddingResult = await testFlaskEndpoint('/embed', {
    text: 'What is diabetes and how to manage it?'
  });

  if (embeddingResult && embeddingResult.embedding) {
    console.log('✅ Embedding test passed');
    console.log(`Embedding dimensions: ${embeddingResult.embedding.length}`);
    console.log(`First 5 values: [${embeddingResult.embedding.slice(0, 5).join(', ')}...]`);
  } else {
    console.log('❌ Embedding test failed');
  }

  // Test 2: Text generation endpoint
  console.log('\n' + '='.repeat(50));
  console.log('Test 2: BioGPT Text Generation');
  console.log('='.repeat(50));
  
  const generationResult = await testFlaskEndpoint('/generate', {
    query: 'What is diabetes?',
    context: 'Document: Understanding Diabetes\nContent: Diabetes is a chronic condition that affects how your body processes blood sugar (glucose).',
    max_tokens: 100,
    temperature: 0.7
  });

  if (generationResult && generationResult.answer) {
    console.log('✅ Text generation test passed');
    console.log(`Generated answer length: ${generationResult.answer.length} characters`);
  } else {
    console.log('❌ Text generation test failed');
  }

  // Test 3: Health endpoint (if available)
  console.log('\n' + '='.repeat(50));
  console.log('Test 3: Health Check');
  console.log('='.repeat(50));
  
  try {
    const healthResponse = await fetch(`${FLASK_API_BASE_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed');
      console.log('Health status:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('❌ Health check failed - endpoint may not exist');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Flask API tests completed');
  console.log('='.repeat(50));
}

// Run the tests
runFlaskTests().catch(console.error); 