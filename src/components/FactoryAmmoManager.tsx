import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Target, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { FactoryAmmo, Caliber } from '../types/index'

interface FactoryAmmoFormData {
  name: string
  manufacturer: string
  caliber: string
  caliber_id: string
  bullet_weight: number
  cost_per_box: number
  rounds_per_box: number
}

export default function FactoryAmmoManager() {
  const { user } = useAuth()
  const [factoryAmmo, setFactoryAmmo] = useState<FactoryAmmo[]>([])
  const [calibers, setCalibers] = useState<Caliber[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAmmo, setEditingAmmo] = useState<FactoryAmmo | null>(null)
  const [formData, setFormData] = useState<FactoryAmmoFormData>({
    name: '',
    manufacturer: '',
    caliber: '',
    caliber_id: '',
    bullet_weight: 0,
    cost_per_box: 0,
    rounds_per_box: 20
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFactoryAmmo()
    fetchCalibers()
  }, [])

  const fetchFactoryAmmo = async () => {
    try {
      const { data, error } = await supabase
        .from('factory_ammo')
        .select('*')
        .order('caliber', { ascending: true })
        .order('manufacturer', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setFactoryAmmo(data || [])
    } catch (error) {
      console.error('Error fetching factory ammo:', error)
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

    try {
      if (editingAmmo) {
        // Update existing factory ammo
        const { error } = await supabase
          .from('factory_ammo')
          .update({
            name: formData.name,
            manufacturer: formData.manufacturer,
            caliber: formData.caliber,
            caliber_id: formData.caliber_id,
            bullet_weight: formData.bullet_weight,
            cost_per_box: formData.cost_per_box,
            rounds_per_box: formData.rounds_per_box
          })
          .eq('id', editingAmmo.id)

        if (error) throw error
      } else {
        // Create new factory ammo
        const { error } = await supabase
          .from('factory_ammo')
          .insert([{
            name: formData.name,
            manufacturer: formData.manufacturer,
            caliber: formData.caliber,
            caliber_id: formData.caliber_id,
            bullet_weight: formData.bullet_weight,
            cost_per_box: formData.cost_per_box,
            rounds_per_box: formData.rounds_per_box,
            created_by: user?.id
          }])

        if (error) throw error
      }

      // Reset form and refresh data
      resetForm()
      fetchFactoryAmmo()
    } catch (error) {
      console.error('Error saving factory ammo:', error)
      alert('Error saving factory ammo. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      manufacturer: '',
      caliber: '',
      caliber_id: '',
      bullet_weight: 0,
      cost_per_box: 0,
      rounds_per_box: 20
    })
    setShowForm(false)
    setEditingAmmo(null)
  }

  const handleEdit = (ammo: FactoryAmmo) => {
    setEditingAmmo(ammo)
    setFormData({
      name: ammo.name,
      manufacturer: ammo.manufacturer,
      caliber: ammo.caliber,
      caliber_id: ammo.caliber_id || '',
      bullet_weight: ammo.bullet_weight,
      cost_per_box: ammo.cost_per_box,
      rounds_per_box: ammo.rounds_per_box
    })
    setShowForm(true)
  }

  const handleDelete = async (ammo: FactoryAmmo) => {
    if (!confirm(`Are you sure you want to delete "${ammo.manufacturer} ${ammo.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('factory_ammo')
        .delete()
        .eq('id', ammo.id)

      if (error) throw error
      fetchFactoryAmmo()
    } catch (error) {
      console.error('Error deleting factory ammo:', error)
      alert('Error deleting factory ammo. Please try again.')
    }
  }

  const handleCaliberChange = (caliberId: string) => {
    const selectedCaliber = calibers.find(c => c.id === caliberId)
    
    setFormData({
      ...formData,
      caliber_id: caliberId,
      caliber: selectedCaliber ? selectedCaliber.display_name : '',
      bullet_weight: 0 // Reset bullet weight when caliber changes
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

  const isOwnAmmo = (ammo: FactoryAmmo) => {
    return ammo.created_by === user?.id
  }

  const groupedAmmo = factoryAmmo.reduce((acc, ammo) => {
    if (!acc[ammo.caliber]) {
      acc[ammo.caliber] = []
    }
    acc[ammo.caliber].push(ammo)
    return acc
  }, {} as Record<string, FactoryAmmo[]>)

  return (
    <div className="h-full px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Factory Ammunition</h2>
          <span className="ml-2 text-sm text-gray-500">({factoryAmmo.length} products)</span>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingAmmo(null)
            setFormData({
              name: '',
              manufacturer: '',
              caliber: '',
              caliber_id: '',
              bullet_weight: 0,
              cost_per_box: 0,
              rounds_per_box: 20
            })
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Factory Ammo
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingAmmo ? 'Edit Factory Ammo' : 'Add Factory Ammo'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., Match King, FMJ, Hollow Point"
                    required
                  />
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
                    placeholder="e.g., Federal, Winchester, Hornady"
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
                </div>

                <div>
                  <label htmlFor="bullet_weight" className="block text-sm font-medium text-gray-700">
                    Bullet Weight (grains)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      id="bullet_weight"
                      min="1"
                      value={formData.bullet_weight || ''}
                      onChange={(e) => setFormData({ ...formData, bullet_weight: parseInt(e.target.value) || 0 })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., 168, 115, 55"
                      required
                    />
                    {formData.caliber_id && getCommonBulletWeights(formData.caliber_id).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="text-xs text-gray-500 mr-2">Common weights:</span>
                        {getCommonBulletWeights(formData.caliber_id).map(weight => (
                          <button
                            key={weight}
                            type="button"
                            onClick={() => setFormData({ ...formData, bullet_weight: weight })}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {weight}gr
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="cost_per_box" className="block text-sm font-medium text-gray-700">
                    Cost per Box ($)
                  </label>
                  <input
                    type="number"
                    id="cost_per_box"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_box || ''}
                    onChange={(e) => setFormData({ ...formData, cost_per_box: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 29.99"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="rounds_per_box" className="block text-sm font-medium text-gray-700">
                    Rounds per Box
                  </label>
                  <input
                    type="number"
                    id="rounds_per_box"
                    min="1"
                    value={formData.rounds_per_box || ''}
                    onChange={(e) => setFormData({ ...formData, rounds_per_box: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 20, 50, 100"
                    required
                  />
                </div>
              </div>

              {formData.cost_per_box > 0 && formData.rounds_per_box > 0 && (
                <div className="bg-blue-50 rounded-md p-3">
                  <p className="text-sm text-blue-900">
                    Calculated cost per round: <strong>${(formData.cost_per_box / formData.rounds_per_box).toFixed(4)}</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingAmmo ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {Object.keys(groupedAmmo).length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No factory ammunition</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first factory ammo product.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAmmo).map(([caliber, caliberAmmo]) => (
            <div key={caliber} className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {caliber} ({caliberAmmo.length} products)
                </h3>
                {/* Mobile card layout */}
                <div className="block md:hidden space-y-3">
                  {caliberAmmo.map((ammo) => (
                    <div key={ammo.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {ammo.manufacturer}
                          </h4>
                          <div className="text-sm text-gray-600">{ammo.name}</div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {isOwnAmmo(ammo) ? (
                            <>
                              <button
                                onClick={() => handleEdit(ammo)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(ammo)}
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
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-center bg-blue-50 rounded-lg p-3">
                          <div className="text-xs text-blue-600">Cost per Round</div>
                          <div className="text-lg font-bold text-blue-900">
                            ${ammo.cost_per_round.toFixed(4)}
                          </div>
                        </div>
                        <div className="text-center bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600">Bullet Weight</div>
                          <div className="text-sm font-medium text-gray-900">
                            {ammo.bullet_weight} gr
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Box Price:</span>
                          <span className="text-gray-900">${ammo.cost_per_box.toFixed(2)} / {ammo.rounds_per_box} rounds</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created by:</span>
                          <div className="flex items-center">
                            {isOwnAmmo(ammo) ? (
                              <>
                                <User className="h-3 w-3 text-blue-600 mr-1" />
                                <span className="text-blue-600 font-medium text-xs">You</span>
                              </>
                            ) : ammo.created_by ? (
                              <>
                                <User className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs">Community</span>
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">System</span>
                            )}
                          </div>
                        </div>
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
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bullet Weight
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Box Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost per Round
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {caliberAmmo.map((ammo) => (
                        <tr key={ammo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {ammo.manufacturer}
                            </div>
                            <div className="text-sm text-gray-500">{ammo.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ammo.bullet_weight} gr
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${ammo.cost_per_box.toFixed(2)} / {ammo.rounds_per_box} rounds
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${ammo.cost_per_round.toFixed(4)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              {isOwnAmmo(ammo) ? (
                                <>
                                  <User className="h-3 w-3 text-blue-600 mr-1" />
                                  <span className="text-blue-600 font-medium">You</span>
                                </>
                              ) : ammo.created_by ? (
                                <>
                                  <User className="h-3 w-3 text-gray-400 mr-1" />
                                  <span>Community</span>
                                </>
                              ) : (
                                <span className="text-gray-400">System</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isOwnAmmo(ammo) ? (
                              <>
                                <button
                                  onClick={() => handleEdit(ammo)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(ammo)}
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
      )}
    </div>
  )
}
