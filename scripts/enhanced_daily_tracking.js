#!/usr/bin/env node

/**
 * Enhanced Daily Tracking Data Generator for October 26, 2025 Demo
 * 
 * This script generates comprehensive daily tracking data ensuring every single day
 * has multiple entries across all health tools for the best possible demo experience.
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

console.log('📅 Enhanced Daily Tracking Data Generator');
console.log('==========================================');
console.log(`🎯 Reference Date: ${REFERENCE_DATE.toLocaleDateString()}`);

// Enhanced data generation functions with more realistic patterns
function generateGlucoseValue(dayOffset, timeOfDay) {
  // Glucose improving over time with realistic daily patterns
  const baseValue = 180 - (dayOffset * 1.5); // Starting at 180, improving by 1.5 per day
  const timeVariation = timeOfDay === 'morning' ? 20 : -15; // Morning higher, evening lower
  const randomVariation = (Math.random() - 0.5) * 25; // ±12.5 mg/dL variation
  return Math.max(80, Math.min(250, Math.round(baseValue + timeVariation + randomVariation)));
}

function generateBloodPressure(dayOffset, timeOfDay) {
  // BP stable with slight improvement and daily variation
  const baseSystolic = 135 - (dayOffset * 0.4);
  const baseDiastolic = 85 - (dayOffset * 0.3);
  const timeVariation = timeOfDay === 'morning' ? 5 : -3; // Morning slightly higher
  return {
    systolic: Math.max(110, Math.min(160, Math.round(baseSystolic + timeVariation + (Math.random() - 0.5) * 10))),
    diastolic: Math.max(70, Math.min(100, Math.round(baseDiastolic + timeVariation + (Math.random() - 0.5) * 8))),
    heart_rate: 68 + Math.floor(Math.random() * 25) // 68-93 BPM
  };
}

function generateSleepData(dayOffset) {
  // Sleep improving over time with realistic patterns
  const baseHours = 6.2 + (dayOffset * 0.08); // Improving sleep duration
  const hours = Math.max(5.5, Math.min(8.5, baseHours + (Math.random() - 0.5) * 1.2));
  const efficiency = 0.72 + (dayOffset * 0.003); // Improving efficiency
  const quality = Math.max(1, Math.min(5, 3.2 + (dayOffset * 0.08) + (Math.random() - 0.5) * 1.2));
  
  return {
    duration_hours: Math.round(hours * 10) / 10,
    efficiency: Math.min(0.95, Math.max(0.6, efficiency + (Math.random() - 0.5) * 0.08)),
    quality: Math.round(quality * 10) / 10,
    bedtime: '22:' + (15 + Math.floor(Math.random() * 30)).toString().padStart(2, '0'),
    wake_time: '06:' + (15 + Math.floor(Math.random() * 30)).toString().padStart(2, '0'),
    deep_sleep_hours: Math.round((hours * 0.2 + Math.random() * 0.5) * 10) / 10,
    rem_sleep_hours: Math.round((hours * 0.25 + Math.random() * 0.3) * 10) / 10
  };
}

function generateMoodData(dayOffset, timeOfDay) {
  // Mood generally stable with realistic daily patterns
  const baseMood = 3.4 + (dayOffset * 0.03); // Slight improvement
  const timeVariation = timeOfDay === 'morning' ? 0.3 : -0.2; // Morning better, evening slightly lower
  const mood = Math.max(1, Math.min(5, baseMood + timeVariation + (Math.random() - 0.5) * 1.0));
  const energy = Math.max(1, Math.min(5, mood + (Math.random() - 0.5) * 0.8));
  const stress = Math.max(1, Math.min(5, 4.2 - mood + (Math.random() - 0.5) * 0.6));
  const anxiety = Math.max(1, Math.min(5, stress + (Math.random() - 0.5) * 0.5));
  
  return {
    mood: Math.round(mood * 10) / 10,
    energy: Math.round(energy * 10) / 10,
    stress: Math.round(stress * 10) / 10,
    anxiety: Math.round(anxiety * 10) / 10,
    sleep_quality: Math.max(1, Math.min(5, mood + (Math.random() - 0.5) * 0.5))
  };
}

function generateWeightData(dayOffset) {
  // Weight slightly increasing with realistic daily variation
  const baseWeight = 164.5 + (dayOffset * 0.12); // Slight increase
  const dailyVariation = (Math.random() - 0.5) * 1.5; // ±0.75 lbs daily variation
  const weight = Math.max(160, Math.min(170, baseWeight + dailyVariation));
  
  return {
    weight: Math.round(weight * 10) / 10,
    body_fat: Math.round((17.5 + (dayOffset * 0.02) + (Math.random() - 0.5) * 2) * 10) / 10,
    muscle_mass: Math.round((28.5 - (dayOffset * 0.01) + (Math.random() - 0.5) * 1) * 10) / 10,
    bmi: Math.round((weight / (1.75 * 1.75)) * 10) / 10 // Assuming 1.75m height
  };
}

function generateExerciseData(dayOffset, dayOfWeek) {
  // Exercise improving over time with realistic weekly patterns
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  const baseDuration = 22 + (dayOffset * 1.2); // Increasing duration
  const weekendBonus = isWeekend ? 15 : 0; // Longer workouts on weekends
  const duration = Math.max(10, Math.min(90, baseDuration + weekendBonus + (Math.random() - 0.5) * 15));
  
  const exerciseTypes = ['Cardio', 'Strength Training', 'Yoga', 'Walking', 'Swimming', 'Cycling', 'HIIT'];
  const type = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
  
  const intensity = Math.max(1, Math.min(5, 2.8 + (dayOffset * 0.05) + (Math.random() - 0.5) * 0.8));
  const calories = Math.round(duration * (7 + Math.random() * 3)); // 7-10 calories per minute
  
  return {
    duration_minutes: Math.round(duration),
    intensity: Math.round(intensity * 10) / 10,
    type: type,
    calories_burned: calories,
    heart_rate_avg: Math.round(120 + Math.random() * 40), // 120-160 BPM
    steps: Math.round(duration * (80 + Math.random() * 40)) // Steps based on duration
  };
}

function generateMedicationData(medication, dayOffset, timeOfDay) {
  const adherence = Math.random() < 0.96; // 96% adherence
  const timeVariation = timeOfDay === 'morning' ? 0 : 30; // Evening doses 30 minutes later
  
  return {
    taken: adherence,
    medication_name: medication.name,
    dosage: medication.dosage,
    time_taken: adherence ? timeOfDay : null,
    side_effects: adherence && Math.random() < 0.15 ? ['Mild nausea', 'Dizziness', 'Headache'][Math.floor(Math.random() * 3)] : null,
    notes: adherence ? (Math.random() < 0.2 ? 'Feeling good' : '') : 'Forgot to take'
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

async function generateComprehensiveTrackingData() {
  console.log('📊 Generating comprehensive daily tracking data...');
  
  const trackingEntries = [];
  const daysToGenerate = 45; // 45 days for more comprehensive data
  
  // Define medications
  const medications = [
    { name: 'Metformin', dosage: '500mg', frequency: 2, times: ['morning', 'evening'] },
    { name: 'Lisinopril', dosage: '10mg', frequency: 1, times: ['morning'] },
    { name: 'Atorvastatin', dosage: '20mg', frequency: 1, times: ['evening'] }
  ];

  console.log('📈 Enhanced health trends for comprehensive demo:');
  console.log('   glucose-tracker: improving (2-3 entries daily)');
  console.log('   mood-tracker: stable (2 entries daily)');
  console.log('   sleep-tracker: improving (1 entry daily)');
  console.log('   blood-pressure-tracker: stable (1-2 entries daily)');
  console.log('   weight-tracker: declining (1 entry every 2-3 days)');
  console.log('   exercise-tracker: improving (1 entry daily)');
  console.log('   medication-tracker: excellent (3 entries daily)');

  // Generate data for each day leading up to October 26th, 2025
  for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(REFERENCE_DATE);
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay();
    
    // Enhanced daily entry patterns
    const dailyPatterns = {
      'glucose-tracker': [
        { time: 'morning', hour: 8, minute: 15 },
        { time: 'evening', hour: 19, minute: 30 },
        ...(Math.random() < 0.3 ? [{ time: 'afternoon', hour: 14, minute: 45 }] : [])
      ],
      'mood-tracker': [
        { time: 'morning', hour: 9, minute: 0 },
        { time: 'evening', hour: 20, minute: 0 }
      ],
      'sleep-tracker': [
        { time: 'morning', hour: 7, minute: 0 }
      ],
      'blood-pressure-tracker': [
        { time: 'morning', hour: 10, minute: 30 },
        ...(Math.random() < 0.4 ? [{ time: 'evening', hour: 18, minute: 0 }] : [])
      ],
      'weight-tracker': [
        ...(dayOffset % 2 === 0 ? [{ time: 'morning', hour: 7, minute: 30 }] : [])
      ],
      'exercise-tracker': [
        { time: 'evening', hour: 17, minute: 0 }
      ],
      'medication-tracker': [
        { time: 'morning', hour: 8, minute: 0 },
        { time: 'evening', hour: 20, minute: 0 },
        { time: 'evening', hour: 20, minute: 30 }
      ]
    };

    // Generate entries for each tool
    Object.entries(dailyPatterns).forEach(([toolId, times]) => {
      times.forEach(({ time, hour, minute }) => {
        const entryTime = new Date(date);
        entryTime.setHours(hour, minute + Math.floor(Math.random() * 30), 0, 0);
        
        let data = {};
        
        switch (toolId) {
          case 'glucose-tracker':
            data = {
              glucose_level: generateGlucoseValue(dayOffset, time),
              unit: 'mg/dL',
              time_of_day: time,
              meal_context: time === 'morning' ? 'fasting' : (time === 'evening' ? 'post-dinner' : 'post-lunch'),
              notes: Math.random() < 0.25 ? (time === 'morning' ? 'Felt good this morning' : 'Had a good day') : ''
            };
            break;
            
          case 'mood-tracker':
            const moodData = generateMoodData(dayOffset, time);
            data = {
              mood: moodData.mood,
              energy: moodData.energy,
              stress: moodData.stress,
              anxiety: moodData.anxiety,
              sleep_quality: moodData.sleep_quality,
              notes: Math.random() < 0.3 ? (time === 'morning' ? 'Ready for the day' : 'Reflecting on the day') : ''
            };
            break;
            
          case 'sleep-tracker':
            const sleepData = generateSleepData(dayOffset);
            data = {
              duration_hours: sleepData.duration_hours,
              efficiency: sleepData.efficiency,
              quality: sleepData.quality,
              bedtime: sleepData.bedtime,
              wake_time: sleepData.wake_time,
              deep_sleep_hours: sleepData.deep_sleep_hours,
              rem_sleep_hours: sleepData.rem_sleep_hours,
              notes: Math.random() < 0.2 ? 'Slept well' : ''
            };
            break;
            
          case 'blood-pressure-tracker':
            const bpData = generateBloodPressure(dayOffset, time);
            data = {
              systolic: bpData.systolic,
              diastolic: bpData.diastolic,
              heart_rate: bpData.heart_rate,
              time_of_day: time,
              notes: Math.random() < 0.15 ? 'Normal reading' : ''
            };
            break;
            
          case 'weight-tracker':
            const weightData = generateWeightData(dayOffset);
            data = {
              weight: weightData.weight,
              unit: 'lbs',
              body_fat: weightData.body_fat,
              muscle_mass: weightData.muscle_mass,
              bmi: weightData.bmi,
              notes: Math.random() < 0.2 ? 'Feeling heavier' : ''
            };
            break;
            
          case 'exercise-tracker':
            const exerciseData = generateExerciseData(dayOffset, dayOfWeek);
            data = {
              duration_minutes: exerciseData.duration_minutes,
              intensity: exerciseData.intensity,
              type: exerciseData.type,
              calories_burned: exerciseData.calories_burned,
              heart_rate_avg: exerciseData.heart_rate_avg,
              steps: exerciseData.steps,
              notes: Math.random() < 0.3 ? 'Great workout!' : ''
            };
            break;
            
          case 'medication-tracker':
            const medIndex = Math.floor(Math.random() * medications.length);
            const medication = medications[medIndex];
            const medData = generateMedicationData(medication, dayOffset, time);
            data = {
              taken: medData.taken,
              medication_name: medData.medication_name,
              dosage: medData.dosage,
              time_taken: medData.taken ? time : null,
              side_effects: medData.side_effects,
              notes: medData.notes
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
      });
    });
  }

  console.log(`📥 Inserting ${trackingEntries.length} comprehensive tracking entries...`);
  
  // Insert in batches
  const batchSize = 100;
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
  console.log('💊 Generating comprehensive medication logs...');
  
  const medicationLogs = [];
  const daysToGenerate = 45;
  
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
        const taken = Math.random() < 0.96; // 96% adherence
        const time = new Date(date);
        time.setHours(8 + dose * 12, Math.random() * 60, 0, 0);
        
        medicationLogs.push({
          user_id: TEST_USER_ID,
          medication_name: med.name,
          dosage: med.dosage,
          taken: taken,
          time_taken: taken ? time.toISOString() : null,
          notes: taken && Math.random() < 0.15 ? 'No side effects' : (taken ? '' : 'Forgot to take')
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

async function main() {
  try {
    console.log(`\n🎯 Generating comprehensive daily tracking data for October 26, 2025...`);
    
    // Clear existing data
    await clearExistingData();
    
    // Generate comprehensive data
    const trackingCount = await generateComprehensiveTrackingData();
    const medicationCount = await generateMedicationLogs();
    
    console.log('\n🎉 Enhanced daily tracking data generation complete!');
    console.log('=====================================================');
    console.log(`📊 Generated comprehensive data:`);
    console.log(`   - ${trackingCount} tracking entries (every day covered)`);
    console.log(`   - ${medicationCount} medication logs`);
    console.log(`   - 45 days of continuous health tracking`);
    console.log(`   - Multiple entries per day for most tools`);
    console.log(`   - Realistic daily patterns and variations`);
    console.log(`\n🎬 Perfect for comprehensive demos!`);
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






