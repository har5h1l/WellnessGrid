#!/usr/bin/env node

/**
 * Debug script to investigate insight generation issues
 * This will help us understand why "insufficient data" insights are being generated
 * when the user appears to have data available
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

async function debugInsightGeneration() {
  try {
    console.log('🔍 Starting insight generation debug...')
    
    // Get test user ID
    const testUserId = process.env.TEST_USER_ID || '69478d34-90bd-476f-b47a-7d099c1cb913'
    console.log(`👤 Debugging for user: ${testUserId}`)
    
    // 1. Check user profile
    console.log('\n1. Checking user profile...')
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', testUserId)
      .single()
    
    if (profileError) {
      console.log('❌ User profile error:', profileError.message)
    } else {
      console.log('✅ User profile found:', {
        name: userProfile.name,
        email: userProfile.email,
        created_at: userProfile.created_at
      })
    }
    
    // 2. Check health conditions
    console.log('\n2. Checking health conditions...')
    const { data: conditions, error: conditionsError } = await supabaseAdmin
      .from('user_health_conditions')
      .select('*')
      .eq('user_id', testUserId)
    
    if (conditionsError) {
      console.log('❌ Health conditions error:', conditionsError.message)
    } else {
      console.log(`✅ Found ${conditions?.length || 0} health conditions:`)
      conditions?.forEach(condition => {
        console.log(`  - ${condition.condition_name} (${condition.severity})`)
      })
    }
    
    // 3. Check tracking entries
    console.log('\n3. Checking tracking entries...')
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: trackingEntries, error: trackingError } = await supabaseAdmin
      .from('tracking_entries')
      .select('*')
      .eq('user_id', testUserId)
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: false })
    
    if (trackingError) {
      console.log('❌ Tracking entries error:', trackingError.message)
    } else {
      console.log(`✅ Found ${trackingEntries?.length || 0} tracking entries in last 7 days:`)
      
      // Group by tool
      const groupedEntries = {}
      trackingEntries?.forEach(entry => {
        if (!groupedEntries[entry.tool_id]) {
          groupedEntries[entry.tool_id] = []
        }
        groupedEntries[entry.tool_id].push(entry)
      })
      
      Object.entries(groupedEntries).forEach(([toolId, entries]) => {
        console.log(`  - ${toolId}: ${entries.length} entries`)
        console.log(`    Latest: ${entries[0].timestamp}`)
        console.log(`    Data sample: ${JSON.stringify(entries[0].data).substring(0, 100)}...`)
      })
    }
    
    // 4. Check existing insights
    console.log('\n4. Checking existing insights...')
    const { data: existingInsights, error: insightsError } = await supabaseAdmin
      .from('health_insights')
      .select('*')
      .eq('user_id', testUserId)
      .order('generated_at', { ascending: false })
      .limit(3)
    
    if (insightsError) {
      console.log('❌ Insights error:', insightsError.message)
    } else {
      console.log(`✅ Found ${existingInsights?.length || 0} existing insights:`)
      existingInsights?.forEach(insight => {
        console.log(`  - ${insight.insight_type} from ${insight.generated_at}`)
        console.log(`    Summary: ${insight.insights?.summary?.substring(0, 100)}...`)
        console.log(`    Recommendations: ${insight.insights?.recommendations?.length || 0}`)
      })
    }
    
    // 5. Check enabled tools
    console.log('\n5. Checking enabled tools...')
    const { data: userTools, error: toolsError } = await supabaseAdmin
      .from('user_tools')
      .select('*')
      .eq('user_id', testUserId)
      .eq('is_enabled', true)
    
    if (toolsError) {
      console.log('❌ User tools error:', toolsError.message)
    } else {
      console.log(`✅ Found ${userTools?.length || 0} enabled tools:`)
      userTools?.forEach(tool => {
        console.log(`  - ${tool.tool_name} (${tool.tool_id})`)
      })
    }
    
    // 6. Check wellness score
    console.log('\n6. Checking wellness score...')
    const { data: wellnessScore, error: scoreError } = await supabaseAdmin
      .from('health_scores')
      .select('*')
      .eq('user_id', testUserId)
      .order('calculated_at', { ascending: false })
      .limit(1)
    
    if (scoreError) {
      console.log('❌ Wellness score error:', scoreError.message)
    } else if (wellnessScore?.length > 0) {
      const score = wellnessScore[0]
      console.log('✅ Latest wellness score:', {
        overall_score: score.overall_score,
        trend: score.trend,
        calculated_at: score.calculated_at,
        component_scores: score.component_scores
      })
    } else {
      console.log('⚠️ No wellness score found')
    }
    
    // 7. Summary and recommendations
    console.log('\n📊 SUMMARY:')
    console.log('=' + '='.repeat(50))
    
    const hasProfile = !!userProfile
    const hasConditions = conditions && conditions.length > 0
    const hasTrackingData = trackingEntries && trackingEntries.length > 0
    const hasTools = userTools && userTools.length > 0
    const hasScore = wellnessScore && wellnessScore.length > 0
    
    console.log(`Profile: ${hasProfile ? '✅' : '❌'}`)
    console.log(`Health Conditions: ${hasConditions ? '✅' : '❌'} (${conditions?.length || 0})`)
    console.log(`Tracking Data: ${hasTrackingData ? '✅' : '❌'} (${trackingEntries?.length || 0} entries)`)
    console.log(`Enabled Tools: ${hasTools ? '✅' : '❌'} (${userTools?.length || 0})`)
    console.log(`Wellness Score: ${hasScore ? '✅' : '❌'}`)
    
    console.log('\n💡 DIAGNOSIS:')
    if (!hasProfile) {
      console.log('❌ ISSUE: User profile not found - this will trigger "insufficient data" insights')
    } else if (!hasTrackingData) {
      console.log('❌ ISSUE: No tracking data found - this will trigger "insufficient data" insights')
    } else if (hasProfile && hasTrackingData) {
      console.log('✅ User has both profile and tracking data - insights should be generated properly')
      console.log('🔍 The issue might be in the LLM response parsing or API calls')
    }
    
    console.log('\n🔧 NEXT STEPS:')
    if (!hasProfile) {
      console.log('1. Check if user completed profile setup')
      console.log('2. Verify user ID is correct')
    } else if (!hasTrackingData) {
      console.log('1. Check if user has added tracking tools')
      console.log('2. Verify tracking entries are being saved correctly')
    } else {
      console.log('1. Check LLM service logs for insight generation failures')
      console.log('2. Test insight generation manually with this user ID')
      console.log('3. Check API response parsing in health-insights.ts')
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error.message)
    process.exit(1)
  }
}

// Allow for user ID override
const args = process.argv.slice(2)
const userIdArg = args.find(arg => arg.startsWith('--user='))
if (userIdArg) {
  process.env.TEST_USER_ID = userIdArg.split('=')[1]
}

debugInsightGeneration()
