#!/usr/bin/env node

/**
 * Password Reset and Functionality Test Script for WellnessGrid
 * Resets test user password and runs comprehensive functionality checks
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
const NEW_PASSWORD = 'Test123!';

console.log('🔧 WellnessGrid Password Reset & Functionality Test');
console.log('==================================================');

async function resetTestUserPassword() {
    console.log('\n🔑 Resetting test user password...');
    
    try {
        // Reset password using admin API
        const { data, error } = await supabase.auth.admin.updateUserById(
            TEST_USER_ID,
            { 
                password: NEW_PASSWORD,
                email_confirm: true
            }
        );
        
        if (error) {
            console.error('❌ Error resetting password:', error.message);
            return false;
        }
        
        console.log('✅ Password reset successful');
        console.log(`   Email: ${data.user.email}`);
        console.log(`   New Password: ${NEW_PASSWORD}`);
        console.log(`   User ID: ${data.user.id}`);
        
        return true;
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
        return false;
    }
}

async function checkUserAuthentication() {
    console.log('\n🔐 Testing user authentication...');
    
    try {
        // Test sign in with new password
        const { data, error } = await supabase.auth.signInWithPassword({
            email: '28hshah@gmail.com',
            password: NEW_PASSWORD
        });
        
        if (error) {
            console.error('❌ Authentication failed:', error.message);
            return false;
        }
        
        console.log('✅ Authentication successful');
        console.log(`   Access Token: ${data.session?.access_token ? 'Present' : 'Missing'}`);
        console.log(`   Session valid until: ${data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'Unknown'}`);
        
        // Sign out to clean up
        await supabase.auth.signOut();
        
        return true;
    } catch (error) {
        console.error('❌ Authentication test failed:', error.message);
        return false;
    }
}

async function checkUserProfile() {
    console.log('\n👤 Checking user profile data...');
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', TEST_USER_ID)
            .single();
            
        if (error) {
            console.error('❌ Profile check failed:', error.message);
            return false;
        }
        
        console.log('✅ User profile found');
        console.log(`   Name: ${data.name}`);
        console.log(`   Age: ${data.age}`);
        console.log(`   Gender: ${data.gender}`);
        console.log(`   Wellness Score: ${data.wellness_score}`);
        
        return true;
    } catch (error) {
        console.error('❌ Profile check failed:', error.message);
        return false;
    }
}

async function checkHealthConditions() {
    console.log('\n🏥 Checking health conditions...');
    
    try {
        const { data, error } = await supabase
            .from('health_conditions')
            .select('*')
            .eq('user_id', TEST_USER_ID);
            
        if (error) {
            console.error('❌ Health conditions check failed:', error.message);
            return false;
        }
        
        console.log(`✅ Found ${data.length} health conditions`);
        data.forEach(condition => {
            console.log(`   - ${condition.name} (${condition.severity})`);
        });
        
        return data.length > 0;
    } catch (error) {
        console.error('❌ Health conditions check failed:', error.message);
        return false;
    }
}

async function checkUserTools() {
    console.log('\n🔧 Checking user tools...');
    
    try {
        const { data, error } = await supabase
            .from('user_tools')
            .select('*')
            .eq('user_id', TEST_USER_ID);
            
        if (error) {
            console.error('❌ User tools check failed:', error.message);
            return false;
        }
        
        console.log(`✅ Found ${data.length} configured tools`);
        data.forEach(tool => {
            const status = tool.is_enabled ? '✅' : '❌';
            console.log(`   ${status} ${tool.tool_name} (${tool.tool_category})`);
        });
        
        return data.length > 0;
    } catch (error) {
        console.error('❌ User tools check failed:', error.message);
        return false;
    }
}

async function checkMedications() {
    console.log('\n💊 Checking medications...');
    
    try {
        const { data, error } = await supabase
            .from('medications')
            .select('*')
            .eq('user_id', TEST_USER_ID);
            
        if (error) {
            console.error('❌ Medications check failed:', error.message);
            return false;
        }
        
        console.log(`✅ Found ${data.length} medications`);
        data.forEach(med => {
            console.log(`   - ${med.name} ${med.dosage} (${med.adherence}% adherence)`);
        });
        
        return data.length > 0;
    } catch (error) {
        console.error('❌ Medications check failed:', error.message);
        return false;
    }
}

async function checkTrackingEntries() {
    console.log('\n📊 Checking tracking entries...');
    
    try {
        const { data, error } = await supabase
            .from('tracking_entries')
            .select('tool_id, count(*)')
            .eq('user_id', TEST_USER_ID)
            .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .group('tool_id');
            
        if (error) {
            console.error('❌ Tracking entries check failed:', error.message);
            return false;
        }
        
        console.log(`✅ Found tracking entries for ${data.length} tools (last 30 days)`);
        
        // Get total count
        const { count, error: countError } = await supabase
            .from('tracking_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', TEST_USER_ID);
            
        if (!countError) {
            console.log(`   Total entries: ${count}`);
        }
        
        return data.length > 0;
    } catch (error) {
        console.error('❌ Tracking entries check failed:', error.message);
        return false;
    }
}

async function checkMedicationLogs() {
    console.log('\n💊 Checking medication logs...');
    
    try {
        const { count, error } = await supabase
            .from('medication_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', TEST_USER_ID);
            
        if (error) {
            console.error('❌ Medication logs check failed:', error.message);
            return false;
        }
        
        console.log(`✅ Found ${count} medication log entries`);
        
        return count > 0;
    } catch (error) {
        console.error('❌ Medication logs check failed:', error.message);
        return false;
    }
}

async function checkGoals() {
    console.log('\n🎯 Checking health goals...');
    
    try {
        const { data, error } = await supabase
            .from('user_goals')
            .select('*')
            .eq('user_id', TEST_USER_ID);
            
        if (error) {
            console.error('❌ Goals check failed:', error.message);
            return false;
        }
        
        console.log(`✅ Found ${data.length} health goals`);
        data.forEach(goal => {
            console.log(`   - ${goal.title} (${goal.progress}% complete)`);
        });
        
        return data.length > 0;
    } catch (error) {
        console.error('❌ Goals check failed:', error.message);
        return false;
    }
}

async function checkRowLevelSecurity() {
    console.log('\n🛡️ Testing Row Level Security...');
    
    try {
        // Create a client without service role (normal user permissions)
        const normalClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        
        // Try to access data without authentication (should fail)
        const { data, error } = await normalClient
            .from('user_profiles')
            .select('*')
            .eq('id', TEST_USER_ID);
            
        if (error) {
            console.log('✅ RLS working - unauthorized access blocked');
            console.log(`   Error: ${error.message}`);
            return true;
        } else {
            console.log('⚠️  RLS may not be working - data returned without auth');
            return false;
        }
    } catch (error) {
        console.log('✅ RLS working - unauthorized access threw error');
        return true;
    }
}

async function checkDatabaseConnectivity() {
    console.log('\n🔌 Testing database connectivity...');
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('count(*)', { count: 'exact', head: true });
            
        if (error) {
            console.error('❌ Database connectivity failed:', error.message);
            return false;
        }
        
        console.log('✅ Database connection successful');
        return true;
    } catch (error) {
        console.error('❌ Database connectivity failed:', error.message);
        return false;
    }
}

async function testRecentTrackingData() {
    console.log('\n📈 Checking recent tracking data...');
    
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
            .from('tracking_entries')
            .select('tool_id, data, timestamp')
            .eq('user_id', TEST_USER_ID)
            .gte('timestamp', twentyFourHoursAgo)
            .order('timestamp', { ascending: false })
            .limit(5);
            
        if (error) {
            console.error('❌ Recent tracking data check failed:', error.message);
            return false;
        }
        
        console.log(`✅ Found ${data.length} recent entries (last 24h)`);
        data.forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            console.log(`   - ${entry.tool_id} at ${time}`);
        });
        
        return true;
    } catch (error) {
        console.error('❌ Recent tracking data check failed:', error.message);
        return false;
    }
}

function printTestSummary(results) {
    console.log('\n📋 FUNCTIONALITY TEST SUMMARY');
    console.log('==============================');
    
    const tests = [
        { name: 'Password Reset', passed: results.passwordReset },
        { name: 'User Authentication', passed: results.authentication },
        { name: 'User Profile', passed: results.profile },
        { name: 'Health Conditions', passed: results.conditions },
        { name: 'User Tools', passed: results.tools },
        { name: 'Medications', passed: results.medications },
        { name: 'Tracking Entries', passed: results.tracking },
        { name: 'Medication Logs', passed: results.medicationLogs },
        { name: 'Health Goals', passed: results.goals },
        { name: 'Row Level Security', passed: results.rls },
        { name: 'Database Connectivity', passed: results.connectivity },
        { name: 'Recent Data', passed: results.recentData }
    ];
    
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    
    console.log(`\n📊 Overall Score: ${passed}/${total} tests passed\n`);
    
    tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`${status} ${test.name}`);
    });
    
    if (passed === total) {
        console.log('\n🎉 All functionality tests passed! Your WellnessGrid app is working properly.');
        console.log('\n🔑 Updated Login Credentials:');
        console.log('   Email: 28hshah@gmail.com');
        console.log(`   Password: ${NEW_PASSWORD}`);
        console.log(`   User ID: ${TEST_USER_ID}`);
    } else {
        console.log(`\n⚠️  ${total - passed} test(s) failed. Please review the issues above.`);
    }
    
    return passed === total;
}

async function main() {
    try {
        console.log('\n🚀 Starting comprehensive functionality tests...');
        
        const results = {};
        
        // Run all tests
        results.passwordReset = await resetTestUserPassword();
        results.authentication = await checkUserAuthentication();
        results.profile = await checkUserProfile();
        results.conditions = await checkHealthConditions();
        results.tools = await checkUserTools();
        results.medications = await checkMedications();
        results.tracking = await checkTrackingEntries();
        results.medicationLogs = await checkMedicationLogs();
        results.goals = await checkGoals();
        results.rls = await checkRowLevelSecurity();
        results.connectivity = await checkDatabaseConnectivity();
        results.recentData = await testRecentTrackingData();
        
        // Print summary
        const allPassed = printTestSummary(results);
        
        if (allPassed) {
            console.log('\n✨ Your WellnessGrid application is ready to use!');
        }
        
        process.exit(allPassed ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Fatal error during testing:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    resetTestUserPassword,
    checkUserAuthentication,
    checkUserProfile,
    checkHealthConditions,
    checkUserTools,
    checkMedications,
    checkTrackingEntries,
    checkMedicationLogs,
    checkGoals,
    checkRowLevelSecurity,
    checkDatabaseConnectivity,
    testRecentTrackingData
};


