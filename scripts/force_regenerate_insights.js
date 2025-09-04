#!/usr/bin/env node

/**
 * Force regenerate insights script
 * This will clear existing insights and force generate new ones to test the fixes
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

async function forceRegenerateInsights() {
  try {
    console.log('🔄 Force regenerating insights to test fixes...')
    
    // Get test user ID
    const testUserId = process.env.TEST_USER_ID || '69478d34-90bd-476f-b47a-7d099c1cb913'
    console.log(`👤 Regenerating insights for user: ${testUserId}`)
    
    // Step 1: Clear existing insights
    console.log('\n1. Clearing existing insights...')
    const { error: deleteError, count } = await supabaseAdmin
      .from('health_insights')
      .delete()
      .eq('user_id', testUserId)
    
    if (deleteError) {
      console.log('❌ Error clearing insights (continuing anyway):', deleteError.message)
    } else {
      console.log(`✅ Cleared existing insights`)
    }
    
    // Step 2: Clear wellness score cache to force recalculation
    console.log('\n2. Clearing wellness score cache...')
    const { error: cacheDeleteError } = await supabaseAdmin
      .from('health_scores')
      .delete()
      .eq('user_id', testUserId)
    
    if (cacheDeleteError) {
      console.log('❌ Error clearing score cache (continuing anyway):', cacheDeleteError.message)
    } else {
      console.log('✅ Cleared wellness score cache')
    }
    
    // Step 3: Wait a moment for caches to clear
    console.log('\n3. Waiting for caches to clear...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 4: Check available data before generation
    console.log('\n4. Checking available data...')
    
    const { data: trackingEntries } = await supabaseAdmin
      .from('tracking_entries')
      .select('tool_id, timestamp')
      .eq('user_id', testUserId)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
    
    console.log(`📊 Found ${trackingEntries?.length || 0} tracking entries in last 7 days`)
    
    if (trackingEntries && trackingEntries.length > 0) {
      console.log('📈 Recent tracking activity:')
      const toolCounts = {}
      trackingEntries.forEach(entry => {
        toolCounts[entry.tool_id] = (toolCounts[entry.tool_id] || 0) + 1
      })
      Object.entries(toolCounts).forEach(([tool, count]) => {
        console.log(`  - ${tool}: ${count} entries`)
      })
    }
    
    // Step 5: Force generate new insights via API
    console.log('\n5. Generating new insights...')
    
    try {
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
        throw new Error(`Generate API failed: ${generateResponse.status} ${generateResponse.statusText}`)
      }
      
      const generateResult = await generateResponse.json()
      
      if (generateResult.success && generateResult.insight) {
        const insight = generateResult.insight
        console.log('✅ New insight generated successfully!')
        console.log(`📊 Insight details:`)
        console.log(`  - Type: ${insight.insight_type}`)
        console.log(`  - Generated: ${insight.generated_at}`)
        console.log(`  - Data points analyzed: ${insight.metadata?.data_points_analyzed || 0}`)
        console.log(`  - Confidence: ${insight.metadata?.confidence_score || 0}`)
        console.log(`  - Analysis type: ${insight.metadata?.analysis_type || 'standard'}`)
        
        console.log(`\n📝 Insight content:`)
        console.log(`  - Summary: ${insight.insights?.summary}`)
        console.log(`  - Recommendations: ${insight.insights?.recommendations?.length || 0}`)
        console.log(`  - Trends: ${insight.insights?.trends?.length || 0}`)
        console.log(`  - Achievements: ${insight.insights?.achievements?.length || 0}`)
        console.log(`  - Concerns: ${insight.insights?.concerns?.length || 0}`)
        
        // Check if it's still "insufficient data"
        const isGeneric = insight.insights?.summary?.toLowerCase().includes('insufficient') ||
                         insight.insights?.summary?.toLowerCase().includes('need more data')
        
        if (isGeneric) {
          console.log('\n⚠️ ISSUE: Still generating generic insights')
          if (insight.metadata?.missing_elements) {
            console.log(`🔍 Missing elements: ${insight.metadata.missing_elements.join(', ')}`)
          }
          console.log('💡 Try running the debug script: node scripts/debug_insight_generation.js')
        } else {
          console.log('\n🎉 SUCCESS: Generated personalized insights!')
        }
        
      } else {
        console.log('❌ Failed to generate insight:', generateResult.error || 'Unknown error')
      }
      
    } catch (fetchError) {
      console.error('❌ Error calling generate API:', fetchError.message)
      
      if (fetchError.message.includes('ECONNREFUSED')) {
        console.log('💡 Make sure the development server is running: npm run dev')
      }
    }
    
    // Step 6: Test dashboard data consistency
    console.log('\n6. Testing dashboard data consistency...')
    
    try {
      const dashboardResponse = await fetch(`http://localhost:3000/api/analytics?userId=${testUserId}&includeInsights=true&forceRefresh=true`)
      
      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json()
        
        if (dashboardResult.success) {
          console.log('✅ Dashboard analytics working')
          console.log(`📊 Analytics data:`)
          console.log(`  - Data points: ${dashboardResult.data?.data_points || 0}`)
          console.log(`  - Health score: ${dashboardResult.data?.health_score?.overall_score || 'N/A'}`)
          console.log(`  - Insights: ${dashboardResult.data?.insights?.length || 0}`)
          console.log(`  - Trends: ${dashboardResult.data?.trends?.length || 0}`)
          
          if (dashboardResult.data?.insights?.length > 0) {
            const latestInsight = dashboardResult.data.insights[0]
            const isStillGeneric = latestInsight.insights?.summary?.toLowerCase().includes('insufficient')
            
            if (isStillGeneric) {
              console.log('⚠️ Dashboard still showing generic insights')
            } else {
              console.log('🎉 Dashboard showing personalized insights!')
            }
          }
        }
      }
    } catch (dashboardError) {
      console.log('⚠️ Dashboard test failed:', dashboardError.message)
    }
    
    console.log('\n📋 REGENERATION COMPLETE')
    console.log('=' + '='.repeat(50))
    console.log('💡 Check your dashboard and analytics page to see the updated insights')
    console.log('💡 If still seeing generic insights, run: node scripts/debug_insight_generation.js')
    
  } catch (error) {
    console.error('❌ Force regeneration failed:', error.message)
    process.exit(1)
  }
}

// Allow for user ID override
const args = process.argv.slice(2)
const userIdArg = args.find(arg => arg.startsWith('--user='))
if (userIdArg) {
  process.env.TEST_USER_ID = userIdArg.split('=')[1]
}

console.log('🚀 Starting force insight regeneration...')
console.log('💡 Make sure your development server is running (npm run dev)')

forceRegenerateInsights()
