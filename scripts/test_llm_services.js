#!/usr/bin/env node

/**
 * Test script to debug LLM service fallback mechanism
 * This will help identify why insights aren't being generated properly
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// We'll test by making direct API calls since we can't easily import TS from JS
// But first let's check the environment and client initialization logic

async function testLLMServices() {
  console.log('🧪 Testing LLM Services Debug...')
  console.log('='.repeat(50))
  
  // Check environment variables
  console.log('\n📋 Environment Check:')
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set (' + process.env.GEMINI_API_KEY.substring(0, 10) + '...)' : '❌ Missing'}`)
  console.log(`OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✅ Set (' + process.env.OPENROUTER_API_KEY.substring(0, 10) + '...)' : '❌ Missing'}`)
  
  // Test Gemini API directly
  console.log('\n🤖 Testing Gemini API directly:')
  await testGeminiAPI()
  
  // Test OpenRouter API directly  
  console.log('\n🔀 Testing OpenRouter API directly:')
  await testOpenRouterAPI()
  
  // Test health insights generation through the app
  console.log('\n🏥 Testing App Health Insights Generation:')
  await testAppInsightsGeneration()
  
  console.log('\n🎯 Test Complete!')
  console.log('='.repeat(50))
}

async function testGeminiAPI() {
  if (!process.env.GEMINI_API_KEY) {
    console.log('❌ Gemini API key not found')
    return
  }
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-pro" })
    
    console.log('🔄 Testing Gemini with simple JSON prompt...')
    const prompt = 'Return only valid JSON: {"test": "gemini_success", "status": "working"}'
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Gemini response received')
    console.log('Response length:', text.length)
    console.log('Response preview:', text.substring(0, 200) + '...')
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text.trim())
      console.log('✅ Gemini returned valid JSON:', parsed)
    } catch (parseError) {
      console.log('❌ Gemini response is not valid JSON')
    }
    
  } catch (error) {
    console.log('❌ Gemini API failed:', error.message)
    
    // Check for specific error types
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      console.log('🚨 Rate limit or quota issue detected')
    }
    if (error.status === 429) {
      console.log('🚨 HTTP 429 - Rate limited')
    }
  }
}

async function testOpenRouterAPI() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('❌ OpenRouter API key not found')
    return
  }
  
  try {
    const OpenAI = require('openai')
    const openrouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    })
    
    console.log('🔄 Testing OpenRouter with simple JSON prompt...')
    const prompt = 'Return only valid JSON: {"test": "openrouter_success", "status": "working"}'
    
    const completion = await openrouterClient.chat.completions.create({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    })

    const content = completion.choices[0]?.message?.content || ''
    
    console.log('✅ OpenRouter response received')
    console.log('Response length:', content.length)
    console.log('Response preview:', content.substring(0, 200) + '...')
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content.trim())
      console.log('✅ OpenRouter returned valid JSON:', parsed)
    } catch (parseError) {
      console.log('❌ OpenRouter response is not valid JSON')
    }
    
  } catch (error) {
    console.log('❌ OpenRouter API failed:', error.message)
  }
}

async function testAppInsightsGeneration() {
  try {
    console.log('🔄 Testing insights generation through app API...')
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const testPrompt = `
You are a medical AI assistant analyzing health tracking data to provide personalized insights.

PATIENT CONTEXT:
- Health Conditions: None reported
- Data Period: Last 7 days
- Total Data Points: 64

TRACKING DATA SUMMARY:
- Glucose readings: 24 entries, average 110 mg/dL
- Blood pressure: 16 entries, average 118/83 mmHg  
- Sleep: 8 entries, average 7.4 hours
- Mood: 16 entries, mostly good ratings

Return only valid JSON in this format:
{
  "summary": "Brief health status summary",
  "trends": [{"metric": "glucose", "direction": "stable", "confidence": 0.8}],
  "recommendations": ["Specific actionable recommendation"]
}
`
    
    const response = await fetch(`${baseUrl}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: testPrompt,
        sessionId: `llm_test_${Date.now()}`,
        userContext: { userId: 'test', context: 'health_insights_test' }
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    console.log('✅ App API response received')
    console.log('Response keys:', Object.keys(result))
    
    if (result.answer) {
      console.log('Answer length:', result.answer.length)
      console.log('Answer preview:', result.answer.substring(0, 200) + '...')
      
      // Try to parse answer as JSON
      try {
        const parsed = JSON.parse(result.answer)
        console.log('✅ App returned valid JSON insights:', parsed)
      } catch (parseError) {
        console.log('❌ App response is not valid JSON')
      }
    }
    
  } catch (error) {
    console.log('❌ App insights test failed:', error.message)
  }
}

// Run the test
testLLMServices().catch(console.error)
