import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Package, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Component, Caliber } from '../types/index'

interface ComponentFormData {
  name: string
  type: 'brass' | 'powder' | 'primer' | 'bullet'
  cost_per_unit: number
  unit: string
  manufacturer: string
  notes: string
  caliber_id?: string
  // For bulk pricing calculation
  box_price?: number
  quantity_per_box?: number
}

export default function ComponentManager() {
  const { user } = useAuth()
  const [components, setComponents] = useState<Component[]>([])
  const [calibers, setCalibers] = useState<Caliber[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingComponent, setEditingComponent] = useState<Component | null>(null)
  const [formData, setFormData] = useState<ComponentFormData>({
    name: '',
    type: 'brass',
    cost_per_unit: 0,
    unit: '',
    manufacturer: '',
    notes: '',
    caliber_id: undefined,
    box_price: undefined,
    quantity_per_box: undefined
  })
  const [useBulkPricing, setUseBulkPricing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComponents()
    fetchCalibers()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Calculate cost per unit from bulk pricing if provided
    let finalCostPerUnit = formData.cost_per_unit
    let boxPrice = undefined
    let quantityPerBox = undefined
    
    if (useBulkPricing && formData.box_price && formData.quantity_per_box) {
      if (formData.type === 'powder') {
        // For powder: convert pounds to grains (1 pound = 7000 grains)
        const totalGrains = formData.quantity_per_box * 7000
        finalCostPerUnit = formData.box_price / totalGrains
        boxPrice = formData.box_price
        quantityPerBox = totalGrains // Store total grains for reference
      } else {
        // For other components: standard calculation
        finalCostPerUnit = formData.box_price / formData.quantity_per_box
        boxPrice = formData.box_price
        quantityPerBox = formData.quantity_per_box
      }
    }

    try {
      if (editingComponent) {
        // Update existing component
        const { error } = await supabase
          .from('components')
          .update({
            name: formData.name,
            type: formData.type,
            cost_per_unit: finalCostPerUnit,
            unit: formData.unit,
            manufacturer: formData.manufacturer || null,
            notes: formData.notes || null,
            box_price: boxPrice || null,
            quantity_per_box: quantityPerBox || null,
            caliber_id: formData.caliber_id || null
          })
          .eq('id', editingComponent.id)

        if (error) throw error
      } else {
        // Create new component
        const { error } = await supabase
          .from('components')
          .insert([{
            name: formData.name,
            type: formData.type,
            cost_per_unit: finalCostPerUnit,
            unit: formData.unit,
            manufacturer: formData.manufacturer || null,
            notes: formData.notes || null,
            box_price: boxPrice || null,
            quantity_per_box: quantityPerBox || null,
            caliber_id: formData.caliber_id || null,
            created_by: user?.id
          }])

        if (error) throw error
      }

      // Reset form and refresh data
      setFormData({
        name: '',
        type: 'brass',
        cost_per_unit: 0,
        unit: '',
        manufacturer: '',
        notes: '',
        caliber_id: undefined,
        box_price: undefined,
        quantity_per_box: undefined
      })
      setUseBulkPricing(false)
      setShowForm(false)
      setEditingComponent(null)
      fetchComponents()
    } catch (error) {
      console.error('Error saving component:', error)
      alert('Error saving component. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (component: Component) => {
    setEditingComponent(component)
    const hasBulkPricing = component.box_price && component.quantity_per_box
    
    // For powder components, convert grains back to pounds for editing
    let quantityForForm = component.quantity_per_box
    if (component.type === 'powder' && component.quantity_per_box) {
      quantityForForm = component.quantity_per_box / 7000 // Convert grains back to pounds
    }
    
    setFormData({
      name: component.name,
      type: component.type,
      cost_per_unit: component.cost_per_unit,
      unit: component.unit,
      manufacturer: component.manufacturer || '',
      notes: component.notes || '',
      caliber_id: component.caliber_id || undefined,
      box_price: component.box_price || undefined,
      quantity_per_box: quantityForForm || undefined
    })
    setUseBulkPricing(!!hasBulkPricing)
    setShowForm(true)
  }

  const handleDelete = async (component: Component) => {
    if (!confirm(`Are you sure you want to delete "${component.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('components')
        .delete()
        .eq('id', component.id)

      if (error) throw error
      fetchComponents()
    } catch (error) {
      console.error('Error deleting component:', error)
      alert('Error deleting component. It may be used in saved loads.')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'brass': return 'bg-yellow-100 text-yellow-800'
      case 'powder': return 'bg-green-100 text-green-800'
      case 'primer': return 'bg-red-100 text-red-800'
      case 'bullet': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCaliberName = (caliberId?: string) => {
    if (!caliberId) return null
    const caliber = calibers.find(c => c.id === caliberId)
    return caliber ? caliber.display_name : null
  }

  const isOwnComponent = (component: Component) => {
    return component.created_by === user?.id
  }

  const groupedComponents = components.reduce((acc, component) => {
    if (!acc[component.type]) {
      acc[component.type] = []
    }
    acc[component.type].push(component)
    return acc
  }, {} as Record<string, Component[]>)

  return (
    <div className="h-full px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Component Manager</h2>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingComponent(null)
            setFormData({
              name: '',
              type: 'brass',
              cost_per_unit: 0,
              unit: '',
              manufacturer: '',
              notes: '',
              caliber_id: undefined,
              box_price: undefined,
              quantity_per_box: undefined
            })
            setUseBulkPricing(false)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Component
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingComponent ? 'Edit Component' : 'Add New Component'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Component Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="brass">Brass</option>
                    <option value="powder">Powder</option>
                    <option value="primer">Primer</option>
                    <option value="bullet">Bullet</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Caliber selection for brass and bullets */}
                {(formData.type === 'brass' || formData.type === 'bullet') && (
                  <div>
                    <label htmlFor="caliber" className="block text-sm font-medium text-gray-700">
                      Caliber {formData.type === 'brass' ? '(Required for Brass)' : '(Optional for Bullets)'}
                    </label>
                    <select
                      id="caliber"
                      value={formData.caliber_id || ''}
                      onChange={(e) => setFormData({ ...formData, caliber_id: e.target.value || undefined })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required={formData.type === 'brass'}
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
                    {formData.type === 'brass' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Brass is caliber-specific and must be matched to the correct caliber
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                    Unit of Measurement
                  </label>
                  <input
                    type="text"
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., piece, grain, pound"
                    required
                  />
                </div>
              </div>

              {/* Pricing Section */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="use-bulk-pricing"
                    checked={useBulkPricing}
                    onChange={(e) => setUseBulkPricing(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="use-bulk-pricing" className="ml-2 block text-sm text-gray-900">
                    {formData.type === 'powder' ? 'Calculate from bottle/pound pricing' : 'Calculate from box/bulk pricing'}
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {useBulkPricing ? (
                    <>
                      {formData.type === 'powder' ? (
                        // Special handling for powder (pounds to grains conversion)
                        <>
                          <div>
                            <label htmlFor="box_price" className="block text-sm font-medium text-gray-700">
                              Bottle/Container Price ($)
                            </label>
                            <input
                              type="number"
                              id="box_price"
                              step="0.01"
                              min="0"
                              value={formData.box_price || ''}
                              onChange={(e) => setFormData({ ...formData, box_price: parseFloat(e.target.value) || undefined })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="e.g., 35.99"
                              required={useBulkPricing}
                            />
                          </div>
                          <div>
                            <label htmlFor="quantity_per_box" className="block text-sm font-medium text-gray-700">
                              Weight in Pounds
                            </label>
                            <input
                              type="number"
                              id="quantity_per_box"
                              step="0.1"
                              min="0.1"
                              value={formData.quantity_per_box || ''}
                              onChange={(e) => setFormData({ ...formData, quantity_per_box: parseFloat(e.target.value) || undefined })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="e.g., 1, 8"
                              required={useBulkPricing}
                            />
                          </div>
                          {formData.box_price && formData.quantity_per_box && (
                            <div className="md:col-span-2">
                              <div className="bg-blue-50 rounded-md p-3 space-y-1">
                                <p className="text-sm text-blue-900">
                                  Total grains: <strong>{(formData.quantity_per_box * 7000).toLocaleString()}</strong> grains ({formData.quantity_per_box} lbs × 7000)
                                </p>
                                <p className="text-sm text-blue-900">
                                  Calculated cost per grain: <strong>${(formData.box_price / (formData.quantity_per_box * 7000)).toFixed(6)}</strong> per grain
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        // Standard bulk pricing for other components
                        <>
                          <div>
                            <label htmlFor="box_price" className="block text-sm font-medium text-gray-700">
                              Box/Package Price ($)
                            </label>
                            <input
                              type="number"
                              id="box_price"
                              step="0.01"
                              min="0"
                              value={formData.box_price || ''}
                              onChange={(e) => setFormData({ ...formData, box_price: parseFloat(e.target.value) || undefined })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="e.g., 64.99"
                              required={useBulkPricing}
                            />
                          </div>
                          <div>
                            <label htmlFor="quantity_per_box" className="block text-sm font-medium text-gray-700">
                              Quantity per Box
                            </label>
                            <input
                              type="number"
                              id="quantity_per_box"
                              step="1"
                              min="1"
                              value={formData.quantity_per_box || ''}
                              onChange={(e) => setFormData({ ...formData, quantity_per_box: parseInt(e.target.value) || undefined })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="e.g., 1000"
                              required={useBulkPricing}
                            />
                          </div>
                          {formData.box_price && formData.quantity_per_box && (
                            <div className="md:col-span-2">
                              <div className="bg-blue-50 rounded-md p-3">
                                <p className="text-sm text-blue-900">
                                  Calculated cost per unit: <strong>${(formData.box_price / formData.quantity_per_box).toFixed(4)}</strong> per {formData.unit || 'unit'}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div>
                      <label htmlFor="cost_per_unit" className="block text-sm font-medium text-gray-700">
                        Cost per Unit ($)
                      </label>
                      <input
                        type="number"
                        id="cost_per_unit"
                        step="0.0001"
                        min="0"
                        value={formData.cost_per_unit || ''}
                        onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required={!useBulkPricing}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingComponent(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingComponent ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedComponents).map(([type, typeComponents]) => (
          <div key={type} className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                {type} ({typeComponents.length})
              </h3>
              {/* Mobile-friendly card layout */}
              <div className="block md:hidden space-y-3">
                {typeComponents.map((component) => (
                  <div key={component.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(component.type)}`}>
                          {component.type}
                        </span>
                        <h4 className="ml-2 text-sm font-medium text-gray-900">
                          {component.name}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isOwnComponent(component) ? (
                          <>
                            <button
                              onClick={() => handleEdit(component)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(component)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">View only</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {component.manufacturer && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Manufacturer:</span>
                          <span className="text-gray-900">{component.manufacturer}</span>
                        </div>
                      )}
                      
                      {getCaliberName(component.caliber_id) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Caliber:</span>
                          <span className="text-gray-900">{getCaliberName(component.caliber_id)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cost:</span>
                        <div className="text-right">
                          <div className="text-gray-900 font-medium">
                            ${component.cost_per_unit.toFixed(component.type === 'powder' ? 6 : 4)} / {component.unit}
                          </div>
                          {component.box_price && component.quantity_per_box && (
                            <div className="text-xs text-gray-500">
                              {component.type === 'powder' ? (
                                <>Bottle: ${component.box_price.toFixed(2)} / {(component.quantity_per_box / 7000).toFixed(1)} lbs</>
                              ) : (
                                <>Box: ${component.box_price.toFixed(2)} / {component.quantity_per_box} units</>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created by:</span>
                        <div className="flex items-center">
                          {isOwnComponent(component) ? (
                            <>
                              <User className="h-3 w-3 text-blue-600 mr-1" />
                              <span className="text-blue-600 font-medium text-xs">You</span>
                            </>
                          ) : component.created_by ? (
                            <>
                              <User className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-xs">Community</span>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">System</span>
                          )}
                        </div>
                      </div>
                      
                      {component.notes && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-gray-500 text-xs">Notes:</span>
                          <p className="text-gray-900 text-xs mt-1">{component.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manufacturer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Caliber
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost per Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {typeComponents.map((component) => (
                      <tr key={component.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(component.type)}`}>
                              {component.type}
                            </span>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {component.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {component.manufacturer || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCaliberName(component.caliber_id) || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            ${component.cost_per_unit.toFixed(component.type === 'powder' ? 6 : 4)} / {component.unit}
                          </div>
                          {component.box_price && component.quantity_per_box && (
                            <div className="text-xs text-gray-500">
                              {component.type === 'powder' ? (
                                <>Bottle: ${component.box_price.toFixed(2)} / {(component.quantity_per_box / 7000).toFixed(1)} lbs</>
                              ) : (
                                <>Box: ${component.box_price.toFixed(2)} / {component.quantity_per_box} units</>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {isOwnComponent(component) ? (
                              <>
                                <User className="h-3 w-3 text-blue-600 mr-1" />
                                <span className="text-blue-600 font-medium">You</span>
                              </>
                            ) : component.created_by ? (
                              <>
                                <User className="h-3 w-3 text-gray-400 mr-1" />
                                <span>Community</span>
                              </>
                            ) : (
                              <span className="text-gray-400">System</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {component.notes || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isOwnComponent(component) ? (
                            <>
                              <button
                                onClick={() => handleEdit(component)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(component)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs">View only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
