// Test script for the /api/ask endpoint
// Run with: npx ts-node examples/test-ask-api.ts

interface APIResponse {
  query: string;
  answer: string;
  sources?: Array<{
    title: string;
    similarity: string;
  }>;
  metadata?: {
    documentsUsed: number;
    processingTime: number;
    mockMode?: boolean;
  };
  error?: string;
}

async function testAskAPI(): Promise<void> {
  const baseUrl = 'http://localhost:3001'; // Updated to use port 3001
  
  const testQueries = [
    "What is normal blood pressure?",
    "How much sleep do I need?",
    "What are good stress management techniques?",
    "How does exercise affect heart rate?"
  ];

  console.log('Testing Ask API...\n');

  for (const query of testQueries) {
    try {
      console.log(`Query: "${query}"`);
      
      const response = await fetch(`${baseUrl}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        console.log('---\n');
        continue;
      }

      const result: APIResponse = await response.json();
      
      console.log('Answer:', result.answer);
      console.log('Sources used:', result.sources?.map(s => s.title).join(', ') || 'None');
      console.log('Mock mode:', result.metadata?.mockMode ? 'Yes' : 'No');
      console.log('Documents used:', result.metadata?.documentsUsed || 0);
      console.log('---\n');
      
    } catch (error) {
      console.error(`Error testing query "${query}":`, error);
      console.log('---\n');
    }
  }
}

// Simple test for API availability
async function testAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/ask', {
      method: 'GET'
    });
    
    console.log(`API Health Check - Status: ${response.status}`);
    
    if (response.status === 405) {
      console.log('✅ API endpoint is available (correctly returning 405 for GET requests)');
      return true;
    } else {
      console.log('❌ Unexpected response from API endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ API endpoint is not accessible:', error);
    return false;
  }
}

// Run the tests
async function main() {
  console.log('🔍 Testing API Health...\n');
  const isHealthy = await testAPIHealth();
  
  if (isHealthy) {
    console.log('\n🚀 Running API functionality tests...\n');
    await testAskAPI();
  } else {
    console.log('\n❌ API is not available. Make sure your Next.js development server is running.');
    console.log('Run: npm run dev');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { testAskAPI, testAPIHealth }; 