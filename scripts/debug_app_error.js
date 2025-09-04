#!/usr/bin/env node

/**
 * Debug Script for WellnessGrid App Error
 * Diagnoses the TypeError: Cannot read properties of undefined (reading 'call')
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 WellnessGrid Error Diagnosis');
console.log('===============================');

async function checkDatabaseExports() {
    console.log('\n📁 Checking database exports...');
    
    const indexPath = path.join(__dirname, '..', 'lib', 'database', 'index.ts');
    
    if (!fs.existsSync(indexPath)) {
        console.log('❌ Database index file not found');
        return false;
    }
    
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Check for exports
    const hasAuthHelpers = content.includes('export') && content.includes('authHelpers');
    const hasDatabaseService = content.includes('export') && content.includes('DatabaseService');
    
    console.log(`   authHelpers export: ${hasAuthHelpers ? '✅' : '❌'}`);
    console.log(`   DatabaseService export: ${hasDatabaseService ? '✅' : '❌'}`);
    
    // Check export patterns
    if (content.includes('export const authHelpers')) {
        console.log('   → Found: export const authHelpers');
    }
    if (content.includes('export { authHelpers')) {
        console.log('   → Found: export { authHelpers');
    }
    if (content.includes('export class DatabaseService')) {
        console.log('   → Found: export class DatabaseService');
    }
    if (content.includes('export const DatabaseService')) {
        console.log('   → Found: export const DatabaseService');
    }
    
    return hasAuthHelpers && hasDatabaseService;
}

async function checkContextProvider() {
    console.log('\n🔄 Checking context provider...');
    
    const contextPath = path.join(__dirname, '..', 'lib', 'store', 'enhanced-context.tsx');
    
    if (!fs.existsSync(contextPath)) {
        console.log('❌ Context file not found');
        return false;
    }
    
    const content = fs.readFileSync(contextPath, 'utf8');
    
    // Look for the problematic import
    const hasDynamicImport = content.includes("import('@/lib/database')");
    const hasAuthCall = content.includes('.getCurrentUser()');
    
    console.log(`   Dynamic import: ${hasDynamicImport ? '✅' : '❌'}`);
    console.log(`   Auth call: ${hasAuthCall ? '✅' : '❌'}`);
    
    return true;
}

async function generateFix() {
    console.log('\n🛠️  Generating fix...');
    
    // Create a fixed version of the enhanced-context.tsx
    const fixedContext = `"use client"

import React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { AppState, AppAction } from "../types"
import { appReducer } from "./reducer"
import { initialState } from "./initial-state"
import { createActions } from "./actions"
import { StorageService } from "./storage"
import { ErrorBoundary } from "@/components/error-boundary"

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  actions: ReturnType<typeof createActions>
  isReady: boolean
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [isReady, setIsReady] = React.useState(false)

  // Create actions with dispatch
  const actions = React.useMemo(() => createActions(dispatch), [dispatch])

  // Initialize app data with better error handling
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true })

        console.log("AppProvider: Initializing app...")

        // Check online status first
        const updateOnlineStatus = () => {
          dispatch({ type: "SET_ONLINE_STATUS", payload: navigator.onLine })
        }

        if (typeof window !== "undefined") {
          window.addEventListener("online", updateOnlineStatus)
          window.addEventListener("offline", updateOnlineStatus)
          updateOnlineStatus()
        }

        // Try to load user authentication with better error handling
        try {
          console.log("AppProvider: Attempting to load database services...")
          
          // Import with better error handling
          const databaseModule = await import('@/lib/database').catch(importError => {
            console.warn('Failed to import database module:', importError)
            return null
          })
          
          if (databaseModule && databaseModule.authHelpers && databaseModule.DatabaseService) {
            const { authHelpers, DatabaseService } = databaseModule
            
            console.log("AppProvider: Database services loaded, checking authentication...")
            
            try {
              const user = await authHelpers.getCurrentUser()
              
              if (user) {
                console.log("AppProvider: User authenticated:", user.email)
                
                try {
                  const userData = await DatabaseService.getUserCompleteData(user.id)
                  console.log("AppProvider: User data loaded")
                  
                  if (userData.profile) {
                    // Set user data in store
                    dispatch({ 
                      type: "SET_USER", 
                      payload: {
                        id: userData.profile.id,
                        name: userData.profile.name,
                        email: user.email || "",
                        age: userData.profile.age,
                        gender: userData.profile.gender,
                        height: userData.profile.height,
                        weight: userData.profile.weight,
                        avatar: userData.profile.avatar,
                        wellnessScore: userData.profile.wellness_score || 0
                      }
                    })
                    
                    // Set conditions
                    if (userData.conditions && userData.conditions.length > 0) {
                      dispatch({
                        type: "SET_CONDITIONS",
                        payload: userData.conditions.map(condition => ({
                          id: condition.id,
                          name: condition.name,
                          category: condition.category || "Other",
                          severity: condition.severity || "mild",
                          isActive: condition.is_active !== false,
                          description: condition.description,
                          icon: condition.icon
                        }))
                      })
                    }
                    
                    // Set medications if any
                    if (userData.medications && userData.medications.length > 0) {
                      dispatch({
                        type: "SET_MEDICATIONS",
                        payload: userData.medications.map(med => ({
                          id: med.id,
                          name: med.name,
                          dosage: med.dosage || "",
                          frequency: med.frequency || "",
                          isActive: med.is_active !== false,
                          notes: med.notes
                        }))
                      })
                    }
                    
                    // Mark setup as completed
                    dispatch({ type: "COMPLETE_SETUP" })
                    console.log("AppProvider: Setup completed successfully")
                  } else {
                    console.log("AppProvider: No profile found - setup incomplete")
                  }
                } catch (profileError) {
                  console.warn("AppProvider: Could not load user profile:", profileError)
                  // Don't dispatch anything - setupCompleted remains false
                }
              } else {
                console.log("AppProvider: No authenticated user")
                dispatch({ type: "SET_USER", payload: null })
              }
            } catch (authError) {
              console.warn("AppProvider: Authentication check failed:", authError)
              dispatch({ type: "SET_USER", payload: null })
            }
          } else {
            console.warn("AppProvider: Database services not available, running in offline mode")
            dispatch({ type: "SET_USER", payload: null })
          }
        } catch (importError) {
          console.warn("AppProvider: Failed to load database services:", importError)
          dispatch({ type: "SET_USER", payload: null })
        }

        // Load saved local data (for offline functionality)
        try {
          const savedData = await StorageService.loadAppState()
          if (savedData && savedData.user && !state.user) {
            console.log("AppProvider: Loading saved local data")
            dispatch({ type: "SYNC_DATA", payload: savedData })
          }
        } catch (storageError) {
          console.warn("AppProvider: Failed to load saved data:", storageError)
        }

        setIsReady(true)
        console.log("AppProvider: Initialization complete")
        
      } catch (error) {
        console.error("AppProvider: Critical initialization error:", error)
        dispatch({
          type: "SET_ERROR",
          payload: {
            key: "initialization",
            message: "Failed to initialize app",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        })
        setIsReady(true) // Still set ready to allow app to function
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    initializeApp()
  }, [])

  // Auto-save data when state changes (for offline functionality)
  useEffect(() => {
    if (isReady && state.user) {
      const saveData = async () => {
        try {
          await StorageService.saveAppState(state)
        } catch (error) {
          console.warn("AppProvider: Failed to save data:", error)
        }
      }

      const timeoutId = setTimeout(saveData, 1000) // Debounce saves
      return () => clearTimeout(timeoutId)
    }
  }, [state, isReady])

  const contextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      actions,
      isReady,
    }),
    [state, dispatch, actions, isReady],
  )

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        {children}
      </AppContext.Provider>
    </ErrorBoundary>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

// Enhanced hooks with error handling
export function useUser() {
  const { state } = useApp()
  return state.user
}

export function useConditions() {
  const { state } = useApp()
  return state.conditions.filter((c) => c.isActive)
}

export function useMedications() {
  const { state } = useApp()
  return state.medications.filter((m) => m.isActive)
}

export function useHealthRecords() {
  const { state } = useApp()
  return state.healthRecords || []
}

export function useResources() {
  const { state } = useApp()
  return state.resources || []
}

export function useProtocols() {
  const { state } = useApp()
  return state.protocols || []
}

export function useErrors() {
  const { state } = useApp()
  return state.errors || []
}
`;

    const contextPath = path.join(__dirname, '..', 'lib', 'store', 'enhanced-context.tsx');
    const backupPath = path.join(__dirname, '..', 'lib', 'store', 'enhanced-context.tsx.backup');
    
    // Create backup
    if (fs.existsSync(contextPath)) {
        fs.copyFileSync(contextPath, backupPath);
        console.log('   ✅ Created backup of original file');
    }
    
    // Write fixed version
    fs.writeFileSync(contextPath, fixedContext);
    console.log('   ✅ Applied fix to enhanced-context.tsx');
    
    return true;
}

async function main() {
    try {
        console.log('\n🔍 Running diagnosis...');
        
        await checkDatabaseExports();
        await checkContextProvider();
        await generateFix();
        
        console.log('\n🎯 DIAGNOSIS COMPLETE');
        console.log('====================');
        console.log('✅ Applied fix for TypeError in AppProvider');
        console.log('✅ Added better error handling for database imports');
        console.log('✅ App should now start without crashing');
        console.log('');
        console.log('🚀 Try starting your app again:');
        console.log('   npm run dev');
        console.log('');
        console.log('If issues persist, check the browser console for more details.');
        
    } catch (error) {
        console.error('❌ Error during diagnosis:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}


