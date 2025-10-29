#!/usr/bin/env node

/**
 * Type 1 Diabetes Profile and Data Generator
 * 
 * This script updates the user profile to reflect Type 1 diabetes and generates
 * realistic glucose data showing both spikes and stability patterns typical of T1D management.
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
const REFERENCE_DATE = new Date('2025-10-26T12:00:00Z');

console.log('🩸 Type 1 Diabetes Profile Generator');
console.log('====================================');
console.log(`🎯 Reference Date: ${REFERENCE_DATE.toLocaleDateString()}`);

// Realistic T1D glucose patterns
function generateT1DGlucoseValue(dayOffset, timeOfDay, mealContext, isSpikeDay = false) {
  // Base glucose improving over time (better management)
  let baseValue = 165 - (dayOffset * 1.8); // Starting higher, improving by 1.8 per day
  
  // Time of day variations (typical T1D patterns)
  const timeVariations = {
    'morning': 25,    // Dawn phenomenon
    'afternoon': -10, // Usually lower
    'evening': 15,    // Slightly higher
    'night': -5       // Usually lowest
  };
  
  // Meal context variations
  const mealVariations = {
    'fasting': -20,
    'pre-meal': 0,
    'post-meal': 45,  // Post-meal spikes
    'post-snack': 25
  };
  
  // Add spike days (realistic T1D experience)
  if (isSpikeDay) {
    baseValue += 40 + Math.random() * 30; // 40-70 mg/dL higher on spike days
  }
  
  // Add random variation
  const randomVariation = (Math.random() - 0.5) * 35; // ±17.5 mg/dL variation
  
  const finalValue = baseValue + 
    (timeVariations[timeOfDay] || 0) + 
    (mealVariations[mealContext] || 0) + 
    randomVariation;
  
  return Math.max(70, Math.min(300, Math.round(finalValue)));
}

function generateT1DMedicationData(medication, dayOffset, timeOfDay, glucoseLevel) {
  const adherence = Math.random() < 0.94; // 94% adherence (realistic for T1D)
  
  // Adjust insulin based on glucose levels
  let insulinDose = medication.baseDose;
  if (glucoseLevel > 200) {
    insulinDose += Math.floor((glucoseLevel - 200) / 50) * 2; // Correction dose
  } else if (glucoseLevel < 100) {
    insulinDose = Math.max(0, insulinDose - 1); // Reduce if low
  }
  
  return {
    taken: adherence,
    medication_name: medication.name,
    dosage: medication.dosage,
    insulin_units: medication.type === 'insulin' ? insulinDose : null,
    time_taken: adherence ? timeOfDay : null,
    glucose_level: glucoseLevel,
    correction_dose: glucoseLevel > 200 ? Math.floor((glucoseLevel - 200) / 50) * 2 : 0,
    notes: adherence ? 
      (glucoseLevel > 200 ? 'High glucose, took correction dose' : 
       glucoseLevel < 100 ? 'Low glucose, reduced dose' : 'Normal glucose') : 
      'Forgot to take'
  };
}

function generateT1DExerciseData(dayOffset, dayOfWeek, glucoseLevel) {
  // Exercise affects glucose differently for T1D
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const baseDuration = 25 + (dayOffset * 1.0);
  const weekendBonus = isWeekend ? 20 : 0;
  const duration = Math.max(15, Math.min(75, baseDuration + weekendBonus + (Math.random() - 0.5) * 15));
  
  // Adjust intensity based on glucose level
  let intensity = 3.0 + (dayOffset * 0.05);
  if (glucoseLevel > 250) {
    intensity = Math.min(5, intensity + 0.5); // Higher intensity if glucose is high
  } else if (glucoseLevel < 100) {
    intensity = Math.max(1, intensity - 0.8); // Lower intensity if glucose is low
  }
  
  const exerciseTypes = ['Cardio', 'Strength Training', 'Yoga', 'Walking', 'Swimming', 'Cycling', 'HIIT'];
  const type = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
  
  // Calculate expected glucose impact
  const glucoseImpact = Math.round((duration / 30) * (intensity / 3) * -15); // Exercise lowers glucose
  
  return {
    duration_minutes: Math.round(duration),
    intensity: Math.round(intensity * 10) / 10,
    type: type,
    calories_burned: Math.round(duration * (8 + Math.random() * 2)),
    heart_rate_avg: Math.round(125 + Math.random() * 35),
    steps: Math.round(duration * (90 + Math.random() * 30)),
    glucose_impact: glucoseImpact,
    pre_exercise_glucose: glucoseLevel,
    notes: glucoseLevel > 250 ? 'High glucose, good to exercise' : 
           glucoseLevel < 100 ? 'Low glucose, need snack first' : 'Normal glucose, good to go'
  };
}

function generateT1DMoodData(dayOffset, timeOfDay, glucoseLevel) {
  // Mood affected by glucose levels (realistic T1D experience)
  let baseMood = 3.2 + (dayOffset * 0.04);
  
  // Glucose level affects mood
  if (glucoseLevel > 300) {
    baseMood -= 0.8; // High glucose makes you feel bad
  } else if (glucoseLevel > 200) {
    baseMood -= 0.4; // Elevated glucose affects mood
  } else if (glucoseLevel < 70) {
    baseMood -= 1.2; // Low glucose significantly affects mood
  } else if (glucoseLevel < 100) {
    baseMood -= 0.3; // Slightly low glucose
  } else if (glucoseLevel >= 100 && glucoseLevel <= 150) {
    baseMood += 0.3; // Good glucose range feels great
  }
  
  const timeVariation = timeOfDay === 'morning' ? 0.2 : -0.1;
  const mood = Math.max(1, Math.min(5, baseMood + timeVariation + (Math.random() - 0.5) * 0.8));
  const energy = Math.max(1, Math.min(5, mood + (Math.random() - 0.5) * 0.6));
  const stress = Math.max(1, Math.min(5, 4.0 - mood + (glucoseLevel > 200 ? 0.5 : 0) + (Math.random() - 0.5) * 0.4));
  
  return {
    mood: Math.round(mood * 10) / 10,
    energy: Math.round(energy * 10) / 10,
    stress: Math.round(stress * 10) / 10,
    anxiety: Math.round((stress + (glucoseLevel > 250 ? 0.3 : 0)) * 10) / 10,
    diabetes_related_stress: Math.round((glucoseLevel > 200 ? 0.8 : 0.2) * 10) / 10,
    notes: glucoseLevel > 200 ? 'Feeling tired, glucose is high' : 
           glucoseLevel < 70 ? 'Feeling shaky, need to check glucose' : 
           'Feeling good, glucose is stable'
  };
}

async function updateUserProfile() {
  console.log('👤 Updating user profile for Type 1 Diabetes...');
  
  const profileData = {
    name: 'Alex Johnson',
    age: 24,
    gender: 'Non-binary',
    height_cm: 175,
    weight_kg: 70,
    blood_type: 'O+',
    emergency_contact: 'Sarah Johnson (555) 123-4567',
    medical_conditions: ['Type 1 Diabetes', 'Autoimmune Disease'],
    allergies: ['None known'],
    medications: ['Insulin Glargine', 'Insulin Lispro', 'Metformin'],
    diagnosis_date: '2020-03-15',
    last_hba1c: 7.2,
    target_glucose_range: '80-150 mg/dL',
    diabetes_type: 'Type 1',
    insulin_pump: false,
    cgm_device: 'Dexcom G6',
    endocrinologist: 'Dr. Maria Rodriguez',
    diabetes_educator: 'Jennifer Smith, RN, CDE',
    emergency_glucagon: true,
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update(profileData)
    .eq('id', TEST_USER_ID);
    
  if (error) {
    console.error('❌ Error updating profile:', error.message);
  } else {
    console.log('✅ Updated user profile for Type 1 Diabetes');
  }
}

async function updateHealthConditions() {
  console.log('🏥 Updating health conditions for Type 1 Diabetes...');
  
  // Clear existing conditions
  await supabaseAdmin
    .from('user_health_conditions')
    .delete()
    .eq('user_id', TEST_USER_ID);
  
  const conditions = [
    {
      user_id: TEST_USER_ID,
      condition_id: 't1d-primary',
      name: 'Type 1 Diabetes',
      category: 'Endocrine',
      description: 'Autoimmune condition where the pancreas produces little to no insulin',
      diagnosis_date: '2020-03-15',
      severity: 'Moderate',
      is_active: true,
      management_plan: 'Daily insulin therapy, blood glucose monitoring, carbohydrate counting',
      hba1c_target: '<7.0%',
      glucose_target_range: '80-150 mg/dL'
    },
    {
      user_id: TEST_USER_ID,
      condition_id: 'diabetes-complications',
      name: 'Diabetic Complications Risk',
      category: 'Complications',
      description: 'Risk of long-term complications from diabetes',
      diagnosis_date: '2020-03-15',
      severity: 'Low',
      is_active: true,
      management_plan: 'Regular monitoring, good glucose control, annual eye exams'
    }
  ];
  
  const { error } = await supabaseAdmin
    .from('user_health_conditions')
    .insert(conditions);
    
  if (error) {
    console.error('❌ Error updating conditions:', error.message);
  } else {
    console.log('✅ Updated health conditions for Type 1 Diabetes');
  }
}

async function updateMedications() {
  console.log('💊 Updating medications for Type 1 Diabetes...');
  
  // Clear existing medications
  await supabaseAdmin
    .from('medications')
    .delete()
    .eq('user_id', TEST_USER_ID);
  
  const medications = [
    {
      user_id: TEST_USER_ID,
      medication_name: 'Insulin Glargine (Lantus)',
      dosage: '24 units',
      frequency: 'Once daily',
      time_of_day: 'Evening',
      purpose: 'Basal insulin',
      side_effects: 'Hypoglycemia, injection site reactions',
      start_date: '2020-03-20',
      is_active: true
    },
    {
      user_id: TEST_USER_ID,
      medication_name: 'Insulin Lispro (Humalog)',
      dosage: 'Variable units',
      frequency: 'Before meals',
      time_of_day: 'Meal times',
      purpose: 'Bolus insulin for meals',
      side_effects: 'Hypoglycemia, injection site reactions',
      start_date: '2020-03-20',
      is_active: true
    },
    {
      user_id: TEST_USER_ID,
      medication_name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      time_of_day: 'Morning and evening',
      purpose: 'Insulin sensitivity',
      side_effects: 'Gastrointestinal upset',
      start_date: '2021-06-15',
      is_active: true
    }
  ];
  
  const { error } = await supabaseAdmin
    .from('medications')
    .insert(medications);
    
  if (error) {
    console.error('❌ Error updating medications:', error.message);
  } else {
    console.log('✅ Updated medications for Type 1 Diabetes');
  }
}

async function generateT1DGlucoseData() {
  console.log('🩸 Generating realistic T1D glucose data...');
  
  // Clear existing glucose data
  await supabaseAdmin
    .from('tracking_entries')
    .delete()
    .eq('user_id', TEST_USER_ID)
    .eq('tool_id', 'glucose-tracker');
  
  const glucoseEntries = [];
  const daysToGenerate = 45;
  
  // Define T1D medications
  const t1dMedications = [
    { name: 'Insulin Glargine', dosage: '24 units', type: 'insulin', baseDose: 24 },
    { name: 'Insulin Lispro', dosage: 'Variable', type: 'insulin', baseDose: 8 },
    { name: 'Metformin', dosage: '500mg', type: 'oral', baseDose: 500 }
  ];
  
  for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(REFERENCE_DATE);
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay();
    
    // Determine if this is a spike day (realistic T1D experience)
    const isSpikeDay = Math.random() < 0.25; // 25% chance of spike day
    
    // T1D glucose monitoring pattern (more frequent)
    const glucoseTimes = [
      { time: 'morning', hour: 7, minute: 0, context: 'fasting' },
      { time: 'morning', hour: 9, minute: 30, context: 'post-breakfast' },
      { time: 'afternoon', hour: 12, minute: 0, context: 'pre-lunch' },
      { time: 'afternoon', hour: 14, minute: 30, context: 'post-lunch' },
      { time: 'evening', hour: 18, minute: 0, context: 'pre-dinner' },
      { time: 'evening', hour: 20, minute: 30, context: 'post-dinner' },
      { time: 'night', hour: 22, minute: 0, context: 'bedtime' }
    ];
    
    glucoseTimes.forEach(({ time, hour, minute, context }) => {
      const entryTime = new Date(date);
      entryTime.setHours(hour, minute + Math.floor(Math.random() * 30), 0, 0);
      
      const glucoseLevel = generateT1DGlucoseValue(dayOffset, time, context, isSpikeDay);
      
      glucoseEntries.push({
        user_id: TEST_USER_ID,
        tool_id: 'glucose-tracker',
        data: {
          glucose_level: glucoseLevel,
          unit: 'mg/dL',
          time_of_day: time,
          meal_context: context,
          is_spike: isSpikeDay && glucoseLevel > 200,
          target_range: '80-150',
          notes: glucoseLevel > 200 ? 'High glucose, need correction' : 
                 glucoseLevel < 70 ? 'Low glucose, need treatment' : 
                 glucoseLevel >= 80 && glucoseLevel <= 150 ? 'In target range' : 
                 'Outside target range'
        },
        timestamp: entryTime.toISOString(),
        created_at: entryTime.toISOString()
      });
    });
  }
  
  // Insert glucose data
  const batchSize = 100;
  for (let i = 0; i < glucoseEntries.length; i += batchSize) {
    const batch = glucoseEntries.slice(i, i + batchSize);
    const { error } = await supabaseAdmin
      .from('tracking_entries')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting glucose batch ${Math.floor(i/batchSize) + 1}:`, error.message);
    } else {
      console.log(`   ✅ Inserted glucose batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(glucoseEntries.length/batchSize)}`);
    }
  }
  
  return glucoseEntries.length;
}

async function generateT1DMedicationData() {
  console.log('💉 Generating T1D medication tracking data...');
  
  // Clear existing medication data
  await supabaseAdmin
    .from('tracking_entries')
    .delete()
    .eq('user_id', TEST_USER_ID)
    .eq('tool_id', 'medication-tracker');
  
  const medicationEntries = [];
  const daysToGenerate = 45;
  
  const t1dMedications = [
    { name: 'Insulin Glargine', dosage: '24 units', type: 'insulin', baseDose: 24 },
    { name: 'Insulin Lispro', dosage: 'Variable', type: 'insulin', baseDose: 8 },
    { name: 'Metformin', dosage: '500mg', type: 'oral', baseDose: 500 }
  ];
  
  for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(REFERENCE_DATE);
    date.setDate(date.getDate() - dayOffset);
    
    // T1D medication schedule
    const medicationTimes = [
      { time: 'morning', hour: 8, minute: 0, meds: ['Insulin Lispro', 'Metformin'] },
      { time: 'afternoon', hour: 12, minute: 0, meds: ['Insulin Lispro'] },
      { time: 'evening', hour: 18, minute: 0, meds: ['Insulin Lispro'] },
      { time: 'night', hour: 22, minute: 0, meds: ['Insulin Glargine', 'Metformin'] }
    ];
    
    medicationTimes.forEach(({ time, hour, minute, meds }) => {
      meds.forEach(medName => {
        const entryTime = new Date(date);
        entryTime.setHours(hour, minute + Math.floor(Math.random() * 30), 0, 0);
        
        const medication = t1dMedications.find(m => m.name === medName);
        const glucoseLevel = generateT1DGlucoseValue(dayOffset, time, 'pre-meal', Math.random() < 0.25);
        const medData = generateT1DMedicationData(medication, dayOffset, time, glucoseLevel);
        
        medicationEntries.push({
          user_id: TEST_USER_ID,
          tool_id: 'medication-tracker',
          data: medData,
          timestamp: entryTime.toISOString(),
          created_at: entryTime.toISOString()
        });
      });
    });
  }
  
  // Insert medication data
  const batchSize = 100;
  for (let i = 0; i < medicationEntries.length; i += batchSize) {
    const batch = medicationEntries.slice(i, i + batchSize);
    const { error } = await supabaseAdmin
      .from('tracking_entries')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting medication batch ${Math.floor(i/batchSize) + 1}:`, error.message);
    } else {
      console.log(`   ✅ Inserted medication batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(medicationEntries.length/batchSize)}`);
    }
  }
  
  return medicationEntries.length;
}

async function generateT1DMoodAndExerciseData() {
  console.log('💪 Generating T1D mood and exercise data...');
  
  // Clear existing mood and exercise data
  await supabaseAdmin
    .from('tracking_entries')
    .delete()
    .eq('user_id', TEST_USER_ID)
    .in('tool_id', ['mood-tracker', 'exercise-tracker']);
  
  const moodExerciseEntries = [];
  const daysToGenerate = 45;
  
  for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(REFERENCE_DATE);
    date.setDate(date.getDate() - dayOffset);
    const dayOfWeek = date.getDay();
    
    // Get current glucose level for context
    const currentGlucose = generateT1DGlucoseValue(dayOffset, 'afternoon', 'pre-meal', Math.random() < 0.25);
    
    // Mood tracking (morning and evening)
    ['morning', 'evening'].forEach(time => {
      const entryTime = new Date(date);
      entryTime.setHours(time === 'morning' ? 9 : 20, Math.floor(Math.random() * 60), 0, 0);
      
      const moodData = generateT1DMoodData(dayOffset, time, currentGlucose);
      
      moodExerciseEntries.push({
        user_id: TEST_USER_ID,
        tool_id: 'mood-tracker',
        data: moodData,
        timestamp: entryTime.toISOString(),
        created_at: entryTime.toISOString()
      });
    });
    
    // Exercise tracking (evening)
    const exerciseTime = new Date(date);
    exerciseTime.setHours(17, Math.floor(Math.random() * 60), 0, 0);
    
    const exerciseData = generateT1DExerciseData(dayOffset, dayOfWeek, currentGlucose);
    
    moodExerciseEntries.push({
      user_id: TEST_USER_ID,
      tool_id: 'exercise-tracker',
      data: exerciseData,
      timestamp: exerciseTime.toISOString(),
      created_at: exerciseTime.toISOString()
    });
  }
  
  // Insert mood and exercise data
  const batchSize = 100;
  for (let i = 0; i < moodExerciseEntries.length; i += batchSize) {
    const batch = moodExerciseEntries.slice(i, i + batchSize);
    const { error } = await supabaseAdmin
      .from('tracking_entries')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error inserting mood/exercise batch ${Math.floor(i/batchSize) + 1}:`, error.message);
    } else {
      console.log(`   ✅ Inserted mood/exercise batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(moodExerciseEntries.length/batchSize)}`);
    }
  }
  
  return moodExerciseEntries.length;
}

async function main() {
  try {
    console.log(`\n🩸 Setting up Type 1 Diabetes profile and data...`);
    
    // Update profile and conditions
    await updateUserProfile();
    await updateHealthConditions();
    await updateMedications();
    
    // Generate T1D-specific data
    const glucoseCount = await generateT1DGlucoseData();
    const medicationCount = await generateT1DMedicationData();
    const moodExerciseCount = await generateT1DMoodAndExerciseData();
    
    console.log('\n🎉 Type 1 Diabetes profile setup complete!');
    console.log('==========================================');
    console.log(`📊 Generated T1D-specific data:`);
    console.log(`   - ${glucoseCount} glucose readings (7 per day)`);
    console.log(`   - ${medicationCount} medication entries (4 per day)`);
    console.log(`   - ${moodExerciseCount} mood & exercise entries`);
    console.log(`   - Realistic glucose spikes and stability patterns`);
    console.log(`   - T1D-appropriate medications and tracking`);
    console.log(`\n🎬 Perfect for T1D demo!`);
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






