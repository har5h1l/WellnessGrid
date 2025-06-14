# WellnessGrid Supabase Setup Guide

## Overview

This guide will help you set up Supabase for the WellnessGrid app, including database tables, authentication, and data management.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Your WellnessGrid app with the integrated Supabase code

## Step 1: Create a New Supabase Project

1. Log in to your Supabase dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: WellnessGrid
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Configure Environment Variables

Create or update your `.env.local` file in the root of your project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Important**: Replace the placeholder values with your actual Supabase credentials.

## Step 4: Set Up Database Tables

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `lib/database/schema.sql`
4. Click **Run** to execute the SQL

This will create all the necessary tables:
- `user_profiles` - User profile information
- `health_conditions` - User's health conditions
- `user_tools` - Enabled tools/features
- `user_information_sources` - Selected information sources
- `user_protocols` - Selected protocols/guidelines
- `user_health_data` - Uploaded health data
- `medications` - User medications
- `user_goals` - Health goals
- `symptom_entries` - Symptom tracking
- `mood_entries` - Mood tracking
- `medication_logs` - Medication adherence
- `user_settings` - User preferences

## Step 5: Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. **Site URL**: Set to your app's URL (e.g., `http://localhost:3000` for development)
3. **Redirect URLs**: Add your app's URL + `/auth/callback`
4. **Email templates**: Customize if needed (optional)

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Create a new account
4. Complete the setup flow
5. Check your Supabase dashboard to see the data

## Features Implemented

### 🔐 Authentication
- **Sign up** with email and password
- **Sign in** with existing credentials
- **Automatic redirect** to setup if profile incomplete
- **Session management** with auto-refresh

### 🔧 Setup Flow
- **User profile creation** (name, age, gender, height, weight)
- **Health condition selection** (preset and custom conditions)
- **Tool selection** (health tracking tools)
- **Information source curation** (medical sources and guidelines)
- **Protocol selection** (treatment protocols)
- **Health data upload** (medical records, lab results, etc.)

### 👤 Profile Management
- **View user profile** with all selected conditions and tools
- **Edit profile information** (name, etc.)
- **Display health conditions** with severity and categories
- **Show enabled tools** with categories

### 🛡️ Security Features
- **Row Level Security (RLS)** enabled on all tables
- **User isolation** - users can only access their own data
- **Automatic timestamps** with triggers
- **Data validation** with SQL constraints

## Database Structure

### Core Tables
```sql
user_profiles          -- Basic user information
├── health_conditions  -- User's health conditions
├── user_tools        -- Enabled tracking tools
├── user_information_sources -- Selected medical sources
├── user_protocols    -- Selected treatment protocols
└── user_health_data  -- Uploaded health records

# Tracking Tables
├── symptom_entries   -- Daily symptom logs
├── mood_entries      -- Mood tracking
├── medication_logs   -- Medication adherence
└── medications       -- User's medications
```

### Key Relationships
- All tables link to `user_profiles.id` (which references `auth.users.id`)
- Health conditions, sources, and protocols are linked by `condition_id`
- Medications and medication logs are linked
- All tracking data belongs to specific users

## API Usage Examples

### Create User Profile
```typescript
import { DatabaseService } from '@/lib/database'

const setupData = {
  profile: {
    id: user.id,
    name: "John Doe",
    age: "25",
    gender: "male",
    // ... other fields
  },
  conditions: [
    {
      condition_id: "diabetes1",
      name: "Type 1 Diabetes",
      category: "Endocrine",
      // ... other fields
    }
  ],
  tools: [
    {
      tool_id: "glucose-tracker",
      tool_name: "Blood Glucose Tracker",
      tool_category: "custom"
    }
  ],
  // ... other data
}

await DatabaseService.completeUserSetup(setupData)
```

### Fetch User Data
```typescript
const userData = await DatabaseService.getUserCompleteData(userId)
console.log(userData.profile)     // User profile
console.log(userData.conditions)  // Health conditions
console.log(userData.tools)       // Enabled tools
```

### Update Profile
```typescript
await DatabaseService.updateUserProfile(userId, {
  name: "New Name",
  age: "26"
})
```

## Development Tips

1. **Use the Supabase dashboard** to view and edit data during development
2. **Check the RLS policies** if you get permission errors
3. **Monitor the logs** in the Supabase dashboard for query errors
4. **Use transactions** for complex operations (already implemented in setup)

## Production Considerations

1. **Email verification**: Enable email confirmation in Supabase Auth settings
2. **Rate limiting**: Configure rate limits in Supabase
3. **Backups**: Set up automatic backups
4. **Monitoring**: Use Supabase analytics and logs
5. **Environment variables**: Use secure environment variable management

## Troubleshooting

### Common Issues

**Authentication errors:**
- Check your environment variables
- Verify the Supabase project URL and key
- Check the site URL in Supabase settings

**Permission denied errors:**
- Verify RLS policies are correctly set up
- Check that the user is authenticated
- Ensure the user ID matches the auth.uid()

**Data not saving:**
- Check the browser console for errors
- Verify all required fields are provided
- Check Supabase logs for SQL errors

### Debug Mode
Add this to see detailed Supabase logs:
```typescript
// Add to your database service calls
.then(result => {
  console.log('Success:', result)
  return result
})
.catch(error => {
  console.error('Supabase error:', error)
  throw error
})
```

## Next Steps

1. **Extend the schema** as needed for new features
2. **Add real-time subscriptions** for live data updates
3. **Implement data sync** between devices
4. **Add more tracking features** (exercise, nutrition, etc.)
5. **Set up automated backups** and monitoring

## Support

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Supabase Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

---

Your WellnessGrid app is now fully integrated with Supabase! 🎉 

## Database Setup

### 1. Run the main schema
Copy and paste the contents of `lib/database/schema.sql` into your Supabase SQL Editor and run it to create all tables

### 2. Add tracking entries table (REQUIRED UPDATE)
Run this additional SQL in your Supabase SQL Editor to add the new tracking functionality:

```sql
-- Tool tracking entries (New table for tracking functionality)
CREATE TABLE public.tracking_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_tracking_entries_user_id_timestamp ON public.tracking_entries(user_id, timestamp);
CREATE INDEX idx_tracking_entries_tool_id ON public.tracking_entries(tool_id);

-- Enable Row Level Security
ALTER TABLE public.tracking_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tracking entries
CREATE POLICY "Users can manage own tracking entries" ON public.tracking_entries
    FOR ALL USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_tracking_entries_updated_at BEFORE UPDATE ON public.tracking_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Environment Variables
Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features Included
- User profiles and authentication
- Health conditions management  
- Tool selection and configuration
- Information sources and protocols
- Health data uploads
- **NEW: Tool tracking functionality**
- **NEW: Recommended actions based on usage**
- Row Level Security (RLS) on all tables

## Notes
- All tables have proper foreign key relationships
- RLS ensures users can only access their own data
- The tracking_entries table enables the new tools functionality with personalized recommendations 

## Tools Functionality Overview

The new tools system includes:

### 1. Tool Selection ✅
- Users can select tools during setup or manage them in `/profile/tools`
- Tools are filtered based on user's health conditions

### 2. Tool Configuration ✅ 
- **Reminder Settings**: Custom reminder times with add/remove functionality
- **Field Configuration**: Enable/disable specific tracking fields for each tool
- **Data Sharing**: Options to share with healthcare providers and enable exports
- **Notification Controls**: Toggle notifications on/off

### 3. Dynamic Tool Tracking ✅
- **Smart Forms**: Forms adapt to each tool's configuration and disabled fields
- **Multiple Input Types**: Text, number, scale (slider), select, multiselect, boolean
- **Real-time Validation**: Field validation with user-friendly error messages
- **Auto-save**: Entries are saved with timestamp to track usage patterns

### 4. Intelligent Recommendations ✅
- **Usage-based Suggestions**: Recommends tools that haven't been used today
- **Priority System**: Urgent, High, Medium, Low priority recommendations
- **Medication Reminders**: Smart detection of overdue medication tracking
- **Pattern Insights**: Analyzes tracking patterns to suggest health insights
- **Quick Actions**: One-click access to track tools directly from recommendations

## Database Features
- **Row Level Security**: Users can only access their own data
- **Optimized Indexes**: Fast queries for tracking entries by user and timestamp
- **JSONB Storage**: Flexible storage for different tool field types
- **Auto-timestamps**: Created and updated timestamps for audit trails

## Dashboard Integration
- **Active Tools Overview**: Shows enabled tools with today's tracking status
- **Recommended Actions**: Personalized suggestions based on usage patterns
- **Visual Indicators**: Clear tracking status with green/gray dots
- **Direct Tool Access**: Click any tool to go directly to tracking form

The complete tools ecosystem is now ready to use once you run the tracking_entries table SQL above! 