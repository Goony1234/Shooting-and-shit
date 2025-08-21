import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      calibers: {
        Row: {
          id: string
          name: string
          display_name: string
          short_name: string
          bullet_diameter?: number
          case_length?: number
          category: 'rifle' | 'pistol' | 'magnum'
          common_bullet_weights?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          short_name: string
          bullet_diameter?: number
          case_length?: number
          category?: 'rifle' | 'pistol' | 'magnum'
          common_bullet_weights?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          short_name?: string
          bullet_diameter?: number
          case_length?: number
          category?: 'rifle' | 'pistol' | 'magnum'
          common_bullet_weights?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      components: {
        Row: {
          id: string
          name: string
          type: 'brass' | 'powder' | 'primer' | 'bullet'
          cost_per_unit: number
          unit: string
          manufacturer?: string
          notes?: string
          box_price?: number
          quantity_per_box?: number
          caliber_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'brass' | 'powder' | 'primer' | 'bullet'
          cost_per_unit: number
          unit: string
          manufacturer?: string
          notes?: string
          box_price?: number
          quantity_per_box?: number
          caliber_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'brass' | 'powder' | 'primer' | 'bullet'
          cost_per_unit?: number
          unit?: string
          manufacturer?: string
          notes?: string
          box_price?: number
          quantity_per_box?: number
          caliber_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      saved_loads: {
        Row: {
          id: string
          name: string
          caliber: string
          caliber_id?: string
          brass_id?: string
          powder_id: string
          powder_weight: number
          primer_id: string
          bullet_id: string
          total_cost: number
          cost_per_round: number
          notes?: string
          brass_reuse_option?: 'new' | 'reuse' | 'amortize'
          brass_reuse_count?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          caliber: string
          caliber_id?: string
          brass_id?: string
          powder_id: string
          powder_weight: number
          primer_id: string
          bullet_id: string
          total_cost: number
          cost_per_round: number
          notes?: string
          brass_reuse_option?: 'new' | 'reuse' | 'amortize'
          brass_reuse_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          caliber?: string
          caliber_id?: string
          brass_id?: string
          powder_id?: string
          powder_weight?: number
          primer_id?: string
          bullet_id?: string
          total_cost?: number
          cost_per_round?: number
          notes?: string
          brass_reuse_option?: 'new' | 'reuse' | 'amortize'
          brass_reuse_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      factory_ammo: {
        Row: {
          id: string
          name: string
          manufacturer: string
          caliber: string
          caliber_id?: string
          bullet_weight: number
          cost_per_box: number
          rounds_per_box: number
          cost_per_round: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          manufacturer: string
          caliber: string
          caliber_id?: string
          bullet_weight: number
          cost_per_box: number
          rounds_per_box: number
          cost_per_round: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          manufacturer?: string
          caliber?: string
          caliber_id?: string
          bullet_weight?: number
          cost_per_box?: number
          rounds_per_box?: number
          cost_per_round?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
