// Test multi-chat system functionality
// This tests if the chat management system works correctly

const testMultiChatSystem = async () => {
  console.log('🧪 Testing Multi-Chat System...');
  
  let session1Id = null;
  let session2Id = null;
  
  try {
    // Test 1: Create first chat session
    console.log('\n📝 Test 1: Creating first chat session...');
    const response1 = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "I have a headache after running a marathon",
        userContext: { healthConditions: [] }
      }),
    });
    
    const data1 = await response1.json();
    session1Id = data1.sessionId;
    
    console.log('✅ First session created');
    console.log('🆔 Session 1 ID:', session1Id);
    console.log('🔸 Response preview:', data1.answer.substring(0, 100) + '...');
    
    // Wait for message to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Create second chat session with different query
    console.log('\n📝 Test 2: Creating second chat session...');
    const response2 = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "What foods help with diabetes management?",
        userContext: { healthConditions: ['diabetes'] }
      }),
    });
    
    const data2 = await response2.json();
    session2Id = data2.sessionId;
    
    console.log('✅ Second session created');
    console.log('🆔 Session 2 ID:', session2Id);
    console.log('🔸 Response preview:', data2.answer.substring(0, 100) + '...');
    
    // Wait for message to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Continue conversation in first session
    console.log('\n📝 Test 3: Continuing conversation in first session...');
    const response3 = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "what if I fell after the headache?",
        userContext: { healthConditions: [] },
        sessionId: session1Id
      }),
    });
    
    const data3 = await response3.json();
    
    console.log('✅ Continued conversation in session 1');
    console.log('🆔 Session ID match:', data3.sessionId === session1Id ? '✅' : '❌');
    console.log('📚 Chat history used:', data3.metadata.chatHistoryUsed);
    console.log('💬 Messages in history:', data3.metadata.messagesInHistory);
    console.log('🔸 Response preview:', data3.answer.substring(0, 150) + '...');
    
    // Test 4: Continue conversation in second session
    console.log('\n📝 Test 4: Continuing conversation in second session...');
    const response4 = await fetch('http://localhost:3000/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "Should I avoid carbs completely?",
        userContext: { healthConditions: ['diabetes'] },
        sessionId: session2Id
      }),
    });
    
    const data4 = await response4.json();
    
    console.log('✅ Continued conversation in session 2');
    console.log('🆔 Session ID match:', data4.sessionId === session2Id ? '✅' : '❌');
    console.log('📚 Chat history used:', data4.metadata.chatHistoryUsed);
    console.log('💬 Messages in history:', data4.metadata.messagesInHistory);
    console.log('🔸 Response preview:', data4.answer.substring(0, 150) + '...');
    
    // Test 5: Verify context isolation
    console.log('\n🧪 Test 5: Context Isolation Analysis');
    const session1References = data3.answer.toLowerCase().includes('marathon') || 
                             data3.answer.toLowerCase().includes('running') ||
                             data3.answer.toLowerCase().includes('fell');
    
    const session2References = data4.answer.toLowerCase().includes('diabetes') || 
                             data4.answer.toLowerCase().includes('carbs') ||
                             data4.answer.toLowerCase().includes('food');
    
    const session1NoSession2Context = !data3.answer.toLowerCase().includes('diabetes') &&
                                    !data3.answer.toLowerCase().includes('carbs');
    
    const session2NoSession1Context = !data4.answer.toLowerCase().includes('marathon') &&
                                    !data4.answer.toLowerCase().includes('running');
    
    console.log('📊 Session 1 maintains its context:', session1References ? '✅' : '❌');
    console.log('📊 Session 2 maintains its context:', session2References ? '✅' : '❌');
    console.log('🔒 Session 1 isolated from session 2:', session1NoSession2Context ? '✅' : '❌');
    console.log('🔒 Session 2 isolated from session 1:', session2NoSession1Context ? '✅' : '❌');
    
    // Summary
    const allTestsPassed = 
      session1Id && session2Id &&
      data3.sessionId === session1Id &&
      data4.sessionId === session2Id &&
      data3.metadata.chatHistoryUsed &&
      data4.metadata.chatHistoryUsed &&
      session1References &&
      session2References &&
      session1NoSession2Context &&
      session2NoSession1Context;
    
    console.log('\n🎯 Multi-Chat System Test Results:');
    console.log('✨ Multiple sessions created:', session1Id && session2Id ? '✅' : '❌');
    console.log('🔄 Session continuity maintained:', data3.sessionId === session1Id && data4.sessionId === session2Id ? '✅' : '❌');
    console.log('💬 Chat history working:', data3.metadata.chatHistoryUsed && data4.metadata.chatHistoryUsed ? '✅' : '❌');
    console.log('🔒 Context isolation working:', session1NoSession2Context && session2NoSession1Context ? '✅' : '❌');
    console.log('🏆 Overall system status:', allTestsPassed ? '🎉 SUCCESS' : '❌ NEEDS WORK');
    
    if (allTestsPassed) {
      console.log('\n🎉 SUCCESS: Multi-chat system is working perfectly!');
      console.log('   - Users can have multiple separate conversations');
      console.log('   - Each conversation maintains its own context');
      console.log('   - Session switching works correctly');
      console.log('   - Context isolation prevents cross-contamination');
    } else {
      console.log('\n❌ ISSUES DETECTED: Multi-chat system needs fixes');
    }
    
  } catch (error) {
    console.error('❌ Error testing multi-chat system:', error);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testMultiChatSystem();
}

module.exports = { testMultiChatSystem }; 