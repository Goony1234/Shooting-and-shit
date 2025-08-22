import { useState, useEffect } from 'react'
import { Database, Trash2, Eye, Copy, Plus, Save, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useRateLimit, RATE_LIMITS } from '../hooks/useRateLimit'
import type { SavedLoad, Component, LoadCalculation, Caliber } from '../types/index'

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
  brass_reuse_option: 'new' | 'reuse' | 'amortize'
  brass_reuse_count: number
}

export default function SavedLoads() {
  const { user } = useAuth()
  const rateLimit = useRateLimit(RATE_LIMITS.LOAD_CREATE)
  const [savedLoads, setSavedLoads] = useState<SavedLoad[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [calibers, setCalibers] = useState<Caliber[]>([])
  const [selectedLoad, setSelectedLoad] = useState<SavedLoad | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoadBuilder, setShowLoadBuilder] = useState(false)
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
  const [brassReuseCountInput, setBrassReuseCountInput] = useState<string>('5')
  const [calculation, setCalculation] = useState<LoadCalculation | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    Promise.all([fetchSavedLoads(), fetchComponents(), fetchCalibers()])
    loadDuplicateData()
  }, [])

  useEffect(() => {
    // Update rate limit status when component mounts
    if (user) {
      rateLimit.updateRemainingActions()
    }
  }, [user, rateLimit])

  useEffect(() => {
    if (showLoadBuilder) {
      calculateCost()
    }
  }, [formData, components, showLoadBuilder])

  const fetchSavedLoads = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_loads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedLoads(data || [])
    } catch (error) {
      console.error('Error fetching saved loads:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const loadDuplicateData = () => {
    try {
      const duplicateDataStr = sessionStorage.getItem('duplicateLoadData')
      if (duplicateDataStr) {
        const duplicateData = JSON.parse(duplicateDataStr)
        setFormData({
          name: duplicateData.name,
          caliber: duplicateData.caliber,
          caliber_id: duplicateData.caliber_id || '',
          brass_id: duplicateData.brass_id || '',
          powder_id: duplicateData.powder_id,
          powder_weight: duplicateData.powder_weight,
          primer_id: duplicateData.primer_id,
          bullet_id: duplicateData.bullet_id,
          notes: duplicateData.notes || '',
          brass_reuse_option: duplicateData.brass_reuse_option || 'new',
          brass_reuse_count: duplicateData.brass_reuse_count || 5
        })
        setBrassReuseCountInput((duplicateData.brass_reuse_count || 5).toString())
        setShowLoadBuilder(true)
        sessionStorage.removeItem('duplicateLoadData')
      }
    } catch (error) {
      console.error('Error loading duplicate data:', error)
    }
  }

  const calculateCost = () => {
    // For reused brass, we don't need brass_id, but for new/amortized brass we do
    const needsBrassId = formData.brass_reuse_option !== 'reuse'
    
    if ((needsBrassId && !formData.brass_id) || !formData.powder_id || !formData.primer_id || !formData.bullet_id || !formData.powder_weight) {
      setCalculation(null)
      return
    }

    const powder = components.find(c => c.id === formData.powder_id)
    const primer = components.find(c => c.id === formData.primer_id)
    const bullet = components.find(c => c.id === formData.bullet_id)

    if (!powder || !primer || !bullet) {
      setCalculation(null)
      return
    }

    // Calculate brass cost based on reuse option
    let brassCost = 0
    if (formData.brass_reuse_option === 'reuse') {
      brassCost = 0
    } else {
      const brass = components.find(c => c.id === formData.brass_id)
      if (!brass) {
        setCalculation(null)
        return
      }
      
      brassCost = brass.cost_per_unit
      if (formData.brass_reuse_option === 'amortize') {
        brassCost = brass.cost_per_unit / formData.brass_reuse_count
      }
    }

    const powderCost = powder.cost_per_unit * formData.powder_weight
    const primerCost = primer.cost_per_unit
    const bulletCost = bullet.cost_per_unit

    const totalCost = brassCost + powderCost + primerCost + bulletCost

    setCalculation({
      brass_cost: brassCost,
      powder_cost: powderCost,
      primer_cost: primerCost,
      bullet_cost: bulletCost,
      total_cost: totalCost,
      cost_per_round: totalCost
    })
  }

  const handleDelete = async (load: SavedLoad) => {
    if (!confirm(`Are you sure you want to delete "${load.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('saved_loads')
        .delete()
        .eq('id', load.id)

      if (error) throw error
      fetchSavedLoads()
    } catch (error) {
      console.error('Error deleting load:', error)
      alert('Error deleting load. Please try again.')
    }
  }

  const handleDuplicate = (load: SavedLoad) => {
    // Create a template object for the new load
    setFormData({
      name: `${load.name} (Copy)`,
      caliber: load.caliber,
      caliber_id: load.caliber_id || '',
      brass_id: load.brass_id || '',
      powder_id: load.powder_id,
      powder_weight: load.powder_weight,
      primer_id: load.primer_id,
      bullet_id: load.bullet_id,
      notes: load.notes || '',
      brass_reuse_option: load.brass_reuse_option || 'new',
      brass_reuse_count: load.brass_reuse_count || 5
    })
    setBrassReuseCountInput((load.brass_reuse_count || 5).toString())
    
    // Show the load builder form
    setShowLoadBuilder(true)
  }

  const handleSaveLoad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calculation || !user) return

    // Validate brass reuse count if amortizing
    if (formData.brass_reuse_option === 'amortize') {
      const reuseCount = parseInt(brassReuseCountInput)
      if (isNaN(reuseCount) || reuseCount < 1 || reuseCount > 20) {
        alert('Please enter a valid number of reuses (1-20) for brass amortization.')
        return
      }
      // Update the form data with the validated value
      setFormData({ ...formData, brass_reuse_count: reuseCount })
    }

    // Check rate limit
    const canCreate = await rateLimit.checkAndLogAction({
      load_name: formData.name,
      caliber: formData.caliber,
      powder_weight: formData.powder_weight
    })

    if (!canCreate) {
      const resetTime = rateLimit.resetTime
      const resetTimeStr = resetTime ? new Date(resetTime).toLocaleTimeString() : 'soon'
      alert(`Rate limit exceeded. You can create ${rateLimit.remainingActions || 0} more loads. Limit resets at ${resetTimeStr}.`)
      return
    }

    setSaveLoading(true)
    try {
      // Prepare the load data
      const loadData: any = {
        name: formData.name,
        caliber: formData.caliber,
        caliber_id: formData.caliber_id,
        brass_id: formData.brass_reuse_option === 'reuse' ? null : formData.brass_id,
        powder_id: formData.powder_id,
        powder_weight: formData.powder_weight,
        primer_id: formData.primer_id,
        bullet_id: formData.bullet_id,
        notes: formData.notes,
        brass_reuse_option: formData.brass_reuse_option,
        brass_reuse_count: formData.brass_reuse_count,
        total_cost: calculation.total_cost,
        cost_per_round: calculation.total_cost
      }

      // Add created_by if user is available (will be null if column doesn't exist yet)
      if (user?.id) {
        loadData.created_by = user.id
      }

      const { error } = await supabase
        .from('saved_loads')
        .insert([loadData])

      if (error) throw error

      // Reset form and close builder
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
      setBrassReuseCountInput('5')
      setCalculation(null)
      setShowLoadBuilder(false)
      
      // Refresh saved loads
      fetchSavedLoads()
      
      alert('Load saved successfully!')
    } catch (error) {
      console.error('Error saving load:', error)
      alert('Error saving load. Please try again.')
    } finally {
      setSaveLoading(false)
    }
  }

  const resetLoadBuilder = () => {
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
    setBrassReuseCountInput('5')
    setCalculation(null)
    setShowLoadBuilder(false)
  }

  const getComponentName = (id: string | undefined) => {
    if (!id) return 'Unknown'
    const component = components.find(c => c.id === id)
    return component ? `${component.manufacturer || ''} ${component.name}`.trim() : 'Unknown'
  }

  const getBulletDisplayInfo = (id: string | undefined) => {
    if (!id) return 'Unknown'
    const component = components.find(c => c.id === id)
    if (!component) return 'Unknown'
    
    let bulletInfo = `${component.manufacturer || ''} ${component.name}`.trim()
    
    if (component.bullet_type && component.bullet_grain) {
      bulletInfo += ` (${component.bullet_type}, ${component.bullet_grain}gr)`
    } else if (component.bullet_type) {
      bulletInfo += ` (${component.bullet_type})`
    } else if (component.bullet_grain) {
      bulletInfo += ` (${component.bullet_grain}gr)`
    }
    
    return bulletInfo
  }

  const LoadDetailsModal = ({ load, onClose }: { load: SavedLoad, onClose: () => void }) => {
    const brass = components.find(c => c.id === load.brass_id)
    const powder = components.find(c => c.id === load.powder_id)
    const primer = components.find(c => c.id === load.primer_id)

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{load.name}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Caliber:</span>
                <span className="ml-2 text-sm text-gray-900">{load.caliber}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Brass:</span>
                  <div className="mt-1 text-sm text-gray-900">
                    {brass ? `${brass.manufacturer || ''} ${brass.name}`.trim() : 'Unknown'}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Powder:</span>
                  <div className="mt-1 text-sm text-gray-900">
                    {powder ? `${powder.manufacturer || ''} ${powder.name}`.trim() : 'Unknown'}
                    <br />
                    <span className="text-xs text-gray-500">{load.powder_weight} grains</span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Primer:</span>
                  <div className="mt-1 text-sm text-gray-900">
                    {primer ? `${primer.manufacturer || ''} ${primer.name}`.trim() : 'Unknown'}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500">Bullet:</span>
                  <div className="mt-1 text-sm text-gray-900">
                    {getBulletDisplayInfo(load.bullet_id)}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900 mb-2">Cost Analysis</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${load.cost_per_round.toFixed(4)} per round
                </div>
                <div className="text-sm text-blue-600">
                  Total cost: ${load.total_cost.toFixed(4)}
                </div>
              </div>

              {load.notes && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Notes:</span>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {load.notes}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Created: {new Date(load.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Saved Loads</h2>
            <div className="ml-2 text-sm text-gray-500 flex items-center space-x-3">
              <span>({savedLoads.length} loads)</span>
              {user && rateLimit.remainingActions !== null && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span className={`${rateLimit.remainingActions <= 2 ? 'text-red-500' : 'text-gray-500'}`}>
                    {rateLimit.remainingActions}/20 creates left
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowLoadBuilder(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Load
          </button>
        </div>

        {/* Load Builder Form */}
        {showLoadBuilder && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Load</h3>
                <button
                  onClick={resetLoadBuilder}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
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
                      maxLength={255}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                      onChange={(e) => {
                        const selectedCaliber = calibers.find(c => c.id === e.target.value)
                        setFormData({
                          ...formData,
                          caliber_id: e.target.value,
                          caliber: selectedCaliber ? selectedCaliber.display_name : ''
                        })
                      }}
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
                  </div>
                </div>

                {/* Brass Reuse Options - Must come before component selection */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Brass Cost Calculation</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How do you want to calculate brass cost?
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <input
                            id="brass-new"
                            name="brass-reuse"
                            type="radio"
                            checked={formData.brass_reuse_option === 'new'}
                            onChange={() => setFormData({ ...formData, brass_reuse_option: 'new', brass_id: '' })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="brass-new" className="ml-2 block text-sm text-gray-900">
                            New brass (full cost per round)
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="brass-reuse"
                            name="brass-reuse"
                            type="radio"
                            checked={formData.brass_reuse_option === 'reuse'}
                            onChange={() => setFormData({ ...formData, brass_reuse_option: 'reuse', brass_id: '' })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="brass-reuse" className="ml-2 block text-sm text-gray-900">
                            Reused brass (no brass cost)
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="brass-amortize"
                            name="brass-reuse"
                            type="radio"
                            checked={formData.brass_reuse_option === 'amortize'}
                            onChange={() => setFormData({ ...formData, brass_reuse_option: 'amortize', brass_id: '' })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="brass-amortize" className="ml-2 block text-sm text-gray-900">
                            Amortize brass cost over multiple uses
                          </label>
                        </div>
                      </div>
                    </div>

                    {formData.brass_reuse_option === 'amortize' && (
                      <div className="max-w-xs">
                        <label htmlFor="brass_reuse_count" className="block text-sm font-medium text-gray-700">
                          Number of times brass will be reused
                        </label>
                        <input
                          type="text"
                          id="brass_reuse_count"
                          value={brassReuseCountInput}
                          onChange={(e) => {
                            const value = e.target.value
                            // Allow empty string or digits only
                            if (value === '' || /^\d+$/.test(value)) {
                              setBrassReuseCountInput(value)
                              // Update the actual form data only if it's a valid number
                              const numValue = parseInt(value)
                              if (!isNaN(numValue) && numValue >= 1) {
                                setFormData({ ...formData, brass_reuse_count: numValue })
                              }
                            }
                          }}
                          placeholder="Enter number of reuses (1-20)"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Component Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brass Selection - Only show if not reusing brass */}
                  {formData.brass_reuse_option !== 'reuse' && (
                    <div>
                      <label htmlFor="brass" className="block text-sm font-medium text-gray-700">
                        Brass {formData.brass_reuse_option === 'amortize' ? '(cost will be amortized)' : ''}
                      </label>
                      <select
                        id="brass"
                        value={formData.brass_id}
                        onChange={(e) => setFormData({ ...formData, brass_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select brass...</option>
                        {components
                          .filter(c => c.type === 'brass' && (!formData.caliber_id || c.caliber_id === formData.caliber_id))
                          .map(component => (
                            <option key={component.id} value={component.id}>
                              {component.manufacturer} {component.name} - ${component.cost_per_unit.toFixed(4)}/{component.unit}
                              {formData.brass_reuse_option === 'amortize' && ` (${(component.cost_per_unit / formData.brass_reuse_count).toFixed(4)} amortized)`}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Reused Brass Info */}
                  {formData.brass_reuse_option === 'reuse' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Brass
                      </label>
                      <div className="mt-1 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800">
                          Using reused brass - no brass cost will be calculated
                        </p>
                      </div>
                    </div>
                  )}

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
                      {components
                        .filter(c => c.type === 'bullet')
                        .map(component => (
                          <option key={component.id} value={component.id}>
                            {component.manufacturer} {component.name} - ${component.cost_per_unit.toFixed(4)}/{component.unit}
                          </option>
                        ))}
                    </select>
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
                      {components
                        .filter(c => c.type === 'powder')
                        .map(component => (
                          <option key={component.id} value={component.id}>
                            {component.manufacturer} {component.name} - ${component.cost_per_unit.toFixed(6)}/{component.unit}
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
                      min="0.1"
                      value={formData.powder_weight || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        // Allow empty string while typing
                        if (value === '') {
                          setFormData({ ...formData, powder_weight: 0 })
                        } else {
                          const numValue = parseFloat(value)
                          if (!isNaN(numValue) && numValue >= 0) {
                            setFormData({ ...formData, powder_weight: numValue })
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure we have a valid value when user leaves the field
                        const value = parseFloat(e.target.value)
                        if (isNaN(value) || value < 0.1) {
                          setFormData({ ...formData, powder_weight: 0.1 })
                        }
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                      {components
                        .filter(c => c.type === 'primer')
                        .map(component => (
                          <option key={component.id} value={component.id}>
                            {component.manufacturer} {component.name} - ${component.cost_per_unit.toFixed(4)}/{component.unit}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Cost Calculation Display */}
                {calculation && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-sm text-blue-600">Brass</div>
                          <div className="text-lg font-bold text-blue-900">${calculation.brass_cost.toFixed(4)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-blue-600">Powder</div>
                          <div className="text-lg font-bold text-blue-900">${calculation.powder_cost.toFixed(4)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-blue-600">Primer</div>
                          <div className="text-lg font-bold text-blue-900">${calculation.primer_cost.toFixed(4)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-blue-600">Bullet</div>
                          <div className="text-lg font-bold text-blue-900">${calculation.bullet_cost.toFixed(4)}</div>
                        </div>
                      </div>
                      <div className="text-center border-t border-blue-200 pt-4">
                        <div className="text-lg text-blue-600">Total Cost per Round</div>
                        <div className="text-3xl font-bold text-blue-900">${calculation.total_cost.toFixed(4)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes ({formData.notes.length}/300)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.length <= 300) {
                        setFormData({ ...formData, notes: value })
                      }
                    }}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formData.notes.length > 280 
                        ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Optional notes about this load (max 300 characters)..."
                  />
                  {formData.notes.length > 280 && (
                    <p className="mt-1 text-sm text-yellow-600">
                      {300 - formData.notes.length} characters remaining
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetLoadBuilder}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading || !calculation}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveLoading ? 'Saving...' : 'Save Load'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {savedLoads.length === 0 ? (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No saved loads</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first load using the button above.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="block md:hidden space-y-4">
          {savedLoads.map((load) => (
            <div key={load.id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{load.name}</h4>
                  <div className="text-sm text-gray-500 mt-1">{load.caliber}</div>
                  {load.notes && (
                    <div className="text-sm text-gray-600 mt-1 italic">"{load.notes}"</div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedLoad(load)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View details"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(load)}
                    className="text-green-600 hover:text-green-900"
                    title="Duplicate load"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(load)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-center bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600">Cost per Round</div>
                  <div className="text-lg font-bold text-blue-900">
                    ${load.cost_per_round.toFixed(4)}
                  </div>
                </div>
                <div className="text-center bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Created</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(load.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs text-gray-500 mb-2">Components:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-gray-700">Brass:</span>
                    <div className="text-gray-600">{getComponentName(load.brass_id)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Bullet:</span>
                    <div className="text-gray-600">{getBulletDisplayInfo(load.bullet_id)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Powder:</span>
                    <div className="text-gray-600">{getComponentName(load.powder_id)} ({load.powder_weight}gr)</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Primer:</span>
                    <div className="text-gray-600">{getComponentName(load.primer_id)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table layout */}
        <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caliber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Components
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost per Round
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savedLoads.map((load) => (
                  <tr key={load.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{load.name}</div>
                      {load.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {load.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {load.caliber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="font-medium">B:</span> {getComponentName(load.brass_id)}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">P:</span> {getComponentName(load.powder_id)} ({load.powder_weight}gr)
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Pr:</span> {getComponentName(load.primer_id)}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Bu:</span> {getBulletDisplayInfo(load.bullet_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${load.cost_per_round.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(load.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedLoad(load)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(load)}
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="Duplicate load"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(load)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {selectedLoad && (
        <LoadDetailsModal
          load={selectedLoad}
          onClose={() => setSelectedLoad(null)}
        />
      )}
      </div>
    </div>
  )
}
