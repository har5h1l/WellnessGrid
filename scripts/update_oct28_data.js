#!/usr/bin/env node

/**
 * Update Data for October 28, 2025
 * 
 * This script updates the T1D demo data to be ready for October 28, 2025.
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
const REFERENCE_DATE = new Date('2025-10-28T12:00:00Z'); // October 28th, 2025

console.log('📅 October 28, 2025 Data Updater');
console.log('=================================');
console.log(`🎯 Reference Date: ${REFERENCE_DATE.toLocaleDateString()}`);

async function updateDataForOct28() {
  console.log('📅 Updating data for October 28, 2025...');
  
  try {
    // Clear existing glucose data
    console.log('🗑️  Clearing existing glucose data...');
    await supabaseAdmin
      .from('tracking_entries')
      .delete()
      .eq('user_id', TEST_USER_ID)
      .eq('tool_id', 'glucose-tracker');
    
    console.log('🩸 Generating glucose data for October 28, 2025...');
    
    const glucoseEntries = [];
    const daysToGenerate = 30; // 30 days leading up to Oct 28
    
    for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
      const date = new Date(REFERENCE_DATE);
      date.setDate(date.getDate() - dayOffset);
      
      // Determine if this is a spike day (25% chance)
      const isSpikeDay = Math.random() < 0.25;
      
      // T1D glucose monitoring pattern (7 times per day)
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
        
        // Generate realistic T1D glucose values
        let baseValue = 160 - (dayOffset * 2.0); // Improving over time
        
        // Time of day variations
        const timeVariations = {
          'morning': 20,    // Dawn phenomenon
          'afternoon': -15, // Usually lower
          'evening': 10,    // Slightly higher
          'night': -5       // Usually lowest
        };
        
        // Meal context variations
        const mealVariations = {
          'fasting': -25,
          'pre-meal': 0,
          'post-meal': 50,  // Post-meal spikes
          'post-snack': 30,
          'bedtime': -10
        };
        
        // Add spike days
        if (isSpikeDay) {
          baseValue += 60 + Math.random() * 40; // 60-100 mg/dL higher on spike days
        }
        
        const glucoseLevel = Math.max(70, Math.min(300, Math.round(
          baseValue + 
          (timeVariations[time] || 0) + 
          (mealVariations[context] || 0) + 
          (Math.random() - 0.5) * 30
        )));
        
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
    
    // Insert glucose data in batches
    console.log(`📥 Inserting ${glucoseEntries.length} glucose readings...`);
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
    
    // Generate other health tracking data
    console.log('💊 Generating medication tracking data...');
    const medicationEntries = [];
    
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
          
          const adherence = Math.random() < 0.94; // 94% adherence
          
          medicationEntries.push({
            user_id: TEST_USER_ID,
            tool_id: 'medication-tracker',
            data: {
              taken: adherence,
              medication_name: medName,
              dosage: medName.includes('Insulin') ? 'Variable units' : '500mg',
              time_taken: adherence ? time : null,
              notes: adherence ? (Math.random() < 0.15 ? 'No side effects' : '') : 'Forgot to take'
            },
            timestamp: entryTime.toISOString(),
            created_at: entryTime.toISOString()
          });
        });
      });
    }
    
    // Insert medication data
    console.log(`📥 Inserting ${medicationEntries.length} medication entries...`);
    const medBatchSize = 100;
    for (let i = 0; i < medicationEntries.length; i += medBatchSize) {
      const batch = medicationEntries.slice(i, i + medBatchSize);
      const { error } = await supabaseAdmin
        .from('tracking_entries')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting medication batch ${Math.floor(i/medBatchSize) + 1}:`, error.message);
      } else {
        console.log(`   ✅ Inserted medication batch ${Math.floor(i/medBatchSize) + 1}/${Math.ceil(medicationEntries.length/medBatchSize)}`);
      }
    }
    
    console.log('\n🎉 October 28, 2025 data update complete!');
    console.log('==========================================');
    console.log(`📊 Generated data:`);
    console.log(`   - ${glucoseEntries.length} glucose readings (7 per day)`);
    console.log(`   - ${medicationEntries.length} medication entries (4 per day)`);
    console.log(`   - 30 days leading up to October 28, 2025`);
    console.log(`   - Realistic T1D patterns with spikes and stability`);
    console.log(`\n🎬 Perfect for October 28, 2025 demo!`);
    console.log(`🔑 Login: 28hshah@gmail.com / Test123!`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

if (require.main === module) {
  updateDataForOct28();
}
