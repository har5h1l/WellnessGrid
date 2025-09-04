#!/usr/bin/env node

/**
 * Test script to manually trigger insight generation with improved logic
 * This will help verify the fixes for the "insufficient data" issue
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testInsightGeneration() {
  try {
    console.log('🧠 Testing insight generation with improved logic...')
    
    // Get test user ID
    const testUserId = process.env.TEST_USER_ID || '69478d34-90bd-476f-b47a-7d099c1cb913'
    console.log(`👤 Testing for user: ${testUserId}`)
    
    // Step 1: Clear old insights to force fresh generation
    console.log('\n1. Clearing old insights...')
    const { error: deleteError } = await supabaseAdmin
      .from('health_insights')
      .delete()
      .eq('user_id', testUserId)
    
    if (deleteError) {
      console.log('❌ Error clearing insights (non-critical):', deleteError.message)
    } else {
      console.log('✅ Old insights cleared')
    }
    
    // Step 2: Make API call to generate new insights
    console.log('\n2. Generating new insights via API...')
    
    const generateResponse = await fetch('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        action: 'generate_insights',
        insight_type: 'on_demand'
      })
    })
    
    if (!generateResponse.ok) {
      throw new Error(`API call failed: ${generateResponse.status} ${generateResponse.statusText}`)
    }
    
    const generateResult = await generateResponse.json()
    console.log('📊 Generate insights result:', {
      success: generateResult.success,
      hasInsight: !!generateResult.insight,
      message: generateResult.message || generateResult.error
    })
    
    if (generateResult.success && generateResult.insight) {
      const insight = generateResult.insight
      console.log('✅ New insight generated:')
      console.log(`  - Type: ${insight.insight_type}`)
      console.log(`  - Data points: ${insight.metadata?.data_points_analyzed || 0}`)
      console.log(`  - Confidence: ${insight.metadata?.confidence_score || 0}`)
      console.log(`  - Summary: ${insight.insights?.summary?.substring(0, 100)}...`)
      console.log(`  - Recommendations: ${insight.insights?.recommendations?.length || 0}`)
      console.log(`  - Trends: ${insight.insights?.trends?.length || 0}`)
      console.log(`  - Achievements: ${insight.insights?.achievements?.length || 0}`)
      
      // Check if it's still showing "insufficient data"
      const isInsufficientData = insight.insights?.summary?.includes('Insufficient data') || 
                                insight.insights?.summary?.includes('insufficient')
      
      if (isInsufficientData) {
        console.log('⚠️ Still showing insufficient data message')
        if (insight.metadata?.missing_elements) {
          console.log('📊 Missing elements:', insight.metadata.missing_elements)
        }
      } else {
        console.log('🎉 SUCCESS: Generated personalized insights!')
      }
    } else {
      console.log('❌ Failed to generate insights:', generateResult.error)
    }
    
    // Step 3: Test analytics endpoint to see consistent insights
    console.log('\n3. Testing analytics endpoint...')
    
    const analyticsResponse = await fetch(`http://localhost:3000/api/analytics?userId=${testUserId}&includeInsights=true&forceRefresh=true`)
    
    if (!analyticsResponse.ok) {
      throw new Error(`Analytics API call failed: ${analyticsResponse.status}`)
    }
    
    const analyticsResult = await analyticsResponse.json()
    console.log('📊 Analytics result:', {
      success: analyticsResult.success,
      dataPoints: analyticsResult.data?.data_points || 0,
      insightsCount: analyticsResult.data?.insights?.length || 0,
      healthScore: analyticsResult.data?.health_score?.overall_score
    })
    
    if (analyticsResult.success && analyticsResult.data?.insights?.length > 0) {
      const latestInsight = analyticsResult.data.insights[0]
      console.log('✅ Latest insight from analytics:')
      console.log(`  - Generated: ${latestInsight.generated_at}`)
      console.log(`  - Summary: ${latestInsight.insights?.summary?.substring(0, 100)}...`)
      
      const isStillInsufficient = latestInsight.insights?.summary?.includes('Insufficient') ||
                                 latestInsight.insights?.summary?.includes('insufficient')
      
      if (isStillInsufficient) {
        console.log('⚠️ Analytics still showing insufficient data')
      } else {
        console.log('🎉 Analytics showing proper insights!')
      }
    }
    
    // Step 4: Final summary
    console.log('\n📋 TEST SUMMARY:')
    console.log('=' + '='.repeat(50))
    
    if (generateResult.success && !generateResult.insight?.insights?.summary?.includes('Insufficient')) {
      console.log('✅ PASS: Insight generation working correctly')
    } else {
      console.log('❌ FAIL: Still generating insufficient data insights')
      console.log('💡 Next steps: Run debug script to check data availability')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the development server is running: npm run dev')
    }
    
    process.exit(1)
  }
}

// Allow for user ID override
const args = process.argv.slice(2)
const userIdArg = args.find(arg => arg.startsWith('--user='))
if (userIdArg) {
  process.env.TEST_USER_ID = userIdArg.split('=')[1]
}

console.log('🚀 Starting insight generation test...')
console.log('💡 Make sure your development server is running (npm run dev)')

testInsightGeneration()
