#!/usr/bin/env node

// Simple dashboard refresh script for users
// Run this anytime dashboard and insights get out of sync

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

async function refreshDashboard() {
  try {
    const testUserId = process.env.TEST_USER_ID || '69478d34-90bd-476f-b47a-7d099c1cb913'
    
    console.log('🔄 Refreshing dashboard data...')
    console.log(`👤 User: ${testUserId}`)
    
    // Clear caches
    console.log('\n1. Clearing cached data...')
    await Promise.all([
      supabaseAdmin.from('health_insights').delete().eq('user_id', testUserId),
      supabaseAdmin.from('health_scores').delete().eq('user_id', testUserId)
    ])
    console.log('✅ Caches cleared')
    
    // Wait for cache clearing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Force regenerate insights
    console.log('\n2. Generating fresh insights...')
    
    // Import and run the insights service directly
    const { HealthInsightsService } = await import('../lib/services/health-insights')
    const newInsight = await HealthInsightsService.generateHealthInsights(testUserId, 'on_demand')
    
    console.log(`✅ Fresh insights generated!`)
    console.log(`📊 Summary: ${newInsight.insights.summary.substring(0, 100)}...`)
    console.log(`🎯 Recommendations: ${newInsight.insights.recommendations?.length || 0}`)
    console.log(`📈 Trends: ${newInsight.insights.trends?.length || 0}`)
    
    console.log('\n🎉 Dashboard refreshed successfully!')
    console.log('💡 Refresh your browser to see the updated data')
    
  } catch (error) {
    console.error('❌ Dashboard refresh failed:', error)
    console.log('\n🔧 Try running: node scripts/force_regenerate_insights.js')
    process.exit(1)
  }
}

if (require.main === module) {
  refreshDashboard()
}

module.exports = { refreshDashboard }




