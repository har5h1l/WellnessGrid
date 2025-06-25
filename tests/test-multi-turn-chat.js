// Test script for Multi-turn Chat functionality
// Tests session management, chat history, and conversation continuity

const API_BASE_URL = 'http://localhost:3000/api';

async function testMultiTurnConversation() {
  console.log('🗣️ Testing Multi-turn Conversation\n');
  console.log('=' .repeat(60));
  
  let sessionId = null;
  
  // Conversation flow
  const conversationFlow = [
    {
      query: "I've been having headaches lately",
      expectHistory: false,
      description: "Initial query - no history expected"
    },
    {
      query: "What could be causing them?",
      expectHistory: true,
      description: "Follow-up query - should reference previous headache discussion"
    },
    {
      query: "Are there any home remedies I can try?",
      expectHistory: true,
      description: "Third query - should maintain context about headaches"
    },
    {
      query: "I also have trouble sleeping. Is this related?",
      expectHistory: true,
      description: "Related but new topic - should consider headache context"
    }
  ];
  
  for (let i = 0; i < conversationFlow.length; i++) {
    const step = conversationFlow[i];
    console.log(`\n🔄 Step ${i + 1}: ${step.description}`);
    console.log(`📝 Query: "${step.query}"`);
    
    try {
      const payload = {
        query: step.query
      };
      
      // Include sessionId from second query onwards
      if (sessionId) {
        payload.sessionId = sessionId;
      }
      
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      // Store sessionId from first response
      if (!sessionId) {
        sessionId = data.sessionId;
        console.log(`🆔 Session ID: ${sessionId}`);
      }
      
      console.log('\n📊 Response Metadata:');
      console.log(`- Chat History Used: ${data.metadata?.chatHistoryUsed ? '✅' : '❌'}`);
      console.log(`- Messages in History: ${data.metadata?.messagesInHistory || 0}`);
      console.log(`- Query Enhanced: ${data.metadata?.llmEnhancement?.queryEnhanced ? '✅' : '❌'}`);
      console.log(`- Response Improved: ${data.metadata?.llmEnhancement?.responseImproved ? '✅' : '❌'}`);
      
      if (data.enhancedQuery && data.enhancedQuery !== data.query) {
        console.log('\n🧠 Enhanced Query:');
        console.log(`"${data.enhancedQuery}"`);
      }
      
      console.log('\n💬 AI Response:');
      console.log(`"${data.answer}"`);
      
      // Validate expectations
      if (step.expectHistory && !data.metadata?.chatHistoryUsed) {
        console.log('⚠️  WARNING: Expected chat history to be used but it wasn\'t');
      } else if (!step.expectHistory && data.metadata?.chatHistoryUsed) {
        console.log('⚠️  WARNING: Didn\'t expect chat history but it was used');
      }
      
      console.log('\n' + '-'.repeat(60));
      
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error in step ${i + 1}:`, error.message);
      break;
    }
  }
  
  return sessionId;
}

async function testSessionContinuity(sessionId) {
  console.log('\n🔄 Testing Session Continuity\n');
  console.log('=' .repeat(60));
  
  console.log(`🆔 Using existing session: ${sessionId}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "Can you summarize what we've discussed so far?",
        sessionId: sessionId
      }),
    });
    
    const data = await response.json();
    
    console.log('\n📊 Session Continuity Results:');
    console.log(`- Same Session ID: ${data.sessionId === sessionId ? '✅' : '❌'}`);
    console.log(`- Chat History Used: ${data.metadata?.chatHistoryUsed ? '✅' : '❌'}`);
    console.log(`- Messages in History: ${data.metadata?.messagesInHistory || 0}`);
    
    console.log('\n💬 Summary Response:');
    console.log(`"${data.answer}"`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Error testing session continuity:', error.message);
    return null;
  }
}

async function testNewSession() {
  console.log('\n🆕 Testing New Session (No Session ID)\n');
  console.log('=' .repeat(60));
  
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "What are the symptoms of diabetes?"
      }),
    });
    
    const data = await response.json();
    
    console.log('\n📊 New Session Results:');
    console.log(`- New Session ID Generated: ${data.sessionId ? '✅' : '❌'}`);
    console.log(`- Session ID: ${data.sessionId}`);
    console.log(`- Chat History Used: ${data.metadata?.chatHistoryUsed ? '✅' : '❌'}`);
    console.log(`- Messages in History: ${data.metadata?.messagesInHistory || 0}`);
    
    console.log('\n💬 Response:');
    console.log(`"${data.answer}"`);
    
    return data.sessionId;
    
  } catch (error) {
    console.error('❌ Error testing new session:', error.message);
    return null;
  }
}

async function testApiStatus() {
  console.log('🔍 Checking API Status\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/ask`);
    const data = await response.json();
    
    console.log('✅ API Status:');
    console.log(`- Multi-turn Chat: ${data.features?.multiTurnChat ? '✅' : '❌'}`);
    console.log(`- Chat History: ${data.features?.chatHistory ? '✅' : '❌'}`);
    console.log(`- Session Management: ${data.features?.sessionManagement ? '✅' : '❌'}`);
    console.log(`- Supabase Connected: ${data.supabaseConnected ? '✅' : '❌'}`);
    console.log(`- LLM Services Available: ${data.llmServices?.hasAnyService ? '✅' : '❌'}`);
    
    return data.features?.multiTurnChat && data.features?.chatHistory;
  } catch (error) {
    console.error('❌ API Status Check Failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 WellnessGrid Multi-turn Chat Tests\n');
  console.log('🏥 Testing enhanced RAG system with conversation memory\n');
  
  // Test 1: Check API status
  const apiReady = await testApiStatus();
  if (!apiReady) {
    console.log('\n❌ API is not ready for multi-turn chat testing');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Test 2: Multi-turn conversation
  const sessionId = await testMultiTurnConversation();
  
  if (sessionId) {
    // Test 3: Session continuity
    await testSessionContinuity(sessionId);
    
    console.log('\n' + '='.repeat(60));
    
    // Test 4: New session
    await testNewSession();
  }
  
  console.log('\n✅ All multi-turn chat tests completed!');
  console.log('\n📋 What to observe:');
  console.log('1. Session IDs are generated and maintained');
  console.log('2. Chat history is retrieved and used in subsequent queries');
  console.log('3. Enhanced queries reference previous conversation');
  console.log('4. Improved responses maintain conversation continuity');
  console.log('5. New sessions start fresh without history');
  console.log('\n🔧 Setup Requirements:');
  console.log('1. Supabase messages table created');
  console.log('2. Next.js app running on localhost:3000');
  console.log('3. Flask backend running (optional for full functionality)');
  console.log('4. Gemini/OpenRouter API keys configured');
}

// Handle fetch not being available in older Node.js
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you can install node-fetch');
  console.log('Alternative: Run tests in browser console');
  process.exit(1);
}

// Run the tests
runAllTests().catch(console.error); 