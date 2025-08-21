import { useState, useEffect } from 'react'
import { Database, Trash2, Eye, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { SavedLoad, Component } from '../types/index'

export default function SavedLoads() {
  const [savedLoads, setSavedLoads] = useState<SavedLoad[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [selectedLoad, setSelectedLoad] = useState<SavedLoad | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([fetchSavedLoads(), fetchComponents()])
  }, [])

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

      if (error) throw error
      setComponents(data || [])
    } catch (error) {
      console.error('Error fetching components:', error)
    }
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
    const duplicateData = {
      name: `${load.name} (Copy)`,
      caliber: load.caliber,
      caliber_id: load.caliber_id,
      brass_id: load.brass_id,
      powder_id: load.powder_id,
      powder_weight: load.powder_weight,
      primer_id: load.primer_id,
      bullet_id: load.bullet_id,
      notes: load.notes,
      brass_reuse_option: load.brass_reuse_option || 'new',
      brass_reuse_count: load.brass_reuse_count || 5
    }

    // Store in sessionStorage to pass to BulletBuilder
    sessionStorage.setItem('duplicateLoadData', JSON.stringify(duplicateData))
    
    // Navigate to load builder
    navigate('/')
  }

  const getComponentName = (id: string | undefined) => {
    if (!id) return 'Unknown'
    const component = components.find(c => c.id === id)
    return component ? `${component.manufacturer || ''} ${component.name}`.trim() : 'Unknown'
  }

  const LoadDetailsModal = ({ load, onClose }: { load: SavedLoad, onClose: () => void }) => {
    const brass = components.find(c => c.id === load.brass_id)
    const powder = components.find(c => c.id === load.powder_id)
    const primer = components.find(c => c.id === load.primer_id)
    const bullet = components.find(c => c.id === load.bullet_id)

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
                    {bullet ? `${bullet.manufacturer || ''} ${bullet.name}`.trim() : 'Unknown'}
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
    <div className="h-full px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="flex items-center mb-6">
        <Database className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Saved Loads</h2>
        <span className="ml-2 text-sm text-gray-500">({savedLoads.length} loads)</span>
      </div>

      {savedLoads.length === 0 ? (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No saved loads</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by building your first load.
          </p>
        </div>
      ) : (
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
                    <div className="text-gray-600">{getComponentName(load.bullet_id)}</div>
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
                          <span className="font-medium">Bu:</span> {getComponentName(load.bullet_id)}
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
      )}

      {selectedLoad && (
        <LoadDetailsModal
          load={selectedLoad}
          onClose={() => setSelectedLoad(null)}
        />
      )}
    </div>
  )
}
