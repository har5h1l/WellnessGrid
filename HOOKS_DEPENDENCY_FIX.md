# React Hooks Dependency Fix

## Problem
**TypeError: Cannot read properties of undefined (reading 'call')**

This error occurred when opening the insights page due to a React hooks dependency and ordering issue in the `DashboardWrapper` component.

## Root Cause Analysis ✅

### Issue: Hook Definition Order Problem
```typescript
// ❌ BEFORE - Broken Hook Order
const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
  // ... code that calls fetchFreshData()
  await fetchFreshData(true) // ❌ fetchFreshData not defined yet!
}, [userId, lastFetchTime, isFetching])

const fetchFreshData = useCallback(async (showLoading = true) => {
  // ... actual implementation
}, [userId, isFetching])
```

### Problem Details:
1. **`fetchAnalyticsData`** was defined first (line 23)
2. **`fetchFreshData`** was defined later (line 81)
3. But **`fetchAnalyticsData`** tried to call **`fetchFreshData`** on lines 63 and 70
4. Result: **`fetchFreshData` was undefined** when `fetchAnalyticsData` executed

## Solution Applied ✅

### Fixed Hook Order:
```typescript
// ✅ AFTER - Correct Hook Order  
const fetchFreshData = useCallback(async (showLoading = true) => {
  // ... implementation
}, [userId, isFetching])

const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
  // ... code that calls fetchFreshData()
  await fetchFreshData(true) // ✅ fetchFreshData is now defined!
}, [userId, lastFetchTime, analyticsData, isFetching, fetchFreshData])
```

### Dependencies Fixed:
```typescript
// ✅ Proper dependency arrays:
const fetchFreshData = useCallback(async (showLoading = true) => {
  // ... 
}, [userId, isFetching])

const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
  // ...
}, [userId, lastFetchTime, analyticsData, isFetching, fetchFreshData])

const generateInsights = useCallback(async () => {
  // ...
}, [userId, fetchFreshData]) // Added fetchFreshData dependency

// useEffect now properly includes fetchAnalyticsData
useEffect(() => {
  fetchAnalyticsData(false)
}, [userId, fetchAnalyticsData])
```

## Changes Made:

1. **Moved `fetchFreshData` definition** to line 23 (before `fetchAnalyticsData`)
2. **Added missing dependencies** to all useCallback hooks
3. **Updated useEffect dependencies** to include `fetchAnalyticsData`
4. **Fixed circular dependency issues** by proper hook ordering

## Technical Details

### React Hook Rules Refresher:
1. **Hooks must be called in the same order** every render
2. **Dependencies must include all values from component scope** used inside the effect
3. **useCallback dependencies** should include all external values used in the callback
4. **Hooks cannot call other hooks that are defined later**

### Dependency Chain:
```
fetchFreshData (no external deps except userId, isFetching)
  ↓
fetchAnalyticsData (depends on fetchFreshData + other state)
  ↓
generateInsights (depends on fetchFreshData)
  ↓
useEffect (depends on fetchAnalyticsData)
```

## Testing
- ✅ No more TypeError when opening insights page
- ✅ No ESLint errors or warnings  
- ✅ All hook dependencies properly declared
- ✅ Component renders successfully

## Prevention
To avoid this in the future:
1. **Define hooks in dependency order** (dependencies first)
2. **Always include all dependencies** in useCallback/useEffect arrays
3. **Use ESLint exhaustive-deps rule** to catch missing dependencies
4. **Test page loads after hook changes**

---
**Fixed**: August 31, 2025  
**Files Changed**: `components/analytics/dashboard-wrapper.tsx`  
**Status**: ✅ Resolved



