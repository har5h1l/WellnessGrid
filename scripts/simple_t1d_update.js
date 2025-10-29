#!/usr/bin/env node

/**
 * Simple Type 1 Diabetes Profile Update
 * Updates user profile and configures medication tool for T1D patient
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

console.log('🩸 Simple Type 1 Diabetes Profile Update');
console.log('==========================================');

async function updateUserProfile() {
  console.log('👤 Updating user profile for Type 1 Diabetes...');
  
  const profileData = {
    name: 'Alex Johnson',
    age: '24',
    gender: 'Non-binary',
    height: '175 cm',
    weight: '70 kg',
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
  console.log('🏥 Updating health conditions...');
  
  // Clear existing conditions
  await supabaseAdmin
    .from('health_conditions')
    .delete()
    .eq('user_id', TEST_USER_ID);
  
  const conditions = [
    {
      user_id: TEST_USER_ID,
      condition_id: 'diabetes1',
      name: 'Type 1 Diabetes',
      category: 'Endocrine',
      description: 'Autoimmune condition where the pancreas produces little or no insulin',
      severity: 'moderate',
      diagnosed_date: '2020-03-15',
      is_active: true,
      is_custom: false,
      icon: '🩸',
      notes: 'Well-controlled with insulin therapy'
    }
  ];
  
  const { error } = await supabaseAdmin
    .from('health_conditions')
    .insert(conditions);
    
  if (error) {
    console.error('❌ Error updating conditions:', error.message);
  } else {
    console.log('✅ Updated health conditions');
  }
}

async function updateUserTools() {
  console.log('🔧 Configuring user tools for Type 1 Diabetes...');
  
  // Clear existing tools
  await supabaseAdmin
    .from('user_tools')
    .delete()
    .eq('user_id', TEST_USER_ID);
  
  const tools = [
    {
      user_id: TEST_USER_ID,
      tool_id: 'glucose-tracker',
      tool_name: 'Glucose Monitoring',
      tool_category: 'diabetes',
      is_enabled: true,
      settings: {
        notifications: true,
        reminderTimes: ['07:00', '12:00', '18:00', '22:00'],
        targetRange: { min: 80, max: 150 },
        highAlert: 200,
        lowAlert: 70
      }
    },
    {
      user_id: TEST_USER_ID,
      tool_id: 'medication-reminder',
      tool_name: 'Medication Tracker',
      tool_category: 'medication',
      is_enabled: true,
      settings: {
        notifications: true,
        reminderTimes: ['08:00', '12:00', '18:00', '22:00'],
        medications: [
          {
            id: '1',
            name: 'Insulin Glargine (Lantus)',
            dosage: '24 units',
            frequency: 'Once daily',
            time: '22:00',
            purpose: 'Basal insulin',
            isActive: true
          },
          {
            id: '2',
            name: 'Insulin Lispro (Humalog)',
            dosage: 'Variable units',
            frequency: 'Before meals',
            time: 'Meal times',
            purpose: 'Bolus insulin',
            isActive: true
          },
          {
            id: '3',
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            time: '08:00, 20:00',
            purpose: 'Insulin sensitivity',
            isActive: true
          }
        ]
      }
    },
    {
      user_id: TEST_USER_ID,
      tool_id: 'mood-tracker',
      tool_name: 'Mood Tracker',
      tool_category: 'mental_health',
      is_enabled: true,
      settings: {
        notifications: true,
        reminderTimes: ['09:00', '21:00']
      }
    },
    {
      user_id: TEST_USER_ID,
      tool_id: 'symptom-tracker',
      tool_name: 'Symptom Tracker',
      tool_category: 'symptoms',
      is_enabled: true,
      settings: {
        notifications: true,
        reminderTimes: ['19:00']
      }
    }
  ];
  
  const { error } = await supabaseAdmin
    .from('user_tools')
    .insert(tools);
    
  if (error) {
    console.error('❌ Error updating tools:', error.message);
  } else {
    console.log('✅ Updated user tools for Type 1 Diabetes');
  }
}

async function main() {
  try {
    await updateUserProfile();
    await updateHealthConditions();
    await updateUserTools();
    
    console.log('\n🎉 Type 1 Diabetes profile setup complete!');
    console.log('📱 User: Alex Johnson (28hshah@gmail.com)');
    console.log('🩸 Condition: Type 1 Diabetes');
    console.log('💊 Medications: Insulin Glargine, Insulin Lispro, Metformin');
    console.log('🔧 Tools: Glucose Tracker, Medication Reminder, Mood Tracker, Symptom Tracker');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

