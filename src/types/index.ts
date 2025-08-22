export interface Caliber {
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

export interface Component {
  id: string
  name: string
  type: 'brass' | 'powder' | 'primer' | 'bullet'
  cost_per_unit: number
  unit: string
  manufacturer?: string
  vendor?: string
  notes?: string
  box_price?: number
  quantity_per_box?: number
  caliber_id?: string
  bullet_type?: string
  bullet_grain?: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SavedLoad {
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
  user_id?: string
  created_at: string
  updated_at: string
}

export interface FactoryAmmo {
  id: string
  name: string
  manufacturer: string
  caliber: string
  caliber_id?: string
  bullet_weight: number
  cost_per_box: number
  rounds_per_box: number
  cost_per_round: number
  vendor?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface LoadCalculation {
  brass_cost: number
  powder_cost: number
  primer_cost: number
  bullet_cost: number
  total_cost: number
  cost_per_round: number
}

export interface UserSettings {
  id: string
  user_id: string
  sales_tax_enabled: boolean
  sales_tax_rate: number
  created_at: string
  updated_at: string
}

// Load Development Types
export interface Firearm {
  id: string
  created_by: string
  name: string
  manufacturer?: string
  model?: string
  caliber_id?: string
  caliber: string
  barrel_length?: number
  barrel_twist_rate?: string
  action_type?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface LoadDevelopmentSession {
  id: string
  created_by: string
  firearm_id: string
  name: string
  description?: string
  bullet_id?: string
  powder_id?: string
  case_id?: string
  primer_id?: string
  goal?: string
  testing_variable?: string
  status: 'active' | 'completed' | 'paused' | 'archived'
  created_at: string
  updated_at: string
  completed_at?: string
  
  // Joined data
  firearm?: Firearm
  bullet?: Component
  powder?: Component
  case?: Component
  primer?: Component
}

export interface LoadTest {
  id: string
  session_id: string
  created_by: string
  test_number: number
  test_name?: string
  
  // Load specifications
  powder_charge: number
  bullet_seating_depth?: number
  case_overall_length?: number
  
  // Performance results
  shot_count: number
  average_velocity?: number
  velocity_std_dev?: number
  extreme_spread?: number
  group_size?: number
  group_size_moa?: number
  shot_velocities: number[]
  
  // Environmental conditions
  temperature?: number
  humidity?: number
  barometric_pressure?: number
  wind_speed?: number
  wind_direction?: string
  
  // Range conditions
  distance_yards?: number
  target_type?: string
  
  notes?: string
  created_at: string
  updated_at: string
}

export interface WeatherCondition {
  id: string
  session_id?: string
  load_test_id?: string
  created_by: string
  
  // Location
  latitude?: number
  longitude?: number
  location_name?: string
  
  // Weather data
  temperature: number
  feels_like?: number
  humidity: number
  barometric_pressure: number
  wind_speed?: number
  wind_direction?: number
  wind_direction_text?: string
  wind_gust?: number
  visibility?: number
  uv_index?: number
  cloud_cover?: number
  precipitation?: number
  precipitation_type?: string
  dew_point?: number
  weather_description?: string
  weather_icon?: string
  
  // API metadata
  api_provider?: string
  api_response?: any
  weather_timestamp: string
  created_at: string
}
