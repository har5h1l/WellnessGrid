#!/usr/bin/env node

/**
 * Synthetic Data Generator for WellnessGrid Test User
 * This script connects to Supabase and generates comprehensive health data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const TEST_USER_ID = '69478d34-90bd-476f-b47a-7d099c1cb913';

console.log('🔧 WellnessGrid Synthetic Data Generator');
console.log('==========================================');

async function checkTestUser() {
    console.log('\n🔍 Checking existing test user data...');
    
    try {
        // Check if user exists in auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(TEST_USER_ID);
        
        if (authError) {
            console.log('⚠️  Test user not found in auth.users');
            console.log('   We need to create the user first');
            return null;
        }

        console.log('✅ Test user found in auth.users:');
        console.log(`   Email: ${authUser.user.email || 'Not set'}`);
        console.log(`   Created: ${authUser.user.created_at}`);
        
        // Check profile data
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', TEST_USER_ID)
            .single();
            
        if (profileError) {
            console.log('⚠️  No profile data found');
        } else {
            console.log('✅ Profile data exists:');
            console.log(`   Name: ${profile.name}`);
            console.log(`   Wellness Score: ${profile.wellness_score}`);
        }
        
        return authUser.user;
    } catch (error) {
        console.error('❌ Error checking test user:', error.message);
        return null;
    }
}

async function createTestUser() {
    console.log('\n👤 Creating test user...');
    
    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'testuser@wellnessgrid.dev',
            password: 'TestUser123!',
            email_confirm: true,
            user_metadata: {
                name: 'Test User'
            }
        });
        
        if (error) {
            console.error('❌ Error creating user:', error.message);
            return null;
        }
        
        console.log('✅ Test user created successfully');
        console.log(`   Email: testuser@wellnessgrid.dev`);
        console.log(`   Password: TestUser123!`);
        console.log(`   User ID: ${data.user.id}`);
        
        return data.user;
    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
        return null;
    }
}

async function generateProfile(userId) {
    console.log('\n👤 Generating user profile...');
    
    const profileData = {
        id: userId,
        name: 'Test User',
        age: '28',
        gender: 'non-binary',
        height: '5\'8"',
        weight: '165 lbs',
        wellness_score: 73,
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData);
        
    if (error) {
        console.error('❌ Error creating profile:', error.message);
        return false;
    }
    
    console.log('✅ User profile created');
    return true;
}

async function generateHealthConditions(userId) {
    console.log('\n🏥 Generating health conditions...');
    
    const conditions = [
        {
            user_id: userId,
            condition_id: 'type2_diabetes',
            name: 'Type 2 Diabetes',
            category: 'Endocrine',
            description: 'Managing blood sugar levels with diet and medication',
            severity: 'moderate',
            diagnosed_date: '2022-03-15',
            is_active: true,
            is_custom: false,
            icon: '🩸',
            notes: 'Well controlled with metformin and lifestyle changes'
        },
        {
            user_id: userId,
            condition_id: 'anxiety',
            name: 'Generalized Anxiety Disorder',
            category: 'Mental Health',
            description: 'Chronic anxiety affecting daily activities',
            severity: 'mild',
            diagnosed_date: '2021-08-20',
            is_active: true,
            is_custom: false,
            icon: '🧠',
            notes: 'Managing with therapy and mindfulness practices'
        },
        {
            user_id: userId,
            condition_id: 'hypertension',
            name: 'Essential Hypertension',
            category: 'Cardiovascular',
            description: 'High blood pressure requiring monitoring',
            severity: 'mild',
            diagnosed_date: '2023-01-10',
            is_active: true,
            is_custom: false,
            icon: '❤️',
            notes: 'Controlled with ACE inhibitor and low sodium diet'
        }
    ];
    
    const { error } = await supabase
        .from('health_conditions')
        .upsert(conditions);
        
    if (error) {
        console.error('❌ Error creating health conditions:', error.message);
        return false;
    }
    
    console.log(`✅ Generated ${conditions.length} health conditions`);
    return true;
}

async function generateTools(userId) {
    console.log('\n🔧 Generating user tools...');
    
    const tools = [
        {
            user_id: userId,
            tool_id: 'glucose-tracker',
            tool_name: 'Blood Glucose Tracker',
            tool_category: 'health-monitoring',
            is_enabled: true,
            settings: {
                reminderTimes: ['08:00', '14:00', '20:00'],
                targetRange: { min: 80, max: 180 },
                notifications: true
            }
        },
        {
            user_id: userId,
            tool_id: 'mood-tracker',
            tool_name: 'Mood Tracker',
            tool_category: 'mental-health',
            is_enabled: true,
            settings: {
                reminderTimes: ['10:00', '18:00'],
                notifications: true
            }
        },
        {
            user_id: userId,
            tool_id: 'sleep-tracker',
            tool_name: 'Sleep Tracker',
            tool_category: 'lifestyle',
            is_enabled: true,
            settings: {
                bedtimeReminder: '22:00',
                wakeUpTime: '07:00',
                notifications: true
            }
        },
        {
            user_id: userId,
            tool_id: 'medication-logger',
            tool_name: 'Medication Logger',
            tool_category: 'medication',
            is_enabled: true,
            settings: {
                notifications: true,
                adherenceTracking: true
            }
        },
        {
            user_id: userId,
            tool_id: 'blood-pressure-monitor',
            tool_name: 'Blood Pressure Monitor',
            tool_category: 'health-monitoring',
            is_enabled: true,
            settings: {
                reminderTimes: ['08:00', '20:00'],
                targetRange: { systolic: 120, diastolic: 80 },
                notifications: true
            }
        }
    ];
    
    const { error } = await supabase
        .from('user_tools')
        .upsert(tools);
        
    if (error) {
        console.error('❌ Error creating tools:', error.message);
        return false;
    }
    
    console.log(`✅ Generated ${tools.length} user tools`);
    return true;
}

async function generateMedications(userId) {
    console.log('\n💊 Generating medications...');
    
    const medications = [
        {
            user_id: userId,
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            time_slots: ['08:00', '20:00'],
            adherence: 92,
            side_effects: ['Mild nausea', 'Stomach upset'],
            is_active: true
        },
        {
            user_id: userId,
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            time_slots: ['08:00'],
            adherence: 96,
            side_effects: [],
            is_active: true
        },
        {
            user_id: userId,
            name: 'Sertraline',
            dosage: '50mg',
            frequency: 'Once daily',
            time_slots: ['20:00'],
            adherence: 89,
            side_effects: ['Mild drowsiness'],
            is_active: true
        }
    ];
    
    const { error } = await supabase
        .from('medications')
        .upsert(medications);
        
    if (error) {
        console.error('❌ Error creating medications:', error.message);
        return false;
    }
    
    console.log(`✅ Generated ${medications.length} medications`);
    return true;
}

async function generateTrackingEntries(userId) {
    console.log('\n📊 Generating tracking entries (last 30 days)...');
    
    const entries = [];
    const now = new Date();
    
    // Generate 30 days of data
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Glucose readings (3 per day)
        const morningGlucose = 85 + Math.random() * 30;
        const afternoonGlucose = 95 + Math.random() * 40;
        const eveningGlucose = 90 + Math.random() * 35;
        
        entries.push(
            {
                user_id: userId,
                tool_id: 'glucose-tracker',
                data: {
                    value: Math.round(morningGlucose),
                    unit: 'mg/dL',
                    meal_relation: 'fasting',
                    notes: 'Morning reading'
                },
                timestamp: new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString()
            },
            {
                user_id: userId,
                tool_id: 'glucose-tracker',
                data: {
                    value: Math.round(afternoonGlucose),
                    unit: 'mg/dL',
                    meal_relation: 'post_meal',
                    notes: 'After lunch'
                },
                timestamp: new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString()
            },
            {
                user_id: userId,
                tool_id: 'glucose-tracker',
                data: {
                    value: Math.round(eveningGlucose),
                    unit: 'mg/dL',
                    meal_relation: 'post_meal',
                    notes: 'Evening reading'
                },
                timestamp: new Date(date.getTime() + 20 * 60 * 60 * 1000).toISOString()
            }
        );
        
        // Mood entries (2 per day)
        const moods = ['very-sad', 'sad', 'neutral', 'happy', 'very-happy'];
        const morningMood = moods[Math.floor(Math.random() * moods.length)];
        const eveningMood = moods[Math.floor(Math.random() * moods.length)];
        
        entries.push(
            {
                user_id: userId,
                tool_id: 'mood-tracker',
                data: {
                    mood: morningMood,
                    energy: Math.floor(Math.random() * 5) + 1,
                    stress: Math.floor(Math.random() * 5) + 1,
                    notes: 'Morning check-in',
                    activities: ['work', 'exercise']
                },
                timestamp: new Date(date.getTime() + 10 * 60 * 60 * 1000).toISOString()
            },
            {
                user_id: userId,
                tool_id: 'mood-tracker',
                data: {
                    mood: eveningMood,
                    energy: Math.floor(Math.random() * 5) + 1,
                    stress: Math.floor(Math.random() * 5) + 1,
                    notes: 'Evening reflection',
                    activities: ['relaxation', 'social']
                },
                timestamp: new Date(date.getTime() + 18 * 60 * 60 * 1000).toISOString()
            }
        );
        
        // Sleep data (1 per day)
        const sleepHours = 6.5 + Math.random() * 2; // 6.5-8.5 hours
        entries.push({
            user_id: userId,
            tool_id: 'sleep-tracker',
            data: {
                duration: Math.round(sleepHours * 10) / 10,
                quality: Math.floor(Math.random() * 5) + 1,
                bedtime: '22:30',
                wake_time: '07:00',
                notes: 'Good sleep'
            },
            timestamp: new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString()
        });
        
        // Blood pressure (2 per day)
        const systolic = 115 + Math.random() * 20;
        const diastolic = 70 + Math.random() * 15;
        
        entries.push(
            {
                user_id: userId,
                tool_id: 'blood-pressure-monitor',
                data: {
                    systolic: Math.round(systolic),
                    diastolic: Math.round(diastolic),
                    pulse: Math.round(65 + Math.random() * 20),
                    notes: 'Morning reading'
                },
                timestamp: new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString()
            },
            {
                user_id: userId,
                tool_id: 'blood-pressure-monitor',
                data: {
                    systolic: Math.round(systolic + Math.random() * 10 - 5),
                    diastolic: Math.round(diastolic + Math.random() * 10 - 5),
                    pulse: Math.round(70 + Math.random() * 20),
                    notes: 'Evening reading'
                },
                timestamp: new Date(date.getTime() + 20 * 60 * 60 * 1000).toISOString()
            }
        );
    }
    
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const { error } = await supabase
            .from('tracking_entries')
            .upsert(batch);
            
        if (error) {
            console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
            return false;
        }
    }
    
    console.log(`✅ Generated ${entries.length} tracking entries`);
    return true;
}

async function generateMedicationLogs(userId) {
    console.log('\n💊 Generating medication logs...');
    
    // Get medications first
    const { data: medications, error: medError } = await supabase
        .from('medications')
        .select('id')
        .eq('user_id', userId);
        
    if (medError || !medications.length) {
        console.error('❌ No medications found to generate logs for');
        return false;
    }
    
    const logs = [];
    const now = new Date();
    
    // Generate 30 days of medication logs
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        medications.forEach(med => {
            // Most days taken (90% adherence)
            const taken = Math.random() > 0.1;
            
            logs.push({
                user_id: userId,
                medication_id: med.id,
                date: date.toISOString().split('T')[0],
                time: '08:00',
                taken: taken,
                notes: taken ? 'Taken as scheduled' : 'Missed dose',
                side_effects: taken && Math.random() > 0.9 ? ['Mild nausea'] : []
            });
        });
    }
    
    const { error } = await supabase
        .from('medication_logs')
        .upsert(logs);
        
    if (error) {
        console.error('❌ Error creating medication logs:', error.message);
        return false;
    }
    
    console.log(`✅ Generated ${logs.length} medication logs`);
    return true;
}

async function generateGoals(userId) {
    console.log('\n🎯 Generating health goals...');
    
    const goals = [
        {
            user_id: userId,
            title: 'Maintain HbA1c below 7%',
            description: 'Keep diabetes well controlled with target HbA1c under 7%',
            target_value: 7.0,
            current_value: 6.8,
            unit: '%',
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            completed: false,
            progress: 85
        },
        {
            user_id: userId,
            title: 'Exercise 150 minutes per week',
            description: 'Meet WHO guidelines for physical activity',
            target_value: 150,
            current_value: 120,
            unit: 'minutes',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            completed: false,
            progress: 80
        },
        {
            user_id: userId,
            title: 'Sleep 7-8 hours nightly',
            description: 'Maintain consistent sleep schedule for better health',
            target_value: 7.5,
            current_value: 7.2,
            unit: 'hours',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            completed: false,
            progress: 90
        }
    ];
    
    const { error } = await supabase
        .from('user_goals')
        .upsert(goals);
        
    if (error) {
        console.error('❌ Error creating goals:', error.message);
        return false;
    }
    
    console.log(`✅ Generated ${goals.length} health goals`);
    return true;
}

async function generateSettings(userId) {
    console.log('\n⚙️ Generating user settings...');
    
    const settings = {
        user_id: userId,
        notifications_enabled: true,
        reminder_frequency: 'daily',
        theme: 'light',
        language: 'en',
        privacy_settings: {
            shareWithProviders: true,
            allowAnalytics: true,
            exportEnabled: true
        }
    };
    
    const { error } = await supabase
        .from('user_settings')
        .upsert(settings);
        
    if (error) {
        console.error('❌ Error creating settings:', error.message);
        return false;
    }
    
    console.log('✅ Generated user settings');
    return true;
}

async function main() {
    try {
        // Check if test user exists
        let user = await checkTestUser();
        
        if (!user) {
            // Create test user if doesn't exist
            user = await createTestUser();
            if (!user) {
                process.exit(1);
            }
        }
        
        const userId = TEST_USER_ID;
        
        console.log('\n🎲 Generating synthetic data...');
        
        // Generate all data
        await generateProfile(userId);
        await generateHealthConditions(userId);
        await generateTools(userId);
        await generateMedications(userId);
        await generateTrackingEntries(userId);
        await generateMedicationLogs(userId);
        await generateGoals(userId);
        await generateSettings(userId);
        
        console.log('\n🎉 Synthetic data generation complete!');
        console.log('\n📋 Test User Credentials:');
        console.log('   Email: testuser@wellnessgrid.dev');
        console.log('   Password: TestUser123!');
        console.log(`   User ID: ${userId}`);
        console.log('\n✨ Your WellnessGrid app now has comprehensive test data!');
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    checkTestUser,
    createTestUser,
    generateProfile,
    generateHealthConditions,
    generateTools,
    generateMedications,
    generateTrackingEntries,
    generateMedicationLogs,
    generateGoals,
    generateSettings
};


