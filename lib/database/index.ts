import { supabase } from '../supabase'
import type { User } from '@supabase/supabase-js'

// Database Types (matching our SQL schema)
export interface UserProfile {
  id: string
  name: string
  age?: string
  gender?: string
  height?: string
  weight?: string
  wellness_score?: number
  avatar?: string
  created_at?: string
  updated_at?: string
}

export interface HealthCondition {
  id?: string
  user_id: string
  condition_id: string
  name: string
  category?: string
  description?: string
  severity?: 'mild' | 'moderate' | 'severe'
  diagnosed_date?: string
  is_active?: boolean
  is_custom?: boolean
  icon?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface UserTool {
  id?: string
  user_id: string
  tool_id: string
  tool_name: string
  tool_category?: string
  is_enabled?: boolean
  settings?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface InformationSource {
  id?: string
  user_id: string
  condition_id: string
  source_id: string
  source_title: string
  source_type: string
  source_content?: string
  source_url?: string
  author?: string
  is_custom?: boolean
  is_selected?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserProtocol {
  id?: string
  user_id: string
  condition_id: string
  protocol_id: string
  protocol_name: string
  description?: string
  protocol_type?: string
  steps?: any[]
  is_custom?: boolean
  is_selected?: boolean
  created_at?: string
  updated_at?: string
}

export interface HealthData {
  id?: string
  user_id: string
  data_type: 'ehr' | 'genetic' | 'lab_results' | 'imaging' | 'doctor_notes' | 'family_history' | 'other'
  title: string
  description?: string
  content?: string
  file_name?: string
  file_size?: string
  file_url?: string
  created_at?: string
  updated_at?: string
}

export interface TrackingEntry {
  id?: string
  user_id: string
  tool_id: string
  data: Record<string, any>
  timestamp: string
  created_at?: string
  updated_at?: string
}

// Database Service Class
export class DatabaseService {
  // User Profile Methods
  static async createUserProfile(profile: Omit<UserProfile, 'created_at' | 'updated_at'>) {
    console.log('Creating/updating user profile with data:', profile)
    
    // Use upsert to handle existing profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([profile], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('User profile upsert error:', error)
      console.error('Profile data that failed:', profile)
      throw error
    }
    
    console.log('User profile created/updated successfully:', data)
    return data
  }

  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Health Conditions Methods
  static async createHealthConditions(conditions: Omit<HealthCondition, 'id' | 'created_at' | 'updated_at'>[]) {
    const { data, error } = await supabase
      .from('health_conditions')
      .insert(conditions)
      .select()

    if (error) throw error
    return data
  }

  static async getUserHealthConditions(userId: string) {
    const { data, error } = await supabase
      .from('health_conditions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async updateHealthCondition(conditionId: string, updates: Partial<HealthCondition>) {
    const { data, error } = await supabase
      .from('health_conditions')
      .update(updates)
      .eq('id', conditionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteHealthCondition(conditionId: string) {
    const { error } = await supabase
      .from('health_conditions')
      .update({ is_active: false })
      .eq('id', conditionId)

    if (error) throw error
  }

  // User Tools Methods
  static async createUserTools(tools: Omit<UserTool, 'id' | 'created_at' | 'updated_at'>[]) {
    const { data, error } = await supabase
      .from('user_tools')
      .insert(tools)
      .select()

    if (error) throw error
    return data
  }

  static async getUserTools(userId: string) {
    const { data, error } = await supabase
      .from('user_tools')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async updateUserTool(toolId: string, updates: Partial<UserTool>) {
    const { data, error } = await supabase
      .from('user_tools')
      .update(updates)
      .eq('id', toolId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Information Sources Methods
  static async createInformationSources(sources: Omit<InformationSource, 'id' | 'created_at' | 'updated_at'>[]) {
    const { data, error } = await supabase
      .from('user_information_sources')
      .insert(sources)
      .select()

    if (error) throw error
    return data
  }

  static async getUserInformationSources(userId: string, conditionId?: string) {
    let query = supabase
      .from('user_information_sources')
      .select('*')
      .eq('user_id', userId)
      .eq('is_selected', true)

    if (conditionId) {
      query = query.eq('condition_id', conditionId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Protocols Methods
  static async createUserProtocols(protocols: Omit<UserProtocol, 'id' | 'created_at' | 'updated_at'>[]) {
    const { data, error } = await supabase
      .from('user_protocols')
      .insert(protocols)
      .select()

    if (error) throw error
    return data
  }

  static async getUserProtocols(userId: string, conditionId?: string) {
    let query = supabase
      .from('user_protocols')
      .select('*')
      .eq('user_id', userId)
      .eq('is_selected', true)

    if (conditionId) {
      query = query.eq('condition_id', conditionId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Health Data Methods
  static async createHealthData(healthData: Omit<HealthData, 'id' | 'created_at' | 'updated_at'>[]) {
    const { data, error } = await supabase
      .from('user_health_data')
      .insert(healthData)
      .select()

    if (error) throw error
    return data
  }

  static async getUserHealthData(userId: string) {
    const { data, error } = await supabase
      .from('user_health_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Tracking Entry Methods
  static async createTrackingEntry(entry: Omit<TrackingEntry, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Creating tracking entry:', entry)
    
    // Validate that data is a proper object
    if (!entry.data || typeof entry.data !== 'object') {
      throw new Error('Tracking entry data must be a valid object')
    }
    
    const { data, error } = await supabase
      .from('tracking_entries')
      .insert([entry])
      .select()
      .single()

    if (error) {
      console.error('Tracking entry creation error:', error)
      throw error
    }
    
    console.log('Tracking entry created successfully:', data)
    
    // 🤖 Trigger automated insights generation (async, don't wait)
    this.triggerInsightsGeneration(data as TrackingEntry).catch(error => {
      console.error('Failed to trigger insights generation:', error)
    })
    
    return data
  }

  /**
   * Trigger automated insights generation for new tracking entries
   */
  private static async triggerInsightsGeneration(entry: TrackingEntry): Promise<void> {
    console.log('🤖 [DEBUG] Triggering insights generation for entry:', entry.tool_id, entry.user_id)
    try {
      // Dynamic import to avoid circular dependencies
      const { HealthInsightsService } = await import('@/lib/services/health-insights')
      const { AlertService } = await import('@/lib/services/alert-service')
      
      // Run insights and alerts generation in parallel
      await Promise.all([
        HealthInsightsService.checkAndGenerateInsights(entry.user_id, entry),
        AlertService.checkAndGenerateAlerts(entry.user_id, entry)
      ])
    } catch (error) {
      console.error('Error in automated insights/alerts generation:', error)
    }
  }

  static async updateTrackingEntry(entryId: string, updates: Partial<TrackingEntry>) {
    console.log('Updating tracking entry:', entryId, updates)
    
    const { data, error } = await supabase
      .from('tracking_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single()

    if (error) {
      console.error('Tracking entry update error:', error)
      throw error
    }
    
    console.log('Tracking entry updated successfully:', data)
    return data
  }

  static async getTrackingEntries(userId: string, toolId?: string, limit = 50) {
    try {
      let query = supabase
        .from('tracking_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (toolId) {
        query = query.eq('tool_id', toolId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error: any) {
      // If table doesn't exist yet, return empty array
      if (error?.code === '42P01') {
        console.warn('Tracking entries table not found - returning empty array')
        return []
      }
      throw error
    }
  }

  static async getRecentTrackingEntries(userId: string, days = 7) {
    try {
      const dateThreshold = new Date()
      dateThreshold.setDate(dateThreshold.getDate() - days)

      const { data, error } = await supabase
        .from('tracking_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', dateThreshold.toISOString())
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      // If table doesn't exist yet, return empty array
      if (error?.code === '42P01') {
        console.warn('Tracking entries table not found - returning empty array')
        return []
      }
      throw error
    }
  }

  // Complete Setup Method - Save all setup data at once
  static async completeUserSetup(setupData: {
    profile: Omit<UserProfile, 'created_at' | 'updated_at'>
    conditions: Array<{
      condition_id: string
      name: string
      category?: string
      description?: string
      is_custom?: boolean
      icon?: string
    }>
    tools: Array<{
      tool_id: string
      tool_name: string
      tool_category?: string
    }>
    informationSources: Array<{
      condition_id: string
      source_id: string
      source_title: string
      source_type: string
      source_content?: string
      source_url?: string
      author?: string
      is_custom?: boolean
    }>
    protocols: Array<{
      condition_id: string
      protocol_id: string
      protocol_name: string
      description?: string
      protocol_type?: string
      steps?: any[]
      is_custom?: boolean
    }>
    healthData: Array<{
      data_type: HealthData['data_type']
      title: string
      description?: string
      content?: string
      file_name?: string
      file_size?: string
      file_url?: string
    }>
  }) {
    const { profile, conditions, tools, informationSources, protocols, healthData } = setupData

    try {
      console.log('Starting user setup with data:', {
        profileId: profile.id,
        conditionsCount: conditions.length,
        toolsCount: tools.length,
        sourcesCount: informationSources.length,
        protocolsCount: protocols.length,
        healthDataCount: healthData.length
      })

      // 1. Create/Update user profile
      console.log('Creating/updating user profile...')
      const userProfile = await this.createUserProfile(profile)
      console.log('User profile created/updated successfully:', userProfile.id)

      // Clear existing setup data (in case user is re-doing setup)
      console.log('Clearing existing setup data...')
      await Promise.all([
        supabase.from('health_conditions').delete().eq('user_id', profile.id),
        supabase.from('user_tools').delete().eq('user_id', profile.id),
        supabase.from('user_information_sources').delete().eq('user_id', profile.id),
        supabase.from('user_protocols').delete().eq('user_id', profile.id),
        supabase.from('user_health_data').delete().eq('user_id', profile.id)
      ])
      console.log('Existing setup data cleared')

      // 2. Create health conditions
      let healthConditions: any[] = []
      if (conditions.length > 0) {
        console.log('Creating health conditions...')
        const conditionsToCreate = conditions.map(condition => ({
          user_id: profile.id,
          ...condition,
          is_active: true
        }))
        console.log('Conditions data:', conditionsToCreate)
        healthConditions = await this.createHealthConditions(conditionsToCreate)
        console.log('Health conditions created successfully:', healthConditions.length)
      }

      // 3. Create user tools
      let userTools: any[] = []
      if (tools.length > 0) {
        console.log('Creating user tools...')
        const toolsToCreate = tools.map(tool => ({
          user_id: profile.id,
          ...tool,
          is_enabled: true
        }))
        console.log('Tools data:', toolsToCreate)
        userTools = await this.createUserTools(toolsToCreate)
        console.log('User tools created successfully:', userTools.length)
      }

      // 4. Create information sources
      let userSources: any[] = []
      if (informationSources.length > 0) {
        console.log('Creating information sources...')
        const sourcesToCreate = informationSources.map(source => ({
          user_id: profile.id,
          ...source,
          is_selected: true
        }))
        console.log('Sources data:', sourcesToCreate)
        userSources = await this.createInformationSources(sourcesToCreate)
        console.log('Information sources created successfully:', userSources.length)
      }

      // 5. Create protocols
      let userProtocols: any[] = []
      if (protocols.length > 0) {
        console.log('Creating protocols...')
        const protocolsToCreate = protocols.map(protocol => ({
          user_id: profile.id,
          ...protocol,
          is_selected: true
        }))
        console.log('Protocols data:', protocolsToCreate)
        userProtocols = await this.createUserProtocols(protocolsToCreate)
        console.log('Protocols created successfully:', userProtocols.length)
      }

      // 6. Create health data
      let userHealthData: any[] = []
      if (healthData.length > 0) {
        console.log('Creating health data...')
        const healthDataToCreate = healthData.map(data => ({
          user_id: profile.id,
          ...data
        }))
        console.log('Health data:', healthDataToCreate)
        userHealthData = await this.createHealthData(healthDataToCreate)
        console.log('Health data created successfully:', userHealthData.length)
      }

      console.log('Setup completed successfully!')
      return {
        profile: userProfile,
        conditions: healthConditions,
        tools: userTools,
        informationSources: userSources,
        protocols: userProtocols,
        healthData: userHealthData
      }
    } catch (error) {
      console.error('Error completing user setup:')
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
      console.error('Full error object:', error)
      
      // Log the specific error details from Supabase
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2))
        if ('code' in error) console.error('Error code:', error.code)
        if ('details' in error) console.error('Error details:', error.details)
        if ('hint' in error) console.error('Error hint:', error.hint)
        if ('message' in error) console.error('Error message:', error.message)
      }
      
      throw error
    }
  }

  // Get complete user data
  static async getUserCompleteData(userId: string) {
    try {
      const [
        profile,
        conditions,
        tools,
        informationSources,
        protocols,
        healthData
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserHealthConditions(userId),
        this.getUserTools(userId),
        this.getUserInformationSources(userId),
        this.getUserProtocols(userId),
        this.getUserHealthData(userId)
      ])

      return {
        profile,
        conditions: conditions || [],
        tools: tools || [],
        informationSources: informationSources || [],
        protocols: protocols || [],
        healthData: healthData || []
      }
    } catch (error) {
      console.error('Error fetching user complete data:', error)
      throw error
    }
  }
}

// Authentication helper functions
export const authHelpers = {
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    return user
  },

  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    // Trim and validate email
    const trimmedEmail = email.trim()
    
    if (!trimmedEmail) {
      throw new Error('Email is required')
    }
    
    if (!trimmedEmail.includes('@')) {
      throw new Error('Please enter a valid email address')
    }
    
    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Please enter a valid email address')
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: metadata
      }
    })
    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
} 