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
