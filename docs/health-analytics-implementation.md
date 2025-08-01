# Health Analytics System Implementation

## Overview

The WellnessGrid Health Analytics System provides comprehensive insights and analytics from user health tracking data. It combines LLM-powered insights, rule-based alerts, wellness scoring, and automated processing to deliver personalized health intelligence.

## 🏗 Architecture

### Core Components

1. **Health Analytics Service** (`lib/services/health-analytics.ts`)
   - Trend analysis and correlation detection
   - Data aggregation and statistical analysis
   - Caching for performance optimization

2. **Health Insights Service** (`lib/services/health-insights.ts`)
   - AI-powered insights using existing LLM infrastructure
   - Pattern recognition and personalized recommendations
   - Structured insights with confidence scoring

3. **Alert Service** (`lib/services/alert-service.ts`)
   - Rule-based health alerts and notifications
   - Condition-specific monitoring (diabetes, hypertension, etc.)
   - Severity-based alert classification

4. **Wellness Score Service** (`lib/services/wellness-score.ts`)
   - Multi-factor health scoring algorithm
   - Condition-specific score adjustments
   - Trend analysis and historical tracking

5. **Analytics Dashboard** (`components/analytics/health-dashboard.tsx`)
   - Interactive visualizations using Recharts
   - Real-time data display with responsive design
   - Tabbed interface for different analytics views

## 📊 Database Schema Extensions

### New Tables

```sql
-- Health insights table for storing AI-generated insights
CREATE TABLE public.health_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('daily', 'weekly', 'monthly', 'triggered', 'on_demand')),
    insights JSONB NOT NULL DEFAULT '{}',
    alerts JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health scores table for wellness index tracking
CREATE TABLE public.health_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    component_scores JSONB NOT NULL DEFAULT '{}',
    trend TEXT CHECK (trend IN ('improving', 'stable', 'declining', 'insufficient_data')),
    score_period TEXT NOT NULL DEFAULT '7d',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User alerts table for notifications and warnings
CREATE TABLE public.user_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'urgent', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_required TEXT,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics cache table for performance optimization
CREATE TABLE public.analytics_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 API Endpoints

### Analytics API (`/api/analytics`)

**GET** - Retrieve analytics data
```typescript
// Query parameters
?timeRange=30d&includeInsights=true

// Response
{
  "success": true,
  "data": {
    "trends": HealthTrend[],
    "correlations": CorrelationData[],
    "goals": GoalProgress[],
    "streaks": StreakData[],
    "health_score": HealthScore,
    "insights": HealthInsight[],
    "alerts": UserAlert[]
  },
  "metadata": {
    "user_id": string,
    "time_range": string,
    "generated_at": string,
    "insights_included": boolean
  }
}
```

**POST** - Generate insights on demand
```typescript
// Request body
{
  "action": "generate_insights",
  "insight_type": "on_demand"
}

// Response
{
  "success": true,
  "data": HealthInsight,
  "metadata": {
    "user_id": string,
    "insight_type": string,
    "generated_at": string
  }
}
```

### Automation API (`/api/automation/daily-insights`)

**POST** - Trigger automated insights generation
```typescript
// Request headers
Authorization: Bearer <AUTOMATION_SECRET_KEY>

// Request body
{
  "insightType": "daily",
  "scorePeriod": "7d",
  "userIds": ["user1", "user2"], // Optional
  "maxUsers": 100
}

// Response
{
  "success": true,
  "summary": {
    "totalUsers": number,
    "successful": number,
    "failed": number,
    "avgProcessingTime": number,
    "totalAlerts": number
  },
  "results": ProcessingResult[],
  "totalTime": number
}
```

## 🤖 Health Insights Engine

### LLM Integration

The insights engine leverages your existing LLM infrastructure (Gemini + OpenRouter) with structured prompts designed for health data analysis.

**Insight Types:**
- **Trends**: Pattern recognition in health metrics
- **Concerns**: Potential health issues requiring attention
- **Recommendations**: Actionable advice based on data patterns
- **Achievements**: Positive progress to celebrate

**Example Insight Structure:**
```typescript
{
  "trends": [
    {
      "metric": "glucose_level",
      "direction": "improving",
      "confidence": 0.85,
      "description": "Your glucose levels have been more stable this week"
    }
  ],
  "recommendations": [
    {
      "category": "nutrition",
      "action": "Continue your current meal timing pattern",
      "priority": "medium",
      "rationale": "Consistent meal timing helps maintain stable glucose levels"
    }
  ]
}
```

## 🚨 Alert System

### Alert Categories

**Condition-Specific Alerts:**
- **Diabetes**: Glucose highs/lows, variability
- **Hypertension**: Blood pressure monitoring
- **Mental Health**: Mood pattern detection
- **Asthma**: Symptom tracking

**General Health Alerts:**
- Sleep pattern warnings
- Medication adherence
- Vital sign abnormalities
- Tracking streak notifications

**Alert Severity Levels:**
- **Info**: Gentle reminders and positive feedback
- **Warning**: Patterns requiring attention
- **Urgent**: Health concerns needing prompt action
- **Critical**: Immediate safety concerns

### Alert Processing

Alerts are generated using rule-based logic with condition-specific thresholds:

```typescript
// Example: Diabetes glucose alerts
const highReadings = glucoseValues.filter(val => val > 180)
if (highReadings.length > 2) {
  alerts.push({
    alert_type: 'glucose_high',
    severity: 'urgent',
    title: 'High Glucose Alert',
    message: `${highReadings.length} glucose readings above 180 mg/dL`,
    action_required: 'Contact your healthcare provider'
  })
}
```

## 📊 Wellness Score Algorithm

### Base Components

1. **Glucose Management** (25% weight, 35% for diabetics)
   - Time in range (70-180 mg/dL)
   - Hypoglycemia penalties
   - Variability bonus/penalty

2. **Medication Adherence** (20% weight)
   - Adherence rate calculation
   - Perfect adherence bonus
   - Poor adherence penalty

3. **Sleep Quality** (15% weight)
   - Optimal duration (7-9 hours)
   - Sleep quality rating
   - Consistency scoring

4. **Mood/Mental Health** (15% weight, 25% for mental health conditions)
   - Average mood score
   - Consistency bonus
   - Variability penalty

5. **Vital Signs** (10% weight, 25% for hypertension)
   - Blood pressure scoring
   - Heart rate assessment
   - Weight tracking

6. **Exercise** (10% weight)
   - Target minutes per week
   - Consistency bonus

7. **Nutrition** (5% weight)
   - Tracking consistency
   - Future: macro/calorie analysis

### Condition-Specific Adjustments

The algorithm automatically adjusts component weights based on user's health conditions:

```typescript
// Example: Diabetes increases glucose weight
if (condition.condition_id.includes('diabetes')) {
  glucoseComponent.weight = 0.35 // Increased from 0.25
}
```

## 🔄 Automation Pipeline

### Daily Insights Automation

The system includes automated processing that can be triggered by:
- Cron jobs (recommended)
- Scheduled tasks
- Manual API calls

**Features:**
- Batch processing with configurable limits
- Parallel processing for performance
- Error handling and retry logic
- Comprehensive logging and metrics

### Scheduling Recommendations

**Daily Insights**: Run at 6:00 AM local time
```bash
# Cron job example
0 6 * * * curl -X POST "https://your-app.com/api/automation/daily-insights" \
  -H "Authorization: Bearer $AUTOMATION_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"insightType":"daily","scorePeriod":"7d"}'
```

**Weekly Insights**: Run on Sundays at 8:00 AM
```bash
0 8 * * 0 curl -X POST "https://your-app.com/api/automation/daily-insights" \
  -H "Authorization: Bearer $AUTOMATION_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"insightType":"weekly","scorePeriod":"30d"}'
```

## 🎨 Dashboard Features

### Analytics Tabs

1. **Overview**: High-level metrics and health score
2. **Trends**: Interactive charts showing metric patterns over time
3. **Insights**: AI-generated insights and recommendations
4. **Goals & Streaks**: Progress tracking and motivation

### Visualization Components

- **Line Charts**: Trend analysis over time
- **Correlation Matrix**: Relationship between health metrics
- **Progress Bars**: Goal tracking and completion
- **Alert Cards**: Important health notifications
- **Metric Cards**: Key performance indicators

### Real-time Features

- **Live Data Updates**: Automatic refresh of analytics
- **Interactive Filtering**: Time range and metric selection
- **Responsive Design**: Optimized for all device sizes
- **Accessibility**: Screen reader compatible

## 🚀 Performance Optimizations

### Caching Strategy

1. **Analytics Cache**: 1-hour TTL for computed analytics
2. **Health Score Cache**: 6-hour TTL for wellness scores
3. **Alert Cache**: 24-hour TTL for generated alerts

### Database Optimizations

- Composite indexes for common query patterns
- JSONB indexes for metadata searches
- Automatic cleanup of expired cache entries

### API Performance

- Parallel processing of analytics components
- Batch operations for bulk processing
- Request rate limiting and timeout handling

## 🔒 Security Considerations

### Data Privacy

- Row Level Security (RLS) on all tables
- User isolation at database level
- Encrypted sensitive data storage

### API Security

- Authentication required for all endpoints
- Automation endpoints require secret token
- Request validation and sanitization

### Alert Security

- No sensitive data in alert messages
- Secure alert delivery mechanisms
- User consent for notification preferences

## 📋 Setup Instructions

### 1. Database Setup

Run the schema extensions in your Supabase SQL editor:

```sql
-- Copy and run the schema from lib/database/schema.sql
-- The new tables will be automatically created with proper RLS policies
```

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Existing variables (already configured)
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# New variable for automation
AUTOMATION_SECRET_KEY=your_secure_random_string
```

### 3. Install Dependencies

```bash
npm install recharts --legacy-peer-deps
```

### 4. Deploy and Test

1. Deploy your application
2. Test the analytics dashboard at `/insights`
3. Test automation endpoint with curl
4. Set up cron jobs for automated processing

## 🔧 Customization Options

### Adding New Alert Types

```typescript
// In alert-service.ts
private static checkCustomAlerts(userId: string, groupedData: Record<string, TrackingEntry[]>): UserAlert[] {
  // Add your custom alert logic here
  return alerts
}
```

### Custom Wellness Score Components

```typescript
// In wellness-score.ts
private static calculateCustomScore(entries: TrackingEntry[], days: number): number | null {
  // Add your custom scoring logic here
  return score
}
```

### Additional Visualizations

```typescript
// In health-dashboard.tsx
function CustomChart({ data }: { data: any[] }) {
  // Add your custom chart components here
  return <YourCustomChart data={data} />
}
```

## 📈 Future Enhancements

### Planned Features

1. **Goal Setting**: User-defined health goals with progress tracking
2. **Predictive Analytics**: ML models for health outcome prediction
3. **Integration APIs**: Connect with wearables and health devices
4. **Provider Reports**: Automated reports for healthcare providers
5. **Family Sharing**: Multi-user family health tracking

### ML Integration Opportunities

1. **Anomaly Detection**: Advanced pattern recognition
2. **Personalized Thresholds**: User-specific alert boundaries
3. **Predictive Modeling**: Risk assessment and early warnings
4. **Recommendation Engine**: Personalized intervention suggestions

## 🐛 Troubleshooting

### Common Issues

**No Analytics Data Showing:**
- Check if user has tracking entries
- Verify database permissions
- Check browser console for errors

**Insights Not Generating:**
- Verify LLM API keys are configured
- Check LLM service quotas
- Review server logs for errors

**Alerts Not Appearing:**
- Confirm user has health conditions set
- Check alert generation logic
- Verify RLS policies are correct

### Debugging Tools

- Analytics API returns detailed metadata
- Health check endpoint: `/api/automation/daily-insights` (GET)
- Browser developer tools for frontend issues
- Supabase logs for database queries

## 📚 API Reference

For complete API documentation, see the TypeScript interfaces in:
- `lib/database/types.ts` - Data structure definitions
- `lib/services/*.ts` - Service method signatures
- `app/api/*/route.ts` - Endpoint specifications

This implementation provides a solid foundation for health analytics while remaining extensible for future enhancements. The modular architecture allows for easy customization and integration with additional health data sources.