const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const userId = '69478d34-90bd-476f-b47a-7d099c1cb913'

// Generate comprehensive demo data for the last 30 days
async function generateDemoData() {
  console.log('🚀 Generating comprehensive demo data for better streaks...')
  
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
  
  // Generate glucose tracking data (daily for 30 days)
  console.log('📊 Adding glucose tracking data...')
  const glucoseEntries = []
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + (i * 24 * 60 * 60 * 1000))
    const glucoseLevel = 80 + Math.random() * 60 + Math.sin(i * 0.2) * 20 // 80-140 range with some variation
    
    glucoseEntries.push({
      user_id: userId,
      tool_id: 'glucose-tracker',
      data: {
        glucose_level: Math.round(glucoseLevel),
        timing: ['morning', 'afternoon', 'evening'][Math.floor(Math.random() * 3)],
        carbs_consumed: Math.round(20 + Math.random() * 80),
        insulin_taken: Math.round(2 + Math.random() * 8),
        symptoms: Math.random() > 0.7 ? ['fatigue', 'thirst'] : [],
        notes: Math.random() > 0.5 ? 'Feeling good today' : ''
      },
      timestamp: date.toISOString(),
      created_at: date.toISOString(),
      updated_at: date.toISOString()
    })
  }
  
  // Generate mood tracking data (daily for 30 days)
  console.log('😊 Adding mood tracking data...')
  const moodEntries = []
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + (i * 24 * 60 * 60 * 1000))
    const moodScore = Math.floor(Math.random() * 5) + 1 // 1-5 scale
    
    moodEntries.push({
      user_id: userId,
      tool_id: 'mood-tracker',
      data: {
        mood_score: moodScore,
        energy_level: Math.floor(Math.random() * 5) + 1,
        stress_level: Math.floor(Math.random() * 5) + 1,
        sleep_quality: Math.floor(Math.random() * 5) + 1,
        notes: moodScore >= 4 ? 'Great day!' : moodScore <= 2 ? 'Tough day' : 'Average day'
      },
      timestamp: date.toISOString(),
      created_at: date.toISOString(),
      updated_at: date.toISOString()
    })
  }
  
  // Generate medication tracking data (daily for 30 days)
  console.log('💊 Adding medication tracking data...')
  const medicationEntries = []
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + (i * 24 * 60 * 60 * 1000))
    
    // Add 2-3 medication logs per day
    const logsPerDay = Math.floor(Math.random() * 2) + 2
    for (let j = 0; j < logsPerDay; j++) {
      medicationEntries.push({
        user_id: userId,
        tool_id: 'medication-tracker',
        data: {
          medication_id: 'med-1', // Assuming we have a medication with this ID
          taken: true,
          time_taken: ['08:00', '12:00', '18:00', '22:00'][j] || '08:00',
          notes: Math.random() > 0.7 ? 'Taken with food' : '',
          side_effects: Math.random() > 0.8 ? ['nausea'] : []
        },
        timestamp: date.toISOString(),
        created_at: date.toISOString(),
        updated_at: date.toISOString()
      })
    }
  }
  
  // Generate symptom tracking data (every 2-3 days)
  console.log('🤒 Adding symptom tracking data...')
  const symptomEntries = []
  for (let i = 0; i < 15; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + (i * 2 * 24 * 60 * 60 * 1000))
    const symptoms = ['headache', 'fatigue', 'nausea', 'dizziness', 'blurred vision']
    const selectedSymptoms = symptoms.filter(() => Math.random() > 0.5)
    
    if (selectedSymptoms.length > 0) {
      symptomEntries.push({
        user_id: userId,
        tool_id: 'symptom-tracker',
        data: {
          symptoms: selectedSymptoms,
          severity: Math.floor(Math.random() * 5) + 1,
          duration_hours: Math.floor(Math.random() * 8) + 1,
          triggers: Math.random() > 0.6 ? ['stress', 'food'] : [],
          notes: 'Tracked for health monitoring'
        },
        timestamp: date.toISOString(),
        created_at: date.toISOString(),
        updated_at: date.toISOString()
      })
    }
  }
  
  // Generate exercise tracking data (every 2-3 days)
  console.log('🏃 Adding exercise tracking data...')
  const exerciseEntries = []
  for (let i = 0; i < 12; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + (i * 2.5 * 24 * 60 * 60 * 1000))
    const exercises = ['Running', 'Swimming', 'Cycling', 'Walking', 'Weight Training']
    const exercise = exercises[Math.floor(Math.random() * exercises.length)]
    
    exerciseEntries.push({
      user_id: userId,
      tool_id: 'exercise-tracker',
      data: {
        type: exercise,
        duration_minutes: Math.floor(Math.random() * 60) + 20,
        intensity: Math.floor(Math.random() * 5) + 1,
        calories_burned: Math.floor(Math.random() * 300) + 100,
        heart_rate_avg: Math.floor(Math.random() * 40) + 120,
        notes: 'Great workout!'
      },
      timestamp: date.toISOString(),
      created_at: date.toISOString(),
      updated_at: date.toISOString()
    })
  }
  
  // Insert all data
  try {
    console.log('💾 Inserting glucose data...')
    const { error: glucoseError } = await supabase
      .from('tracking_entries')
      .insert(glucoseEntries)
    
    if (glucoseError) {
      console.error('❌ Error inserting glucose data:', glucoseError)
    } else {
      console.log('✅ Glucose data inserted successfully')
    }
    
    console.log('💾 Inserting mood data...')
    const { error: moodError } = await supabase
      .from('tracking_entries')
      .insert(moodEntries)
    
    if (moodError) {
      console.error('❌ Error inserting mood data:', moodError)
    } else {
      console.log('✅ Mood data inserted successfully')
    }
    
    console.log('💾 Inserting medication data...')
    const { error: medicationError } = await supabase
      .from('tracking_entries')
      .insert(medicationEntries)
    
    if (medicationError) {
      console.error('❌ Error inserting medication data:', medicationError)
    } else {
      console.log('✅ Medication data inserted successfully')
    }
    
    console.log('💾 Inserting symptom data...')
    const { error: symptomError } = await supabase
      .from('tracking_entries')
      .insert(symptomEntries)
    
    if (symptomError) {
      console.error('❌ Error inserting symptom data:', symptomError)
    } else {
      console.log('✅ Symptom data inserted successfully')
    }
    
    console.log('💾 Inserting exercise data...')
    const { error: exerciseError } = await supabase
      .from('tracking_entries')
      .insert(exerciseEntries)
    
    if (exerciseError) {
      console.error('❌ Error inserting exercise data:', exerciseError)
    } else {
      console.log('✅ Exercise data inserted successfully')
    }
    
    console.log('🎉 Demo data generation complete!')
    console.log(`📊 Added ${glucoseEntries.length} glucose entries`)
    console.log(`😊 Added ${moodEntries.length} mood entries`)
    console.log(`💊 Added ${medicationEntries.length} medication entries`)
    console.log(`🤒 Added ${symptomEntries.length} symptom entries`)
    console.log(`🏃 Added ${exerciseEntries.length} exercise entries`)
    
  } catch (error) {
    console.error('❌ Error generating demo data:', error)
  }
}

// Run the script
generateDemoData()
