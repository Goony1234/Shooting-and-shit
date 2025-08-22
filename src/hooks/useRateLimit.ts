import { useState, useCallback } from 'react'
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

      // Update remaining actions
      await updateRemainingActions()

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
  }, [user, config])

  // Get remaining actions for this user
  const updateRemainingActions = useCallback(async () => {
    if (!user) return

    try {
      const { data: remaining } = await supabase.rpc('get_remaining_actions', {
        p_user_id: user.id,
        p_action_type: config.actionType,
        p_max_actions: config.maxActions,
        p_time_window: `${config.timeWindow / 1000} seconds`
      })

      const { data: resetTime } = await supabase.rpc('get_rate_limit_reset_time', {
        p_user_id: user.id,
        p_action_type: config.actionType,
        p_time_window: `${config.timeWindow / 1000} seconds`
      })

      setState(prev => ({
        ...prev,
        remainingActions: remaining as number,
        resetTime: resetTime ? new Date(resetTime as string) : null
      }))

    } catch (error) {
      console.error('Error updating remaining actions:', error)
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

      await updateRemainingActions()
      return data as boolean

    } catch (error) {
      console.error('Rate limit check error:', error)
      return false
    }
  }, [user, config, updateRemainingActions])

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
