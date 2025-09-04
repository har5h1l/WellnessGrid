#!/usr/bin/env node

/**
 * Test script to verify OpenRouter API fix with proper headers
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function testOpenRouterFix() {
  console.log('🔧 Testing OpenRouter API Fix...')
  console.log('='.repeat(50))
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('❌ OpenRouter API key not found')
    return
  }
  
  console.log(`🔑 API Key: ${process.env.OPENROUTER_API_KEY.substring(0, 15)}...`)
  console.log(`🌐 App URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}`)
  
  try {
    const OpenAI = require('openai')
    
    // Create client with headers like the updated service
    const openrouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
        "X-Title": "WellnessGrid Health Insights"
      }
    })
    
    console.log('\n🔄 Testing OpenRouter with headers...')
    
    // Try the current available free models (updated Aug 2025)
    const models = [
      "deepseek/deepseek-chat-v3.1:free",
      "openai/gpt-oss-120b:free",
      "openai/gpt-oss-20b:free",
      "z-ai/glm-4.5-air:free"
    ]
    
    for (const model of models) {
      try {
        console.log(`\n🤖 Trying model: ${model}`)
        
        const completion = await openrouterClient.chat.completions.create({
          model: model,
          messages: [{ 
            role: "user", 
            content: 'Return only valid JSON: {"test": "openrouter_fixed", "model": "' + model + '"}' 
          }],
          max_tokens: 150,
          temperature: 0.7
        })

        const content = completion.choices[0]?.message?.content || ''
        
        console.log('✅ OpenRouter response received!')
        console.log('Response length:', content.length)
        console.log('Response:', content.substring(0, 200))
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(content.trim())
          console.log('✅ Valid JSON returned:', parsed)
          console.log('🎉 OpenRouter is working with model:', model)
          return true
        } catch (parseError) {
          console.log('⚠️ Response received but not valid JSON')
          console.log('Raw response:', content)
        }
        
        // Break on first successful model
        break
        
      } catch (modelError) {
        console.log(`❌ Model ${model} failed:`, modelError.message)
        
        // Check for specific error types
        if (modelError.message?.includes('401')) {
          console.log('🚨 Still getting 401 - authentication issue persists')
        }
        if (modelError.message?.includes('quota') || modelError.message?.includes('limit')) {
          console.log('🚨 Rate limit or quota issue')
        }
        if (modelError.message?.includes('model not found')) {
          console.log('🚨 Model not available, trying next...')
          continue
        }
        
        // If it's not a model-specific error, don't try other models
        if (!modelError.message?.includes('model')) {
          throw modelError
        }
      }
    }
    
  } catch (error) {
    console.log('❌ OpenRouter test failed completely:', error.message)
    console.log('Error details:', error)
    return false
  }
}

// Run the test
testOpenRouterFix()
  .then(success => {
    if (success) {
      console.log('\n🎯 OpenRouter fix successful! Now testing full insight generation...')
      // Test insight generation if OpenRouter works
      return require('./force_regenerate_insights.js')
    } else {
      console.log('\n❌ OpenRouter still not working. Need to investigate further.')
    }
  })
  .catch(console.error)
