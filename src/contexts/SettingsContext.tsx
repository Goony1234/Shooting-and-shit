import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { UserSettings } from '../types/index'

interface SettingsContextType {
  settings: UserSettings | null
  loading: boolean
  updateSettings: (updates: Partial<Pick<UserSettings, 'sales_tax_enabled' | 'sales_tax_rate'>>) => Promise<void>
  calculatePriceWithTax: (price: number) => number
  formatPriceWithTax: (price: number, precision?: number) => string
  salesTaxEnabled: boolean
  salesTaxRate: number
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user settings
  const fetchSettings = async () => {
    if (!user) {
      setSettings(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If no settings exist, create default settings
        if (error.code === 'PGRST116') {
          const defaultSettings = {
            user_id: user.id,
            sales_tax_enabled: false,
            sales_tax_rate: 0.0000
          }

          const { data: newSettings, error: createError } = await supabase
            .from('user_settings')
            .insert([defaultSettings])
            .select()
            .single()

          if (createError) {
            console.error('Error creating default settings:', createError)
          } else {
            setSettings(newSettings)
          }
        } else {
          console.error('Error fetching settings:', error)
        }
      } else {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update user settings
  const updateSettings = async (updates: Partial<Pick<UserSettings, 'sales_tax_enabled' | 'sales_tax_rate'>>) => {
    if (!user || !settings) return

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating settings:', error)
        throw error
      }

      setSettings(data)
    } catch (error) {
      console.error('Error in updateSettings:', error)
      throw error
    }
  }

  // Calculate price with tax
  const calculatePriceWithTax = (price: number): number => {
    if (!settings || !settings.sales_tax_enabled || settings.sales_tax_rate <= 0) {
      return price
    }
    return price * (1 + settings.sales_tax_rate)
  }

  // Format price with tax for display
  const formatPriceWithTax = (price: number, precision: number = 4): string => {
    const finalPrice = calculatePriceWithTax(price)
    return `$${finalPrice.toFixed(precision)}`
  }

  // Fetch settings when user changes
  useEffect(() => {
    if (user) {
      fetchSettings()
    } else {
      setSettings(null)
      setLoading(false)
    }
  }, [user])

  const value: SettingsContextType = {
    settings,
    loading,
    updateSettings,
    calculatePriceWithTax,
    formatPriceWithTax,
    salesTaxEnabled: settings?.sales_tax_enabled || false,
    salesTaxRate: settings?.sales_tax_rate || 0
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
