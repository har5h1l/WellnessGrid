const { HealthInsightsService } = require('./lib/services/health-insights')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testInsightsGeneration() {
  const userId = '69478d34-90bd-476f-b47a-7d099c1cb913'
  
  console.log('🧠 Testing insights generation...')
  
  try {
    // Force generate new insights with detailed logging
    const insights = await HealthInsightsService.generateHealthInsights(userId, 'on_demand')
    
    console.log('\n📊 Generated insights:')
    console.log('ID:', insights.id)
    console.log('Type:', insights.insight_type)
    console.log('Generated:', insights.generated_at)
    console.log('\nInsights structure:')
    console.log(JSON.stringify(insights.insights, null, 2))
    console.log('\nSummary:', insights.insights?.summary)
    console.log('Trends count:', insights.insights?.trends?.length || 0)
    console.log('Recommendations count:', insights.insights?.recommendations?.length || 0)
    
  } catch (error) {
    console.error('❌ Error generating insights:', error)
  }
}

testInsightsGeneration().catch(console.error)
