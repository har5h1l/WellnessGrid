// Test chat context functionality
// This tests if the AI remembers previous conversation context

const testChatContext = async () => {
  console.log('🧪 Testing Chat Context Functionality...');
  
  let sessionId = null;
  
  // First message
  const firstMessage = "I have a headache after running a marathon I didn't train for what happened";
  console.log('\n📝 First message:', firstMessage);
  
  try {
    const response1 = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: firstMessage,
        userContext: { healthConditions: [] }
      }),
    });
    
    const data1 = await response1.json();
    sessionId = data1.sessionId;
    
    console.log('✅ First response received');
    console.log('🆔 Session ID:', sessionId);
    console.log('📚 Chat history used:', data1.metadata.chatHistoryUsed);
    console.log('💬 Messages in history:', data1.metadata.messagesInHistory);
    console.log('🔸 Response preview:', data1.answer.substring(0, 100) + '...');
    
    // Wait a moment to ensure the message is saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second message - should reference the first
    const secondMessage = "what if I fell after the headache";
    console.log('\n📝 Second message:', secondMessage);
    
    const response2 = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: secondMessage,
        userContext: { healthConditions: [] },
        sessionId: sessionId // Include session ID for context
      }),
    });
    
    const data2 = await response2.json();
    
    console.log('✅ Second response received');
    console.log('🆔 Session ID:', data2.sessionId);
    console.log('📚 Chat history used:', data2.metadata.chatHistoryUsed);
    console.log('💬 Messages in history:', data2.metadata.messagesInHistory);
    console.log('🔸 Response preview:', data2.answer.substring(0, 200) + '...');
    
    // Check if context is working
    const hasContext = data2.metadata.chatHistoryUsed && data2.metadata.messagesInHistory > 0;
    const mentionsMarathon = data2.answer.toLowerCase().includes('marathon') || 
                           data2.answer.toLowerCase().includes('running') ||
                           data2.answer.toLowerCase().includes('previous');
    
    console.log('\n🧪 Context Analysis:');
    console.log('📊 Chat history used:', hasContext);
    console.log('🏃 References previous context:', mentionsMarathon);
    console.log('🎯 Context working:', hasContext && mentionsMarathon ? '✅ YES' : '❌ NO');
    
    if (hasContext && mentionsMarathon) {
      console.log('\n🎉 SUCCESS: Chat context is working properly!');
    } else {
      console.log('\n❌ FAILURE: Chat context is not working');
      console.log('Full second response:', data2.answer);
    }
    
  } catch (error) {
    console.error('❌ Error testing chat context:', error);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testChatContext();
}

module.exports = { testChatContext }; 