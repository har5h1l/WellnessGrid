-- WellnessGrid Database Schema
-- Run this in your Supabase SQL editor

-- Enable RLS (Row Level Security) for all tables
-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    age TEXT,
    gender TEXT,
    height TEXT,
    weight TEXT,
    wellness_score INTEGER DEFAULT 0,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health conditions table
CREATE TABLE public.health_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    condition_id TEXT NOT NULL, -- Reference to preset condition IDs
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    diagnosed_date DATE,
    is_active BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,
    icon TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User selected tools/features
CREATE TABLE public.user_tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    tool_category TEXT,
    is_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Information sources selected by users
CREATE TABLE public.user_information_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    condition_id TEXT NOT NULL, -- Links to health condition
    source_id TEXT NOT NULL,
    source_title TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_content TEXT,
    source_url TEXT,
    author TEXT,
    is_custom BOOLEAN DEFAULT false,
    is_selected BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocols/guidelines selected by users
CREATE TABLE public.user_protocols (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    condition_id TEXT NOT NULL, -- Links to health condition
    protocol_id TEXT NOT NULL,
    protocol_name TEXT NOT NULL,
    description TEXT,
    protocol_type TEXT,
    steps JSONB DEFAULT '[]',
    is_custom BOOLEAN DEFAULT false,
    is_selected BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health data uploaded by users
CREATE TABLE public.user_health_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    data_type TEXT CHECK (data_type IN ('ehr', 'genetic', 'lab_results', 'imaging', 'doctor_notes', 'family_history', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    file_name TEXT,
    file_size TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications table
CREATE TABLE public.medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    time_slots TEXT[] DEFAULT '{}',
    adherence INTEGER DEFAULT 0,
    side_effects TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE public.user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit TEXT,
    deadline DATE,
    completed BOOLEAN DEFAULT false,
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Symptom entries
CREATE TABLE public.symptom_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type TEXT NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 5),
    notes TEXT,
    triggers TEXT[] DEFAULT '{}',
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mood entries
CREATE TABLE public.mood_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    mood TEXT CHECK (mood IN ('very-sad', 'sad', 'neutral', 'happy', 'very-happy')),
    energy INTEGER CHECK (energy >= 1 AND energy <= 5),
    stress INTEGER CHECK (stress >= 1 AND stress <= 5),
    notes TEXT,
    activities TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication logs
CREATE TABLE public.medication_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    taken BOOLEAN NOT NULL,
    notes TEXT,
    side_effects TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool tracking entries
CREATE TABLE public.tracking_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings and preferences
CREATE TABLE public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    reminder_frequency TEXT DEFAULT 'daily',
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'en',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create medical_documents table for storing medical content
CREATE TABLE IF NOT EXISTS medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    topic TEXT,
    url TEXT,
    document_type TEXT,
    metadata JSONB DEFAULT '{}',
    content_length INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_embeddings table with pgvector support
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES medical_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding VECTOR(768), -- PubMedBERT embeddings are 768-dimensional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_documents_source ON medical_documents(source);
CREATE INDEX IF NOT EXISTS idx_medical_documents_topic ON medical_documents(topic);
CREATE INDEX IF NOT EXISTS idx_medical_documents_type ON medical_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id ON document_embeddings(document_id);

-- Create vector similarity search index (HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
ON document_embeddings USING hnsw (embedding vector_cosine_ops);

-- Create updated_at trigger for medical_documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_medical_documents_updated_at 
    BEFORE UPDATE ON medical_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RPC function for efficient vector similarity search
CREATE OR REPLACE FUNCTION search_embeddings(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    chunk_content TEXT,
    similarity FLOAT,
    source TEXT,
    topic TEXT,
    title TEXT,
    document_type TEXT,
    document_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.chunk_content,
        1 - (de.embedding <=> query_embedding) AS similarity,
        md.source,
        md.topic,
        md.title,
        md.document_type,
        md.id AS document_id
    FROM document_embeddings de
    JOIN medical_documents md ON de.document_id = md.id
    WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create RPC function to get document statistics
CREATE OR REPLACE FUNCTION get_document_stats()
RETURNS TABLE (
    source TEXT,
    count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        md.source,
        COUNT(*) as count
    FROM medical_documents md
    GROUP BY md.source
    ORDER BY count DESC;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_health_conditions_user_id ON public.health_conditions(user_id);
CREATE INDEX idx_user_tools_user_id ON public.user_tools(user_id);
CREATE INDEX idx_user_information_sources_user_id ON public.user_information_sources(user_id);
CREATE INDEX idx_user_protocols_user_id ON public.user_protocols(user_id);
CREATE INDEX idx_user_health_data_user_id ON public.user_health_data(user_id);
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_symptom_entries_user_id_date ON public.symptom_entries(user_id, date);
CREATE INDEX idx_mood_entries_user_id_date ON public.mood_entries(user_id, date);
CREATE INDEX idx_medication_logs_user_id_date ON public.medication_logs(user_id, date);
CREATE INDEX idx_tracking_entries_user_id_timestamp ON public.tracking_entries(user_id, timestamp);
CREATE INDEX idx_tracking_entries_tool_id ON public.tracking_entries(tool_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_information_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Health conditions policies
CREATE POLICY "Users can view own health conditions" ON public.health_conditions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health conditions" ON public.health_conditions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health conditions" ON public.health_conditions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health conditions" ON public.health_conditions
    FOR DELETE USING (auth.uid() = user_id);

-- User tools policies
CREATE POLICY "Users can manage own tools" ON public.user_tools
    FOR ALL USING (auth.uid() = user_id);

-- Information sources policies  
CREATE POLICY "Users can manage own information sources" ON public.user_information_sources
    FOR ALL USING (auth.uid() = user_id);

-- Protocols policies
CREATE POLICY "Users can manage own protocols" ON public.user_protocols
    FOR ALL USING (auth.uid() = user_id);

-- Health data policies
CREATE POLICY "Users can manage own health data" ON public.user_health_data
    FOR ALL USING (auth.uid() = user_id);

-- Medications policies
CREATE POLICY "Users can manage own medications" ON public.medications
    FOR ALL USING (auth.uid() = user_id);

-- Tracking entries policies
CREATE POLICY "Users can manage own tracking entries" ON public.tracking_entries
    FOR ALL USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can manage own goals" ON public.user_goals
    FOR ALL USING (auth.uid() = user_id);

-- Symptom entries policies
CREATE POLICY "Users can manage own symptom entries" ON public.symptom_entries
    FOR ALL USING (auth.uid() = user_id);

-- Mood entries policies
CREATE POLICY "Users can manage own mood entries" ON public.mood_entries
    FOR ALL USING (auth.uid() = user_id);

-- Medication logs policies
CREATE POLICY "Users can manage own medication logs" ON public.medication_logs
    FOR ALL USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can manage own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_conditions_updated_at BEFORE UPDATE ON public.health_conditions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tools_updated_at BEFORE UPDATE ON public.user_tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_information_sources_updated_at BEFORE UPDATE ON public.user_information_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_protocols_updated_at BEFORE UPDATE ON public.user_protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_health_data_updated_at BEFORE UPDATE ON public.user_health_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON public.user_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 

-- Add indexes for tracking_entries for better analytics performance
CREATE INDEX IF NOT EXISTS idx_tracking_entries_user_id_timestamp ON public.tracking_entries(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_tracking_entries_tool_id ON public.tracking_entries(tool_id);
CREATE INDEX IF NOT EXISTS idx_tracking_entries_user_tool_timestamp ON public.tracking_entries(user_id, tool_id, timestamp);

-- Health insights table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS public.health_insights (
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
CREATE TABLE IF NOT EXISTS public.health_scores (
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
CREATE TABLE IF NOT EXISTS public.user_alerts (
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
CREATE TABLE IF NOT EXISTS public.analytics_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for analytics tables
CREATE INDEX IF NOT EXISTS idx_health_insights_user_type ON public.health_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_health_insights_generated_at ON public.health_insights(generated_at);
CREATE INDEX IF NOT EXISTS idx_health_scores_user_calculated ON public.health_scores(user_id, calculated_at);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_severity ON public.user_alerts(user_id, severity, is_read);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_key ON public.analytics_cache(user_id, cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON public.analytics_cache(expires_at);

-- Enable Row Level Security for analytics tables
ALTER TABLE public.health_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics tables
CREATE POLICY "Users can manage own health insights" ON public.health_insights
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own health scores" ON public.health_scores
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts" ON public.user_alerts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analytics cache" ON public.analytics_cache
    FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_health_insights_updated_at BEFORE UPDATE ON public.health_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for cleaning up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.analytics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql; 