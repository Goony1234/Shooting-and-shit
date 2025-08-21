import { useState, useEffect } from 'react'
import { Save, Calculator } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Component, LoadCalculation, Caliber } from '../types/index'

interface LoadFormData {
  name: string
  caliber: string
  caliber_id: string
  brass_id: string
  powder_id: string
  powder_weight: number
  primer_id: string
  bullet_id: string
  notes: string
  // Brass reuse options
  brass_reuse_option: 'new' | 'reuse' | 'amortize'
  brass_reuse_count: number
}

export default function BulletBuilder() {
  const [components, setComponents] = useState<Component[]>([])
  const [calibers, setCalibers] = useState<Caliber[]>([])
  const [formData, setFormData] = useState<LoadFormData>({
    name: '',
    caliber: '',
    caliber_id: '',
    brass_id: '',
    powder_id: '',
    powder_weight: 0,
    primer_id: '',
    bullet_id: '',
    notes: '',
    brass_reuse_option: 'new',
    brass_reuse_count: 5
  })
  const [calculation, setCalculation] = useState<LoadCalculation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComponents()
    fetchCalibers()
  }, [])

  useEffect(() => {
    calculateCost()
  }, [formData, components])

  const fetchComponents = async () => {
    try {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setComponents(data || [])
    } catch (error) {
      console.error('Error fetching components:', error)
    }
  }

  const fetchCalibers = async () => {
    try {
      const { data, error } = await supabase
        .from('calibers')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setCalibers(data || [])
    } catch (error) {
      console.error('Error fetching calibers:', error)
    }
  }

  const calculateCost = () => {
    // For reused brass, we don't need brass_id to be set
    const needsBrassId = formData.brass_reuse_option !== 'reuse'
    
    if ((needsBrassId && !formData.brass_id) || !formData.powder_id || !formData.primer_id || !formData.bullet_id || !formData.powder_weight) {
      setCalculation(null)
      return
    }

    const brass = formData.brass_id ? components.find(c => c.id === formData.brass_id) : null
    const powder = components.find(c => c.id === formData.powder_id)
    const primer = components.find(c => c.id === formData.primer_id)
    const bullet = components.find(c => c.id === formData.bullet_id)

    if ((needsBrassId && !brass) || !powder || !primer || !bullet) {
      setCalculation(null)
      return
    }

    // Calculate brass cost based on reuse option
    let brass_cost = 0
    if (formData.brass_reuse_option === 'new' && brass) {
      brass_cost = brass.cost_per_unit
    } else if (formData.brass_reuse_option === 'amortize' && brass) {
      brass_cost = brass.cost_per_unit / formData.brass_reuse_count
    }
    // If 'reuse', brass_cost remains 0

    const primer_cost = primer.cost_per_unit
    const bullet_cost = bullet.cost_per_unit
    
    // Convert powder weight from grains to the unit used in cost_per_unit
    // Assuming powder cost is per grain or per pound (7000 grains)
    let powder_cost = 0
    if (powder.unit.toLowerCase().includes('pound') || powder.unit.toLowerCase().includes('lb')) {
      powder_cost = (formData.powder_weight / 7000) * powder.cost_per_unit
    } else {
      // Assume cost is per grain
      powder_cost = formData.powder_weight * powder.cost_per_unit
    }

    const total_cost = brass_cost + powder_cost + primer_cost + bullet_cost
    const cost_per_round = total_cost

    setCalculation({
      brass_cost,
      powder_cost,
      primer_cost,
      bullet_cost,
      total_cost,
      cost_per_round
    })
  }

  const handleSaveLoad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calculation) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('saved_loads')
        .insert([{
          name: formData.name,
          caliber: formData.caliber,
          caliber_id: formData.caliber_id,
          brass_id: formData.brass_reuse_option === 'reuse' ? null : formData.brass_id,
          powder_id: formData.powder_id,
          powder_weight: formData.powder_weight,
          primer_id: formData.primer_id,
          bullet_id: formData.bullet_id,
          total_cost: calculation.total_cost,
          cost_per_round: calculation.cost_per_round,
          notes: formData.notes || null,
          brass_reuse_option: formData.brass_reuse_option,
          brass_reuse_count: formData.brass_reuse_count
        }])

      if (error) throw error

      alert('Load saved successfully!')
      // Reset form
      setFormData({
        name: '',
        caliber: '',
        caliber_id: '',
        brass_id: '',
        powder_id: '',
        powder_weight: 0,
        primer_id: '',
        bullet_id: '',
        notes: '',
        brass_reuse_option: 'new',
        brass_reuse_count: 5
      })
    } catch (error) {
      console.error('Error saving load:', error)
      alert('Error saving load. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getComponentsByType = (type: string) => {
    const allComponents = components.filter(c => c.type === type)
    
    // For brass and bullets, filter by selected caliber if one is chosen
    if ((type === 'brass' || type === 'bullet') && formData.caliber_id) {
      return allComponents.filter(c => 
        c.caliber_id === formData.caliber_id || !c.caliber_id // Include components without caliber specified
      )
    }
    
    return allComponents
  }

  const handleCaliberChange = (caliberId: string) => {
    const selectedCaliber = calibers.find(c => c.id === caliberId)
    
    setFormData({
      ...formData,
      caliber_id: caliberId,
      caliber: selectedCaliber ? selectedCaliber.display_name : '',
      // Reset component selections when caliber changes
      brass_id: '',
      bullet_id: ''
    })
  }

  const getCommonBulletWeights = (caliberId?: string) => {
    if (!caliberId) return []
    const caliber = calibers.find(c => c.id === caliberId)
    if (!caliber || !caliber.common_bullet_weights) return []
    
    try {
      return JSON.parse(caliber.common_bullet_weights) as number[]
    } catch {
      return []
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <Calculator className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Build Your Load</h2>
          </div>

          <form onSubmit={handleSaveLoad} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Load Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., .308 Match Load"
                  required
                />
              </div>

              <div>
                <label htmlFor="caliber" className="block text-sm font-medium text-gray-700">
                  Caliber
                </label>
                <select
                  id="caliber"
                  value={formData.caliber_id}
                  onChange={(e) => handleCaliberChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select caliber...</option>
                  {['rifle', 'pistol', 'magnum'].map(category => {
                    const categoryCalibers = calibers.filter(c => c.category === category)
                    if (categoryCalibers.length === 0) return null
                    
                    return (
                      <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                        {categoryCalibers.map(caliber => (
                          <option key={caliber.id} value={caliber.id}>
                            {caliber.display_name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
                {formData.caliber_id && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">
                      Common bullet weights: {getCommonBulletWeights(formData.caliber_id).join(', ')} grains
                    </div>
                  </div>
                )}
              </div>

              {/* Brass Section with Reuse Options */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Brass Cost Calculation
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="brass_reuse_option"
                        value="new"
                        checked={formData.brass_reuse_option === 'new'}
                        onChange={(e) => setFormData({ ...formData, brass_reuse_option: e.target.value as any })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">New brass (full cost)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="brass_reuse_option"
                        value="reuse"
                        checked={formData.brass_reuse_option === 'reuse'}
                        onChange={(e) => setFormData({ ...formData, brass_reuse_option: e.target.value as any })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Reusing brass (no cost)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="brass_reuse_option"
                        value="amortize"
                        checked={formData.brass_reuse_option === 'amortize'}
                        onChange={(e) => setFormData({ ...formData, brass_reuse_option: e.target.value as any })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Amortize over multiple uses</span>
                    </label>
                  </div>
                  
                  {formData.brass_reuse_option !== 'reuse' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="brass" className="block text-sm font-medium text-gray-700">
                          Brass Type
                        </label>
                        <select
                          id="brass"
                          value={formData.brass_id}
                          onChange={(e) => setFormData({ ...formData, brass_id: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required={formData.brass_reuse_option !== 'reuse'}
                        >
                          <option value="">Select brass...</option>
                          {getComponentsByType('brass').map(component => (
                            <option key={component.id} value={component.id}>
                              {component.manufacturer} {component.name} - ${component.cost_per_unit.toFixed(4)}/{component.unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {formData.brass_reuse_option === 'amortize' && (
                        <div>
                          <label htmlFor="brass_reuse_count" className="block text-sm font-medium text-gray-700">
                            Expected Reuses
                          </label>
                          <input
                            type="number"
                            id="brass_reuse_count"
                            min="1"
                            max="20"
                            value={formData.brass_reuse_count || ''}
                            onChange={(e) => setFormData({ ...formData, brass_reuse_count: parseInt(e.target.value) || 5 })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="e.g., 5"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Cost will be divided by this number
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formData.brass_reuse_option === 'reuse' && (
                    <div className="bg-green-50 rounded-md p-3">
                      <p className="text-sm text-green-800">
                        💡 Using existing brass - no additional cost for this component
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="powder" className="block text-sm font-medium text-gray-700">
                  Powder
                </label>
                <select
                  id="powder"
                  value={formData.powder_id}
                  onChange={(e) => setFormData({ ...formData, powder_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select powder...</option>
                  {getComponentsByType('powder').map(component => (
                    <option key={component.id} value={component.id}>
                      {component.manufacturer} {component.name} - ${component.cost_per_unit.toFixed(4)}/{component.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="powder_weight" className="block text-sm font-medium text-gray-700">
                  Powder Weight (grains)
                </label>
                <input
                  type="number"
                  id="powder_weight"
                  step="0.1"
                  min="0"
                  value={formData.powder_weight || ''}
                  onChange={(e) => setFormData({ ...formData, powder_weight: parseFloat(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 42.5"
                  required
                />
              </div>

              <div>
                <label htmlFor="primer" className="block text-sm font-medium text-gray-700">
                  Primer
                </label>
                <select
                  id="primer"
                  value={formData.primer_id}
                  onChange={(e) => setFormData({ ...formData, primer_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select primer...</option>
                  {getComponentsByType('primer').map(component => (
                    <option key={component.id} value={component.id}>
                      {component.manufacturer} {component.name} - ${component.cost_per_unit.toFixed(4)}/{component.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bullet" className="block text-sm font-medium text-gray-700">
                  Bullet
                </label>
                <select
                  id="bullet"
                  value={formData.bullet_id}
                  onChange={(e) => setFormData({ ...formData, bullet_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select bullet...</option>
                  {getComponentsByType('bullet').map(component => (
                    <option key={component.id} value={component.id}>
                      {component.manufacturer} {component.name} - ${component.cost_per_unit.toFixed(4)}/{component.unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add any notes about this load..."
              />
            </div>

            {calculation && (
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Cost Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-blue-600">
                      Brass
                      {formData.brass_reuse_option === 'reuse' && <span className="block text-xs">(reused)</span>}
                      {formData.brass_reuse_option === 'amortize' && <span className="block text-xs">(÷{formData.brass_reuse_count})</span>}
                    </div>
                    <div className="text-lg font-semibold text-blue-900">
                      ${calculation.brass_cost.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">Powder</div>
                    <div className="text-lg font-semibold text-blue-900">
                      ${calculation.powder_cost.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">Primer</div>
                    <div className="text-lg font-semibold text-blue-900">
                      ${calculation.primer_cost.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-600">Bullet</div>
                    <div className="text-lg font-semibold text-blue-900">
                      ${calculation.bullet_cost.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-center border-l border-blue-200">
                    <div className="text-sm text-blue-600">Total per Round</div>
                    <div className="text-xl font-bold text-blue-900">
                      ${calculation.cost_per_round.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!calculation || loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Load'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
