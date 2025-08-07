const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Use the same admin client setup
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

async function debugInsights() {
  const userId = '69478d34-90bd-476f-b47a-7d099c1cb913'
  
  console.log('🔍 Debug: Health Insights Generation')
  console.log('=====================================')
  
  try {
    // 1. Check user profile
    console.log('\n1. Checking user profile...')
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message)
    } else {
      console.log('✅ Profile found:', profile?.name, profile?.email)
    }
    
    // 2. Check tracking data
    console.log('\n2. Checking tracking data...')
    const { data: trackingData, error: trackingError } = await supabaseAdmin
      .from('tracking_entries')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10)
    
    if (trackingError) {
      console.log('❌ Tracking data error:', trackingError.message)
    } else {
      console.log(`✅ Found ${trackingData?.length || 0} tracking entries`)
      if (trackingData && trackingData.length > 0) {
        console.log('   Recent entries:')
        trackingData.slice(0, 3).forEach((entry, i) => {
          console.log(`   ${i + 1}. ${entry.tool_id} - ${entry.timestamp} - ${JSON.stringify(entry.data).substring(0, 50)}...`)
        })
      }
    }
    
    // 3. Check health conditions  
    console.log('\n3. Checking health conditions...')
    const { data: conditions, error: conditionsError } = await supabaseAdmin
      .from('health_conditions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (conditionsError) {
      console.log('❌ Conditions error:', conditionsError.message)
    } else {
      console.log(`✅ Found ${conditions?.length || 0} health conditions`)
      conditions?.forEach(condition => {
        console.log(`   - ${condition.name} (${condition.severity})`)
      })
    }
    
    // 4. Check existing insights
    console.log('\n4. Checking existing insights...')
    const { data: existingInsights, error: insightsError } = await supabaseAdmin
      .from('health_insights')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(3)
    
    if (insightsError) {
      console.log('❌ Insights error:', insightsError.message)
    } else {
      console.log(`✅ Found ${existingInsights?.length || 0} existing insights`)
      existingInsights?.forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight.insight_type} - ${insight.generated_at}`)
        console.log(`      Summary: ${insight.insights?.summary || 'No summary'}`)
        console.log(`      Service: ${insight.metadata?.llm_service_used || 'Unknown'}`)
      })
    }
    
    // 5. Test API call to generate insights
    console.log('\n5. Testing insights generation API...')
    try {
      const response = await fetch('http://localhost:3000/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          insightType: 'on_demand',
          forceGenerate: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ API call successful')
        console.log(`   Processing time: ${result.processing_time_ms}ms`)
        console.log(`   Summary: ${result.data?.insights?.summary || 'No summary'}`)
        console.log(`   Trends: ${result.data?.insights?.trends?.length || 0}`)
        console.log(`   Recommendations: ${result.data?.insights?.recommendations?.length || 0}`)
        console.log(`   Service used: ${result.data?.metadata?.llm_service_used || 'Unknown'}`)
      } else {
        console.log('❌ API call failed:', result.error)
      }
    } catch (apiError) {
      console.log('❌ API call error:', apiError.message)
      console.log('   Make sure the Next.js server is running on localhost:3000')
    }
    
    console.log('\n=====================================')
    console.log('🔍 Debug completed')
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

debugInsights().catch(console.error)
