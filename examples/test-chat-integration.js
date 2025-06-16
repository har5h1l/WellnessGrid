// Test script to verify chat integration
// This simulates the chat functionality to ensure it works correctly

async function testChatIntegration() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing Chat Integration with LLM API...\n');
  
  const testScenarios = [
    {
      condition: 'diabetes',
      query: 'I have diabetes. What should I know about managing my blood sugar?',
      expected: 'Should provide diabetes-specific information'
    },
    {
      condition: 'asthma',
      query: 'I have asthma. What are warning signs I should watch for?',
      expected: 'Should provide asthma-specific information'
    },
    {
      condition: 'arthritis',
      query: 'I have arthritis. How can I manage joint pain?',
      expected: 'Should provide arthritis-specific information'
    },
    {
      condition: 'general',
      query: 'What are some general wellness tips?',
      expected: 'Should provide general health information'
    }
  ];

  for (const scenario of testScenarios) {
    try {
      console.log(`📋 Testing: ${scenario.condition.toUpperCase()}`);
      console.log(`Query: "${scenario.query}"`);
      
      const response = await fetch(`${baseUrl}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: scenario.query })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Response received');
      console.log(`📝 Answer: ${result.answer.substring(0, 100)}...`);
      console.log(`📚 Sources: ${result.sources?.length || 0} documents`);
      console.log(`🔧 Mock mode: ${result.metadata?.mockMode ? 'Yes' : 'No'}`);
      
      if (result.sources && result.sources.length > 0) {
        console.log('📖 Top source:', result.sources[0].title);
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.error(`❌ Error testing ${scenario.condition}:`, error.message);
      console.log('---\n');
    }
  }
  
  console.log('🎉 Chat Integration Test Complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Open your browser to http://localhost:3001');
  console.log('2. Navigate to the chat page');
  console.log('3. Try asking health-related questions');
  console.log('4. Verify that responses include source information');
  console.log('5. Check that mock mode indicator appears');
}

// Run the test
if (require.main === module) {
  testChatIntegration().catch(console.error);
}

module.exports = { testChatIntegration }; 