import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface RateLimitConfig {
  maxActions: number
  timeWindow: number // in milliseconds
  actionType: string
}

interface RateLimitState {
  isLoading: boolean
  remainingActions: number | null
  resetTime: Date | null
  lastError: string | null
}

export const useRateLimit = (config: RateLimitConfig) => {
  const { user } = useAuth()
  const [state, setState] = useState<RateLimitState>({
    isLoading: false,
    remainingActions: null,
    resetTime: null,
    lastError: null
  })
  
  // Add debouncing to prevent rapid successive API calls
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if action is allowed and log it
  const checkAndLogAction = useCallback(async (metadata: Record<string, any> = {}) => {
    if (!user) {
      setState(prev => ({ ...prev, lastError: 'User not authenticated' }))
      return false
    }

    setState(prev => ({ ...prev, isLoading: true, lastError: null }))

    try {
      // Call the database function to check rate limit and log action
      const { data, error } = await supabase.rpc('log_and_check_rate_limit', {
        p_user_id: user.id,
        p_action_type: config.actionType,
        p_ip_address: null, // Could be populated from request headers
        p_user_agent: navigator.userAgent,
        p_metadata: metadata,
        p_max_actions: config.maxActions,
        p_time_window: `${config.timeWindow / 1000} seconds`
      })

      if (error) {
        console.error('Rate limit check error:', error)
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          lastError: 'Rate limit check failed' 
        }))
        return false
      }

      // Only update remaining actions if the action was successful
      // This prevents the redundant API calls
      if (data) {
        await updateRemainingActions(true) // immediate update after successful action
      }

      setState(prev => ({ ...prev, isLoading: false }))
      return data as boolean

    } catch (error) {
      console.error('Rate limiting error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastError: 'Network error during rate limit check' 
      }))
      return false
    }
  }, [user, config, updateRemainingActions])

  // Get remaining actions for this user with debouncing
  const updateRemainingActions = useCallback(async (immediate: boolean = false) => {
    if (!user) return

    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }

    const doUpdate = async () => {
      try {
        // Use the optimized combined function to reduce API calls from 2 to 1
        const { data, error } = await supabase.rpc('get_rate_limit_status', {
          p_user_id: user.id,
          p_action_type: config.actionType,
          p_max_actions: config.maxActions,
          p_time_window: `${config.timeWindow / 1000} seconds`
        })

        if (error) {
          console.error('Error getting rate limit status:', error)
          return
        }

        const status = data?.[0]
        if (status) {
          setState(prev => ({
            ...prev,
            remainingActions: status.remaining_actions,
            resetTime: status.reset_time ? new Date(status.reset_time) : null
          }))
        }

      } catch (error) {
        console.error('Error updating remaining actions:', error)
      }
    }

    if (immediate) {
      await doUpdate()
    } else {
      // Debounce updates to prevent excessive API calls
      updateTimeoutRef.current = setTimeout(doUpdate, 500)
    }
  }, [user, config])

  // Check current rate limit status without logging an action
  const checkRateLimit = useCallback(async () => {
    if (!user) return false

    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_action_type: config.actionType,
        p_max_actions: config.maxActions,
        p_time_window: `${config.timeWindow / 1000} seconds`
      })

      if (error) {
        console.error('Rate limit check error:', error)
        return false
      }

      // Only update remaining actions if we don't already have fresh data
      // This prevents unnecessary API calls
      if (state.remainingActions === null) {
        await updateRemainingActions(true) // immediate update for initial load
      }
      
      return data as boolean

    } catch (error) {
      console.error('Rate limit check error:', error)
      return false
    }
  }, [user, config, updateRemainingActions, state.remainingActions])

  return {
    ...state,
    checkAndLogAction,
    checkRateLimit,
    updateRemainingActions
  }
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  COMPONENT_CREATE: {
    maxActions: 20,
    timeWindow: 60 * 60 * 1000, // 1 hour
    actionType: 'component_create'
  },
  LOAD_CREATE: {
    maxActions: 20,
    timeWindow: 60 * 60 * 1000, // 1 hour
    actionType: 'load_create'
  },
  FACTORY_AMMO_CREATE: {
    maxActions: 15,
    timeWindow: 60 * 60 * 1000, // 1 hour
    actionType: 'factory_ammo_create'
  },
  SEARCH: {
    maxActions: 100,
    timeWindow: 60 * 1000, // 1 minute
    actionType: 'search'
  },
  LOGIN_ATTEMPT: {
    maxActions: 5,
    timeWindow: 15 * 60 * 1000, // 15 minutes
    actionType: 'login_attempt'
  }
} as const
