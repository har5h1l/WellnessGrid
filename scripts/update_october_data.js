#!/usr/bin/env node

/**
 * Update Synthetic Data for October 26th Demo
 * 
 * This script updates the test user data to use October 26th, 2024 as the reference date
 * and generates realistic health tracking data for the month leading up to that date.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const TEST_USER_ID = '69478d34-90bd-476f-b47a-7d099c1cb913';
const REFERENCE_DATE = new Date('2025-10-26T12:00:00Z'); // October 26th, 2025

console.log('📅 WellnessGrid October 26th Data Generator');
console.log('============================================');
console.log(`🎯 Reference Date: ${REFERENCE_DATE.toLocaleDateString()}`);

function generateRealisticValue(baseValue, trend, dayOffset, toolId) {
  const variations = {
    improving: () => baseValue * (1 - (dayOffset * 0.02)), // Gets better over time
    declining: () => baseValue * (1 + (dayOffset * 0.015)), // Gets worse over time
    stable: () => baseValue * (0.95 + Math.random() * 0.1), // Stable with small variations
    fluctuating: () => baseValue * (0.8 + Math.random() * 0.4) // More random variation
  };

  return Math.max(0, Math.round(variations[trend]() || variations.stable()));
}

function generateGlucoseValue(dayOffset) {
  // Glucose improving over time (diabetes management)
  const baseValue = 180 - (dayOffset * 1.2); // Starting at 180, improving by 1.2 per day
  const variation = (Math.random() - 0.5) * 20; // ±10 mg/dL variation
  return Math.max(80, Math.min(250, Math.round(baseValue + variation)));
}

function generateBloodPressure(dayOffset) {
  // BP stable with slight improvement
  const systolic = 135 - (dayOffset * 0.3); // Slight improvement
  const diastolic = 85 - (dayOffset * 0.2);
  return {
    systolic: Math.max(110, Math.min(160, Math.round(systolic + (Math.random() - 0.5) * 8))),
    diastolic: Math.max(70, Math.min(100, Math.round(diastolic + (Math.random() - 0.5) * 6)))
  };
}

function generateSleepData(dayOffset) {
  // Sleep improving over time
  const baseHours = 6.5 + (dayOffset * 0.05); // Improving sleep duration
  const hours = Math.max(5, Math.min(9, baseHours + (Math.random() - 0.5) * 1.5));
  const efficiency = 0.75 + (dayOffset * 0.002); // Improving efficiency
  return {
    duration_hours: Math.round(hours * 10) / 10,
    efficiency: Math.min(0.95, Math.max(0.6, efficiency + (Math.random() - 0.5) * 0.1)),
    quality: Math.round(3 + (dayOffset * 0.1) + (Math.random() - 0.5) * 1.5) // 1-5 scale
  };
}

function generateMoodData(dayOffset) {
  // Mood generally stable with some variation
  const baseMood = 3.5 + (dayOffset * 0.02); // Slight improvement
  const mood = Math.max(1, Math.min(5, baseMood + (Math.random() - 0.5) * 1.2));
  const energy = Math.max(1, Math.min(5, mood + (Math.random() - 0.5) * 0.8));
  return {
    mood: Math.round(mood * 10) / 10,
    energy: Math.round(energy * 10) / 10,
    stress: Math.max(1, Math.min(5, 4 - mood + (Math.random() - 0.5) * 0.5))
  };
}

function generateWeightData(dayOffset) {
  // Weight slightly increasing (concerning trend)
  const baseWeight = 165 + (dayOffset * 0.1); // Slight increase
  return Math.max(160, Math.min(175, baseWeight + (Math.random() - 0.5) * 2));
}

function generateExerciseData(dayOffset) {
  // Exercise improving over time
  const baseDuration = 25 + (dayOffset * 0.8); // Increasing duration
  const duration = Math.max(15, Math.min(60, baseDuration + (Math.random() - 0.5) * 10));
  const intensity = Math.max(1, Math.min(5, 3 + (dayOffset * 0.05) + (Math.random() - 0.5) * 0.8));
  return {
    duration_minutes: Math.round(duration),
    intensity: Math.round(intensity * 10) / 10,
    type: ['Cardio', 'Strength', 'Yoga', 'Walking', 'Swimming'][Math.floor(Math.random() * 5)]
  };
}

async function clearExistingData() {
  console.log('🗑️  Clearing existing tracking data...');
  
  const tables = ['tracking_entries', 'medication_logs', 'health_insights', 'health_scores'];
  
  for (const table of tables) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('user_id', TEST_USER_ID);
      
    if (error) {
      console.log(`⚠️  Warning clearing ${table}:`, error.message);
    } else {
      console.log(`   ✅ Cleared ${table}`);
    }
  }
}

async function generateTrackingData() {
  console.log('📊 Generating October 26th tracking data...');
  
  const trackingEntries = [];
  const daysToGenerate = 30; // Last 30 days leading to October 26th
  
  // Define realistic trends for October
  const trends = {
    'glucose-tracker': 'improving',
    'mood-tracker': 'stable',
    'sleep-tracker': 'improving',
    'blood-pressure-tracker': 'stable',
    'weight-tracker': 'declining',
    'exercise-tracker': 'improving',
    'medication-tracker': 'stable'
  };

  console.log('📈 October health trends:');
  Object.entries(trends).forEach(([tool, trend]) => {
    console.log(`   ${tool}: ${trend}`);
  });

  // Generate data for each day leading up to October 26th
  for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(REFERENCE_DATE);
    date.setDate(date.getDate() - dayOffset);
    
    // Define entries per day for each tool
    const entriesPerDay = {
      'glucose-tracker': Math.random() < 0.8 ? 2 : 1, // 80% chance of 2 entries, 20% chance of 1
      'mood-tracker': Math.random() < 0.9 ? 1 : 0,    // 90% chance of 1 entry
      'sleep-tracker': 1,                              // Always 1 entry
      'blood-pressure-tracker': Math.random() < 0.7 ? 1 : 0, // 70% chance
      'weight-tracker': Math.random() < 0.3 ? 1 : 0,   // 30% chance (weekly-ish)
      'exercise-tracker': Math.random() < 0.6 ? 1 : 0, // 60% chance
      'medication-tracker': Math.random() < 0.95 ? 2 : 1 // 95% chance of 2, 5% chance of 1
    };

    Object.entries(entriesPerDay).forEach(([toolId, count]) => {
      for (let i = 0; i < count; i++) {
        const entryTime = new Date(date);
        entryTime.setHours(8 + Math.random() * 12, Math.random() * 60, 0, 0); // Random time between 8 AM and 8 PM
        
        let data = {};
        
        switch (toolId) {
          case 'glucose-tracker':
            data = {
              glucose_level: generateGlucoseValue(dayOffset),
              unit: 'mg/dL',
              time_of_day: entryTime.getHours() < 12 ? 'morning' : 'evening',
              notes: Math.random() < 0.2 ? 'Felt good today' : ''
            };
            break;
            
          case 'mood-tracker':
            const moodData = generateMoodData(dayOffset);
            data = {
              mood: moodData.mood,
              energy: moodData.energy,
              stress: moodData.stress,
              notes: Math.random() < 0.3 ? 'Had a good day' : ''
            };
            break;
            
          case 'sleep-tracker':
            const sleepData = generateSleepData(dayOffset);
            data = {
              duration_hours: sleepData.duration_hours,
              efficiency: sleepData.efficiency,
              quality: sleepData.quality,
              bedtime: '22:30',
              wake_time: '06:30'
            };
            break;
            
          case 'blood-pressure-tracker':
            const bpData = generateBloodPressure(dayOffset);
            data = {
              systolic: bpData.systolic,
              diastolic: bpData.diastolic,
              heart_rate: 70 + Math.floor(Math.random() * 20),
              notes: Math.random() < 0.1 ? 'Normal reading' : ''
            };
            break;
            
          case 'weight-tracker':
            data = {
              weight: generateWeightData(dayOffset),
              unit: 'lbs',
              body_fat: 18 + Math.random() * 4,
              notes: Math.random() < 0.2 ? 'Feeling heavier' : ''
            };
            break;
            
          case 'exercise-tracker':
            const exerciseData = generateExerciseData(dayOffset);
            data = {
              duration_minutes: exerciseData.duration_minutes,
              intensity: exerciseData.intensity,
              type: exerciseData.type,
              calories_burned: Math.round(exerciseData.duration_minutes * 8),
              notes: Math.random() < 0.3 ? 'Great workout!' : ''
            };
            break;
            
          case 'medication-tracker':
            data = {
              taken: Math.random() < 0.95, // 95% adherence
              medication_name: ['Metformin', 'Lisinopril', 'Atorvastatin'][Math.floor(Math.random() * 3)],
              dosage: ['500mg', '10mg', '20mg'][Math.floor(Math.random() * 3)],
              time_taken: entryTime.toTimeString().slice(0, 5),
              notes: Math.random() < 0.1 ? 'No side effects' : ''
            };
            break;
        }

        trackingEntries.push({
          user_id: TEST_USER_ID,
          tool_id: toolId,
          data: data,
          timestamp: entryTime.toISOString(),
          created_at: entryTime.toISOString()
        });
      }
    });
  }

  console.log(`📥 Inserting ${trackingEntries.length} tracking entries...`);
  
  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < trackingEntries.length; i += batchSize) {
    const batch = trackingEntries.slice(i, i + batchSize);
    const { error: insertError } = await supabaseAdmin
      .from('tracking_entries')
      .insert(batch);
    
    if (insertError) {
      console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError.message);
      throw insertError;
    }
    
    console.log(`   ✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(trackingEntries.length/batchSize)}`);
  }

  return trackingEntries.length;
}

async function generateMedicationLogs() {
  console.log('💊 Generating medication logs...');
  
  const medicationLogs = [];
  const daysToGenerate = 30;
  
  const medications = [
    { name: 'Metformin', dosage: '500mg', frequency: 2 },
    { name: 'Lisinopril', dosage: '10mg', frequency: 1 },
    { name: 'Atorvastatin', dosage: '20mg', frequency: 1 }
  ];
  
  for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(REFERENCE_DATE);
    date.setDate(date.getDate() - dayOffset);
    
    medications.forEach(med => {
      for (let dose = 0; dose < med.frequency; dose++) {
        const taken = Math.random() < 0.95; // 95% adherence
        const time = new Date(date);
        time.setHours(8 + dose * 12, Math.random() * 60, 0, 0); // Morning and evening doses
        
        medicationLogs.push({
          user_id: TEST_USER_ID,
          medication_name: med.name,
          dosage: med.dosage,
          taken: taken,
          time_taken: taken ? time.toISOString() : null,
          notes: taken && Math.random() < 0.1 ? 'No side effects' : (taken ? '' : 'Forgot to take')
        });
      }
    });
  }
  
  const { error } = await supabaseAdmin
    .from('medication_logs')
    .insert(medicationLogs);
    
  if (error) {
    console.error('❌ Error inserting medication logs:', error.message);
  } else {
    console.log(`✅ Generated ${medicationLogs.length} medication logs`);
  }
  
  return medicationLogs.length;
}

async function generateHealthInsights() {
  console.log('🧠 Generating health insights...');
  
  const insights = [
    {
      user_id: TEST_USER_ID,
      insight_type: 'daily',
      title: 'Glucose Control Improving',
      description: 'Your blood glucose levels have shown consistent improvement over the past 2 weeks. Average readings decreased from 180 mg/dL to 145 mg/dL. Keep up the great work with your medication adherence!',
      created_at: new Date(REFERENCE_DATE).toISOString()
    },
    {
      user_id: TEST_USER_ID,
      insight_type: 'weekly',
      title: 'Sleep Quality Trending Up',
      description: 'Your sleep duration and quality have improved significantly. You are now averaging 7.2 hours of sleep per night with better sleep efficiency. This correlates with your improved mood scores.',
      created_at: new Date(REFERENCE_DATE.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: TEST_USER_ID,
      insight_type: 'weekly',
      title: 'Exercise Consistency Strong',
      description: 'You have maintained excellent exercise consistency with 5 workouts per week. Your average workout duration of 35 minutes is optimal for your health goals. Consider adding strength training twice per week.',
      created_at: new Date(REFERENCE_DATE.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: TEST_USER_ID,
      insight_type: 'monthly',
      title: 'Weight Management Alert',
      description: 'Your weight has increased by 3.2 lbs over the past month. This may be related to medication side effects or dietary changes. Consider discussing with your healthcare provider.',
      created_at: new Date(REFERENCE_DATE.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      user_id: TEST_USER_ID,
      insight_type: 'daily',
      title: 'Medication Adherence Excellent',
      description: 'Your medication adherence rate is 94%, which is excellent! You have missed only 2 doses in the past 30 days. This high adherence is contributing to your improved glucose control.',
      created_at: new Date(REFERENCE_DATE.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  const { error } = await supabaseAdmin
    .from('health_insights')
    .insert(insights);
    
  if (error) {
    console.error('❌ Error inserting insights:', error.message);
  } else {
    console.log(`✅ Generated ${insights.length} health insights`);
  }
  
  return insights.length;
}

async function generateWellnessScores() {
  console.log('📊 Generating wellness scores...');
  
  const scores = [
    {
      user_id: TEST_USER_ID,
      overall_score: 78,
      calculated_at: new Date(REFERENCE_DATE).toISOString(),
      period: '7d',
      trend: 'improving'
    },
    {
      user_id: TEST_USER_ID,
      overall_score: 72,
      calculated_at: new Date(REFERENCE_DATE.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period: '7d',
      trend: 'stable'
    },
    {
      user_id: TEST_USER_ID,
      overall_score: 68,
      calculated_at: new Date(REFERENCE_DATE.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      period: '7d',
      trend: 'declining'
    }
  ];
  
  const { error } = await supabaseAdmin
    .from('health_scores')
    .insert(scores);
    
  if (error) {
    console.error('❌ Error inserting scores:', error.message);
  } else {
    console.log(`✅ Generated ${scores.length} wellness scores`);
  }
  
  return scores.length;
}

async function main() {
  try {
    console.log(`\n🎯 Generating data for October 26th, 2024 demo...`);
    
    // Clear existing data
    await clearExistingData();
    
    // Generate new data
    const trackingCount = await generateTrackingData();
    const medicationCount = await generateMedicationLogs();
    const insightsCount = await generateHealthInsights();
    const scoresCount = await generateWellnessScores();
    
    console.log('\n🎉 October 26th data generation complete!');
    console.log('==========================================');
    console.log(`📊 Generated data:`);
    console.log(`   - ${trackingCount} tracking entries`);
    console.log(`   - ${medicationCount} medication logs`);
    console.log(`   - ${insightsCount} health insights`);
    console.log(`   - ${scoresCount} wellness scores`);
    console.log(`\n🎬 Perfect for October 26th demos!`);
    console.log(`📅 Reference date: ${REFERENCE_DATE.toLocaleDateString()}`);
    console.log(`🔑 Login: 28hshah@gmail.com / Test123!`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
