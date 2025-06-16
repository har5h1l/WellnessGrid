const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY;

async function testEndpoint(url, model, payload) {
  try {
    console.log(`\nTesting endpoint: ${url}`);
    console.log('Model:', model);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
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
      } catch (e) {
        console.log('Response is not JSON');
      }
    }

    return response.ok;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('Starting Hugging Face API tests...');
  console.log('Token present:', !!HF_TOKEN);
  console.log('Token length:', HF_TOKEN?.length);
  console.log('Token prefix:', HF_TOKEN?.substring(0, 3));

  const testCases = [
    {
      name: 'Test 1: Basic GPT-2 (Inference Endpoints)',
      url: 'https://api-inference.huggingface.co/endpoints/gpt2',
      model: 'gpt2',
      payload: { 
        inputs: 'Hello, how are you?',
        options: { wait_for_model: true }
      }
    },
    {
      name: 'Test 2: Alternative model (Inference Endpoints)',
      url: 'https://api-inference.huggingface.co/endpoints/facebook/opt-350m',
      model: 'facebook/opt-350m',
      payload: { 
        inputs: 'Hello, how are you?',
        options: { wait_for_model: true }
      }
    },
    {
      name: 'Test 3: BioGPT model (Inference Endpoints)',
      url: 'https://api-inference.huggingface.co/endpoints/microsoft/BioGPT-Large',
      model: 'microsoft/BioGPT-Large',
      payload: { 
        inputs: 'Hello, how are you?',
        options: { wait_for_model: true }
      }
    }
  ];

  for (const test of testCases) {
    console.log(`\n${test.name}`);
    console.log('='.repeat(50));
    await testEndpoint(test.url, test.model, test.payload);
  }
}

runTests().catch(console.error); 