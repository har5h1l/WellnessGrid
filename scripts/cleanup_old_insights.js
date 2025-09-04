#!/usr/bin/env node

/**
 * Cleanup script to remove old health insights that are older than 30 days
 * This helps maintain data consistency and remove stale insights
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

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

async function cleanupOldInsights() {
  try {
    console.log('🧹 Starting cleanup of old health insights...')
    
    // Define cutoff date (30 days ago)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = thirtyDaysAgo.toISOString()
    
    console.log(`🗓️ Cutoff date: ${cutoffDate}`)
    
    // First, check how many old insights exist
    const { data: oldInsights, error: countError } = await supabaseAdmin
      .from('health_insights')
      .select('id, user_id, generated_at, insight_type')
      .lt('generated_at', cutoffDate)
    
    if (countError) {
      throw new Error(`Failed to count old insights: ${countError.message}`)
    }
    
    console.log(`📊 Found ${oldInsights?.length || 0} insights older than 30 days`)
    
    if (!oldInsights || oldInsights.length === 0) {
      console.log('✅ No old insights to clean up')
      return
    }
    
    // Group by user for logging
    const userGroups = {}
    oldInsights.forEach(insight => {
      if (!userGroups[insight.user_id]) {
        userGroups[insight.user_id] = []
      }
      userGroups[insight.user_id].push(insight)
    })
    
    console.log(`👥 Old insights found for ${Object.keys(userGroups).length} users:`)
    Object.entries(userGroups).forEach(([userId, insights]) => {
      console.log(`  - User ${userId}: ${insights.length} old insights`)
      insights.forEach(insight => {
        console.log(`    - ${insight.insight_type} from ${insight.generated_at}`)
      })
    })
    
    // Ask for confirmation
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const answer = await new Promise(resolve => {
      rl.question(`\n❓ Delete these ${oldInsights.length} old insights? (y/N): `, resolve)
    })
    rl.close()
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Cleanup cancelled by user')
      return
    }
    
    // Delete old insights
    console.log('🗑️ Deleting old insights...')
    
    const { error: deleteError } = await supabaseAdmin
      .from('health_insights')
      .delete()
      .lt('generated_at', cutoffDate)
    
    if (deleteError) {
      throw new Error(`Failed to delete old insights: ${deleteError.message}`)
    }
    
    console.log(`✅ Successfully deleted ${oldInsights.length} old insights`)
    console.log('🧹 Cleanup completed successfully')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    process.exit(1)
  }
}

// Add a dry-run mode
async function dryRunCleanup() {
  try {
    console.log('🧹 DRY RUN: Checking what would be cleaned up...')
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = thirtyDaysAgo.toISOString()
    
    console.log(`🗓️ Cutoff date: ${cutoffDate}`)
    
    const { data: oldInsights, error } = await supabaseAdmin
      .from('health_insights')
      .select('id, user_id, generated_at, insight_type')
      .lt('generated_at', cutoffDate)
    
    if (error) {
      throw new Error(`Failed to query old insights: ${error.message}`)
    }
    
    console.log(`📊 Would delete ${oldInsights?.length || 0} insights older than 30 days`)
    
    if (oldInsights && oldInsights.length > 0) {
      console.log('\n📋 Insights that would be deleted:')
      oldInsights.forEach(insight => {
        console.log(`  - ${insight.insight_type} for user ${insight.user_id} from ${insight.generated_at}`)
      })
    }
    
    console.log('\n💡 To actually delete these insights, run without --dry-run flag')
    
  } catch (error) {
    console.error('❌ Dry run failed:', error.message)
    process.exit(1)
  }
}

// Check command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

if (isDryRun) {
  dryRunCleanup()
} else {
  cleanupOldInsights()
}
