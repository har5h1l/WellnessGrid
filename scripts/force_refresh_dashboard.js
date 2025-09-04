#!/usr/bin/env node

// Force refresh all dashboard data and insights to fix sync issues
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

async function forceRefreshDashboard() {
  try {
    console.log('🔄 Force refreshing all dashboard data and insights...')
    
    // Get test user ID
    const testUserId = process.env.TEST_USER_ID || '69478d34-90bd-476f-b47a-7d099c1cb913'
    console.log(`👤 Refreshing data for user: ${testUserId}`)
    
    // Step 1: Clear ALL cached data
    console.log('\n1. Clearing all cached data...')
    
    const clearOperations = [
      // Clear health insights
      supabaseAdmin
        .from('health_insights')
        .delete()
        .eq('user_id', testUserId),
      
      // Clear wellness scores
      supabaseAdmin
        .from('health_scores')
        .delete()
        .eq('user_id', testUserId),
      
      // Clear analytics cache (if exists)
      supabaseAdmin
        .from('analytics_cache')
        .delete()
        .eq('user_id', testUserId)
        .then(result => ({ ...result, table: 'analytics_cache' }))
        .catch(error => ({ error: `analytics_cache table might not exist: ${error.message}` }))
    ]
    
    const results = await Promise.allSettled(clearOperations)
    results.forEach((result, index) => {
      const tables = ['health_insights', 'health_scores', 'analytics_cache']
      if (result.status === 'fulfilled') {
        console.log(`✅ Cleared ${tables[index]}`)
      } else {
        console.log(`⚠️ ${tables[index]}: ${result.reason}`)
      }
    })
    
    // Step 2: Wait for cache clearing
    console.log('\n2. Waiting for cache clearing...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Step 3: Force regenerate wellness score
    console.log('\n3. Force regenerating wellness score...')
    try {
      const response = await fetch(`http://localhost:3001/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          action: 'refresh_wellness_score',
          forceRefresh: true
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ New wellness score: ${result.wellness_score?.overall_score || 'N/A'}`)
      } else {
        console.log(`❌ Wellness score refresh failed: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Wellness score refresh error: ${error.message}`)
    }
    
    // Step 4: Force regenerate insights
    console.log('\n4. Force regenerating insights with enhanced prompts...')
    try {
      const response = await fetch(`http://localhost:3001/api/insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          insightType: 'on_demand',
          forceGenerate: true,
          enhanced: true // Enhanced prompt flag
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ New insights generated successfully`)
        console.log(`📊 Insight summary: ${result.insight?.insights?.summary?.substring(0, 100) || 'N/A'}...`)
      } else {
        console.log(`❌ Insights generation failed: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Insights generation error: ${error.message}`)
    }
    
    // Step 5: Verify data consistency
    console.log('\n5. Verifying data consistency...')
    
    // Check latest wellness score
    const { data: latestScore } = await supabaseAdmin
      .from('health_scores')
      .select('overall_score, trend, calculated_at')
      .eq('user_id', testUserId)
      .order('calculated_at', { ascending: false })
      .limit(1)
    
    // Check latest insights
    const { data: latestInsight } = await supabaseAdmin
      .from('health_insights')
      .select('generated_at, insights')
      .eq('user_id', testUserId)
      .order('generated_at', { ascending: false })
      .limit(1)
    
    console.log('\n📊 VERIFICATION RESULTS:')
    console.log('='.repeat(50))
    
    if (latestScore && latestScore.length > 0) {
      const score = latestScore[0]
      console.log(`✅ Latest Wellness Score: ${score.overall_score}/100 (${score.trend})`)
      console.log(`   Generated: ${new Date(score.calculated_at).toLocaleString()}`)
    } else {
      console.log('❌ No wellness score found after refresh')
    }
    
    if (latestInsight && latestInsight.length > 0) {
      const insight = latestInsight[0]
      const summary = insight.insights?.summary || 'No summary available'
      console.log(`✅ Latest Insight: ${summary.substring(0, 100)}...`)
      console.log(`   Generated: ${new Date(insight.generated_at).toLocaleString()}`)
      
      // Check if insights are still generic
      const isGeneric = summary.toLowerCase().includes('insufficient data') || 
                       summary.toLowerCase().includes('continue tracking')
      
      if (isGeneric) {
        console.log('⚠️ WARNING: Insights are still generic despite data availability')
      } else {
        console.log('✅ Insights appear to be personalized')
      }
    } else {
      console.log('❌ No insights found after refresh')
    }
    
    console.log('\n🎯 NEXT STEPS:')
    console.log('1. Refresh your browser/app to see updated data')
    console.log('2. Check dashboard and insights pages for consistency')
    console.log('3. If still seeing generic insights, check LLM service logs')
    
  } catch (error) {
    console.error('❌ Force refresh failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  forceRefreshDashboard()
    .then(() => {
      console.log('\n✅ Force refresh completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Force refresh failed:', error)
      process.exit(1)
    })
}

module.exports = { forceRefreshDashboard }




