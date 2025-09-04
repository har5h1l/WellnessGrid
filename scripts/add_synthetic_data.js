#!/usr/bin/env node

/**
 * Synthetic Data Generator for WellnessGrid Test User
 * 
 * This script adds realistic synthetic health tracking data to the test user
 * to properly test the insights page and analytics features.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

const TEST_USER_ID = '69478d34-90bd-476f-b47a-7d099c1cb913'

console.log('🔬 WellnessGrid Synthetic Data Generator')
console.log('='.repeat(50))

// Generate realistic data patterns
function generateGlucoseReading(baseValue = 120, trend = 'stable', dayOffset = 0) {
    const variations = {
        stable: () => baseValue + (Math.random() - 0.5) * 20,
        improving: () => baseValue - (dayOffset * 2) + (Math.random() - 0.5) * 15,
        declining: () => baseValue + (dayOffset * 3) + (Math.random() - 0.5) * 25
    }
    return Math.max(70, Math.min(200, Math.round(variations[trend]() || variations.stable())))
}

function generateMoodScore(baseValue = 7, trend = 'stable', dayOffset = 0) {
    const variations = {
        stable: () => baseValue + (Math.random() - 0.5) * 2,
        improving: () => Math.min(10, baseValue + (dayOffset * 0.2) + (Math.random() - 0.5) * 1.5),
        declining: () => Math.max(1, baseValue - (dayOffset * 0.3) + (Math.random() - 0.5) * 2)
    }
    return Math.max(1, Math.min(10, Math.round(variations[trend]() || variations.stable())))
}

function generateSleepHours(baseValue = 7.5, trend = 'stable', dayOffset = 0) {
    const variations = {
        stable: () => baseValue + (Math.random() - 0.5) * 1.5,
        improving: () => Math.min(9, baseValue + (dayOffset * 0.1) + (Math.random() - 0.5) * 1),
        declining: () => Math.max(4, baseValue - (dayOffset * 0.15) + (Math.random() - 0.5) * 2)
    }
    return Math.max(4, Math.min(12, Math.round(variations[trend]() * 10) / 10))
}

function generateBloodPressure(systolicBase = 130, trend = 'stable', dayOffset = 0) {
    const variations = {
        stable: () => systolicBase + (Math.random() - 0.5) * 15,
        improving: () => Math.max(90, systolicBase - (dayOffset * 1.5) + (Math.random() - 0.5) * 10),
        declining: () => Math.min(180, systolicBase + (dayOffset * 2) + (Math.random() - 0.5) * 20)
    }
    const systolic = Math.round(variations[trend]() || variations.stable())
    const diastolic = Math.round(systolic * 0.67) // Typical ratio
    return { systolic, diastolic }
}

function generateWeight(baseValue = 75.5, trend = 'stable', dayOffset = 0) {
    const variations = {
        stable: () => baseValue + (Math.random() - 0.5) * 0.8,
        improving: () => Math.max(60, baseValue - (dayOffset * 0.1) + (Math.random() - 0.5) * 0.5),
        declining: () => Math.min(100, baseValue + (dayOffset * 0.15) + (Math.random() - 0.5) * 1)
    }
    return Math.round(variations[trend]() * 10) / 10
}

function generateExerciseDuration(baseValue = 35, trend = 'stable', dayOffset = 0) {
    const variations = {
        stable: () => baseValue + (Math.random() - 0.5) * 20,
        improving: () => Math.min(120, baseValue + (dayOffset * 2) + (Math.random() - 0.5) * 15),
        declining: () => Math.max(0, baseValue - (dayOffset * 1.5) + (Math.random() - 0.5) * 25)
    }
    return Math.max(0, Math.round(variations[trend]() || variations.stable()))
}

async function generateSyntheticData() {
    try {
        console.log(`📊 Generating synthetic data for user: ${TEST_USER_ID}`)
        
        // Clear existing tracking entries for clean slate
        console.log('🗑️  Clearing existing tracking entries...')
        const { error: deleteError } = await supabase
            .from('tracking_entries')
            .delete()
            .eq('user_id', TEST_USER_ID)
        
        if (deleteError) {
            console.warn('Warning clearing old data:', deleteError.message)
        }

        const trackingEntries = []
        const daysToGenerate = 30 // Last 30 days
        
        // Define realistic trends for different metrics
        const trends = {
            'glucose-tracker': 'improving', // Glucose getting better
            'mood-tracker': 'stable',       // Mood is stable
            'sleep-tracker': 'improving',   // Sleep improving
            'blood-pressure-tracker': 'stable', // BP stable
            'weight-tracker': 'declining',  // Weight increasing (concerning)
            'exercise-tracker': 'improving', // Exercise increasing
            'medication-tracker': 'stable'   // Medication adherence stable
        }

        console.log('📈 Generating realistic health trends:')
        Object.entries(trends).forEach(([tool, trend]) => {
            console.log(`   ${tool}: ${trend}`)
        })
        console.log('')

        // Generate data for each day
        for (let dayOffset = daysToGenerate - 1; dayOffset >= 0; dayOffset--) {
            const date = new Date()
            date.setDate(date.getDate() - dayOffset)
            
            // Skip some days randomly to simulate real usage (not tracking every day)
            if (Math.random() < 0.15) continue // 15% chance to skip a day
            
            // Generate multiple entries per day for some metrics
            const entriesPerDay = {
                'glucose-tracker': Math.random() < 0.8 ? 2 + Math.floor(Math.random() * 2) : 0, // 2-3 times per day, 80% of days
                'mood-tracker': Math.random() < 0.6 ? 1 : 0, // Once per day, 60% of days
                'sleep-tracker': Math.random() < 0.9 ? 1 : 0, // Once per day, 90% of days
                'blood-pressure-tracker': Math.random() < 0.7 ? 1 + Math.floor(Math.random() * 2) : 0, // 1-2 times per day, 70% of days
                'weight-tracker': Math.random() < 0.5 ? 1 : 0, // Once per day, 50% of days
                'exercise-tracker': Math.random() < 0.4 ? 1 : 0, // Exercise 40% of days
                'medication-tracker': Math.random() < 0.85 ? 1 + Math.floor(Math.random() * 2) : 0 // 1-2 times per day, 85% adherence
            }

            Object.entries(entriesPerDay).forEach(([toolId, count]) => {
                for (let i = 0; i < count; i++) {
                    const entryTime = new Date(date)
                    
                    // Set realistic times for different activities
                    switch (toolId) {
                        case 'glucose-tracker':
                            // Before meals and bedtime
                            const glucoseTimes = [7, 12, 18, 22] // 7am, 12pm, 6pm, 10pm
                            entryTime.setHours(glucoseTimes[i % glucoseTimes.length] + Math.floor(Math.random() * 2 - 1))
                            break
                        case 'mood-tracker':
                            entryTime.setHours(10 + Math.floor(Math.random() * 8)) // 10am-6pm
                            break
                        case 'sleep-tracker':
                            entryTime.setHours(7 + Math.floor(Math.random() * 2)) // 7-9am (logging previous night)
                            break
                        case 'blood-pressure-tracker':
                            entryTime.setHours(8 + Math.floor(Math.random() * 12)) // 8am-8pm
                            break
                        case 'weight-tracker':
                            entryTime.setHours(6 + Math.floor(Math.random() * 3)) // 6-9am
                            break
                        case 'exercise-tracker':
                            entryTime.setHours(6 + Math.floor(Math.random() * 16)) // 6am-10pm
                            break
                        case 'medication-tracker':
                            const medTimes = [8, 20] // 8am, 8pm
                            entryTime.setHours(medTimes[i % medTimes.length] + Math.floor(Math.random() * 2 - 1))
                            break
                    }
                    
                    entryTime.setMinutes(Math.floor(Math.random() * 60))
                    entryTime.setSeconds(Math.floor(Math.random() * 60))

                    let data = {}
                    
                    // Generate realistic data based on tool type
                    switch (toolId) {
                        case 'glucose-tracker':
                            data = {
                                reading: generateGlucoseReading(120, trends[toolId], dayOffset),
                                meal_context: ['fasting', 'before_meal', 'after_meal', 'bedtime'][Math.floor(Math.random() * 4)],
                                notes: Math.random() < 0.3 ? 'Feeling good today' : ''
                            }
                            break
                            
                        case 'mood-tracker':
                            data = {
                                mood_score: generateMoodScore(7, trends[toolId], dayOffset),
                                energy_level: Math.floor(Math.random() * 10) + 1,
                                stress_level: Math.floor(Math.random() * 10) + 1,
                                notes: Math.random() < 0.4 ? 'Had a productive day' : ''
                            }
                            break
                            
                        case 'sleep-tracker':
                            data = {
                                hours: generateSleepHours(7.5, trends[toolId], dayOffset),
                                quality: Math.floor(Math.random() * 5) + 1,
                                notes: Math.random() < 0.2 ? 'Woke up refreshed' : ''
                            }
                            break
                            
                        case 'blood-pressure-tracker':
                            const bp = generateBloodPressure(130, trends[toolId], dayOffset)
                            data = {
                                systolic: bp.systolic,
                                diastolic: bp.diastolic,
                                pulse: 60 + Math.floor(Math.random() * 40),
                                notes: Math.random() < 0.1 ? 'Measured after rest' : ''
                            }
                            break
                            
                        case 'weight-tracker':
                            data = {
                                weight: generateWeight(75.5, trends[toolId], dayOffset),
                                unit: 'kg',
                                notes: Math.random() < 0.15 ? 'Morning weight' : ''
                            }
                            break
                            
                        case 'exercise-tracker':
                            const exercises = ['walking', 'running', 'cycling', 'gym', 'yoga', 'swimming']
                            data = {
                                duration: generateExerciseDuration(35, trends[toolId], dayOffset),
                                type: exercises[Math.floor(Math.random() * exercises.length)],
                                intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
                                notes: Math.random() < 0.3 ? 'Great workout session' : ''
                            }
                            break
                            
                        case 'medication-tracker':
                            data = {
                                taken: Math.random() < 0.9, // 90% adherence
                                medication_name: 'Metformin',
                                dosage: '500mg',
                                time_taken: entryTime.toTimeString().slice(0, 5),
                                notes: Math.random() < 0.1 ? 'No side effects' : ''
                            }
                            break
                    }

                    trackingEntries.push({
                        user_id: TEST_USER_ID,
                        tool_id: toolId,
                        data: data,
                        timestamp: entryTime.toISOString(),
                        created_at: entryTime.toISOString()
                    })
                }
            })
        }

        console.log(`📥 Inserting ${trackingEntries.length} tracking entries...`)
        
        // Insert in batches to avoid overwhelming the database
        const batchSize = 50
        for (let i = 0; i < trackingEntries.length; i += batchSize) {
            const batch = trackingEntries.slice(i, i + batchSize)
            const { error: insertError } = await supabase
                .from('tracking_entries')
                .insert(batch)
            
            if (insertError) {
                console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError.message)
                throw insertError
            }
            
            console.log(`   ✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(trackingEntries.length/batchSize)}`)
        }

        // Update user profile with some basic info
        console.log('👤 Updating user profile...')
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
                age: '28',
                gender: 'Other',
                height: '175cm',
                weight: '75.5kg',
                updated_at: new Date().toISOString()
            })
            .eq('id', TEST_USER_ID)

        if (profileError) {
            console.warn('Warning updating profile:', profileError.message)
        }

        // Add some health conditions for context
        console.log('🏥 Adding health conditions...')
        const { error: conditionsError } = await supabase
            .from('health_conditions')
            .upsert([
                {
                    user_id: TEST_USER_ID,
                    condition_id: 'diabetes_type2',
                    name: 'Type 2 Diabetes',
                    category: 'endocrine',
                    severity: 'moderate',
                    is_active: true,
                    notes: 'Well managed with lifestyle and medication'
                },
                {
                    user_id: TEST_USER_ID,
                    condition_id: 'hypertension',
                    name: 'Essential Hypertension',
                    category: 'cardiovascular',
                    severity: 'mild',
                    is_active: true,
                    notes: 'Monitoring blood pressure regularly'
                }
            ], { onConflict: 'user_id,condition_id' })

        if (conditionsError) {
            console.warn('Warning adding conditions:', conditionsError.message)
        }

        console.log('')
        console.log('✅ Synthetic data generation complete!')
        console.log('📊 Summary:')
        console.log(`   - Generated ${trackingEntries.length} tracking entries`)
        console.log(`   - Covering ${daysToGenerate} days of health data`)
        console.log(`   - Added realistic trends and variations`)
        console.log(`   - Updated user profile and health conditions`)
        console.log('')
        console.log('🔍 You can now test the insights page with realistic data!')
        console.log(`   User ID: ${TEST_USER_ID}`)
        
    } catch (error) {
        console.error('❌ Error generating synthetic data:', error)
        process.exit(1)
    }
}

// Run the script
generateSyntheticData()
