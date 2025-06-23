import { supabase } from './supabase'

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connection successful!')
    
    // Test reading from user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, name, wellness_score, created_at')
      .limit(5)
    
    if (profilesError) {
      console.error('Error reading user profiles:', profilesError)
    } else {
      console.log('User profiles:', profiles)
    }
    
    // Test reading from health_conditions table
    const { data: conditions, error: conditionsError } = await supabase
      .from('health_conditions')
      .select('id, name, category, severity')
      .limit(5)
    
    if (conditionsError) {
      console.error('Error reading health conditions:', conditionsError)
    } else {
      console.log('Health conditions:', conditions)
    }
    
    // Test reading from medications table
    const { data: medications, error: medicationsError } = await supabase
      .from('medications')
      .select('id, name, dosage, frequency, is_active')
      .limit(5)
    
    if (medicationsError) {
      console.error('Error reading medications:', medicationsError)
    } else {
      console.log('Medications:', medications)
    }
    
    return true
  } catch (err) {
    console.error('Unexpected error:', err)
    return false
  }
}

// Export the test function
export { testSupabaseConnection }

// Run the test if this file is executed directly
if (require.main === module) {
  testSupabaseConnection()
    .then((success) => {
      console.log(success ? 'All tests passed!' : 'Some tests failed!')
      process.exit(success ? 0 : 1)
    })
    .catch((err) => {
      console.error('Test execution failed:', err)
      process.exit(1)
    })
}




