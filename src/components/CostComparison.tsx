import { useState, useEffect } from 'react'
import { BarChart3, TrendingDown, TrendingUp, Target, Database, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { SavedLoad, FactoryAmmo, Component } from '../types/index'

interface ComparisonResult {
  savings: number
  percentage: number
  isFirstCheaper: boolean
}

type ComparisonItem = SavedLoad | FactoryAmmo
type ComparisonType = 'load' | 'factory'

export default function CostComparison() {
  const [savedLoads, setSavedLoads] = useState<SavedLoad[]>([])
  const [factoryAmmo, setFactoryAmmo] = useState<FactoryAmmo[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [firstItem, setFirstItem] = useState<ComparisonItem | null>(null)
  const [firstType, setFirstType] = useState<ComparisonType>('load')
  const [secondItem, setSecondItem] = useState<ComparisonItem | null>(null)
  const [secondType, setSecondType] = useState<ComparisonType>('factory')
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (firstItem && secondItem) {
      calculateComparison()
    } else {
      setComparison(null)
    }
  }, [firstItem, secondItem])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [loadsResult, ammoResult, componentsResult] = await Promise.all([
        supabase.from('saved_loads').select('*').order('name', { ascending: true }),
        supabase.from('factory_ammo').select('*').order('caliber', { ascending: true }).order('manufacturer', { ascending: true }),
        supabase.from('components').select('*')
      ])

      if (loadsResult.error) throw loadsResult.error
      if (ammoResult.error) throw ammoResult.error
      if (componentsResult.error) throw componentsResult.error

      setSavedLoads(loadsResult.data || [])
      setFactoryAmmo(ammoResult.data || [])
      setComponents(componentsResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateComparison = () => {
    if (!firstItem || !secondItem) return

    const firstCost = firstItem.cost_per_round
    const secondCost = secondItem.cost_per_round
    const savings = secondCost - firstCost
    const percentage = (savings / secondCost) * 100
    const isFirstCheaper = savings > 0

    setComparison({
      savings: Math.abs(savings),
      percentage: Math.abs(percentage),
      isFirstCheaper
    })
  }

  const getComponentName = (id: string | undefined) => {
    if (!id) return 'Unknown'
    const component = components.find(c => c.id === id)
    return component ? `${component.manufacturer || ''} ${component.name}`.trim() : 'Unknown'
  }

  const getBrassDisplayInfo = (load: SavedLoad) => {
    if (load.brass_reuse_option === 'reuse') {
      return { name: 'Reused Brass', cost: '$0.0000' }
    }
    
    const brassName = load.brass_id ? getComponentName(load.brass_id) : 'Unknown'
    const costDisplay = load.brass_reuse_option === 'amortize' 
      ? `amortized over ${load.brass_reuse_count || 1} uses`
      : 'full cost'
    
    return { name: brassName, cost: costDisplay }
  }

  const getItemCaliber = (item: ComparisonItem): string => {
    return item.caliber
  }

  const getFilteredOptions = (type: ComparisonType, selectedCaliber?: string) => {
    if (type === 'load') {
      return selectedCaliber 
        ? savedLoads.filter(load => load.caliber.toLowerCase() === selectedCaliber.toLowerCase())
        : savedLoads
    } else {
      return selectedCaliber
        ? factoryAmmo.filter(ammo => ammo.caliber.toLowerCase() === selectedCaliber.toLowerCase())
        : factoryAmmo
    }
  }

  const getAvailableCalibers = () => {
    const calibers = new Set([
      ...savedLoads.map(load => load.caliber),
      ...factoryAmmo.map(ammo => ammo.caliber)
    ])
    return Array.from(calibers).sort()
  }

  const isFactoryAmmo = (item: ComparisonItem): item is FactoryAmmo => {
    return 'manufacturer' in item && 'bullet_weight' in item
  }

  const isSavedLoad = (item: ComparisonItem): item is SavedLoad => {
    return 'powder_id' in item && 'brass_reuse_option' in item
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

  // Item Selector Component
  const ItemSelector = ({ 
    type, 
    selectedItem, 
    onItemChange, 
    options, 
    placeholder,
    excludeItem 
  }: {
    type: ComparisonType
    selectedItem: ComparisonItem | null
    onItemChange: (item: ComparisonItem | null) => void
    options: ComparisonItem[]
    placeholder: string
    excludeItem?: ComparisonItem | null
  }) => {
    const filteredOptions = excludeItem 
      ? options.filter(option => option.id !== excludeItem.id)
      : options

    return (
      <div>
        <select
          value={selectedItem?.id || ''}
          onChange={(e) => {
            const item = options.find(o => o.id === e.target.value)
            onItemChange(item || null)
          }}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">{placeholder}</option>
          {getAvailableCalibers().map(caliber => {
            const caliberOptions = filteredOptions.filter(option => option.caliber === caliber)
            if (caliberOptions.length === 0) return null
            
            return (
              <optgroup key={caliber} label={caliber}>
                {caliberOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {type === 'load' 
                      ? `${option.name} - $${option.cost_per_round.toFixed(4)}/round`
                      : `${(option as FactoryAmmo).manufacturer} ${option.name} (${(option as FactoryAmmo).bullet_weight}gr) - $${option.cost_per_round.toFixed(4)}/round`
                    }
                  </option>
                ))}
              </optgroup>
            )
          })}
        </select>

        {selectedItem && (
          <div className={`mt-4 p-4 rounded-md ${type === 'load' ? 'bg-blue-50' : 'bg-green-50'}`}>
            <h4 className={`font-medium mb-2 ${type === 'load' ? 'text-blue-900' : 'text-green-900'}`}>
              {type === 'load' ? selectedItem.name : `${(selectedItem as FactoryAmmo).manufacturer} ${selectedItem.name}`}
            </h4>
            <div className={`text-sm space-y-1 ${type === 'load' ? 'text-blue-800' : 'text-green-800'}`}>
              <div>Caliber: {selectedItem.caliber}</div>
              <div>Cost per round: ${selectedItem.cost_per_round.toFixed(4)}</div>
              {type === 'load' && isSavedLoad(selectedItem) && (
                <div className={`text-xs mt-2 ${type === 'load' ? 'text-blue-600' : 'text-green-600'}`}>
                  <div>Brass: {getBrassDisplayInfo(selectedItem).name} ({getBrassDisplayInfo(selectedItem).cost})</div>
                  <div>Powder: {getComponentName(selectedItem.powder_id)} ({selectedItem.powder_weight}gr)</div>
                  <div>Primer: {getComponentName(selectedItem.primer_id)}</div>
                  <div>Bullet: {getComponentName(selectedItem.bullet_id)}</div>
                </div>
              )}
              {type === 'factory' && isFactoryAmmo(selectedItem) && (
                <div className="text-xs mt-2 text-green-600">
                  <div>Bullet Weight: {selectedItem.bullet_weight} grains</div>
                  <div>Box: ${selectedItem.cost_per_box.toFixed(2)} / {selectedItem.rounds_per_box} rounds</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Cost Comparison</h2>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Selection Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* First Item Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">1</span>
              <h3 className="text-lg font-medium text-gray-900">First Item</h3>
            </div>
          </div>
          
          {/* Type Selection for First Item */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="first-type"
                  value="load"
                  checked={firstType === 'load'}
                  onChange={(e) => {
                    setFirstType(e.target.value as ComparisonType)
                    setFirstItem(null)
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <Database className="h-4 w-4 ml-2 mr-1 text-blue-600" />
                <span className="text-sm text-gray-900">Saved Load</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="first-type"
                  value="factory"
                  checked={firstType === 'factory'}
                  onChange={(e) => {
                    setFirstType(e.target.value as ComparisonType)
                    setFirstItem(null)
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <Target className="h-4 w-4 ml-2 mr-1 text-green-600" />
                <span className="text-sm text-gray-900">Factory Ammo</span>
              </label>
            </div>
          </div>

          <ItemSelector
            type={firstType}
            selectedItem={firstItem}
            onItemChange={setFirstItem}
            options={getFilteredOptions(firstType, firstItem ? getItemCaliber(firstItem) : undefined)}
            placeholder={`Choose ${firstType === 'load' ? 'saved load' : 'factory ammo'}...`}
          />
        </div>

        {/* Second Item Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">2</span>
              <h3 className="text-lg font-medium text-gray-900">Compare Against</h3>
            </div>
          </div>
          
          {!firstItem ? (
            <p className="text-gray-500 text-center py-4">
              Select the first item to compare
            </p>
          ) : (
            <>
              {/* Type Selection for Second Item */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="second-type"
                      value="load"
                      checked={secondType === 'load'}
                      onChange={(e) => {
                        setSecondType(e.target.value as ComparisonType)
                        setSecondItem(null)
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <Database className="h-4 w-4 ml-2 mr-1 text-blue-600" />
                    <span className="text-sm text-gray-900">Saved Load</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="second-type"
                      value="factory"
                      checked={secondType === 'factory'}
                      onChange={(e) => {
                        setSecondType(e.target.value as ComparisonType)
                        setSecondItem(null)
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <Target className="h-4 w-4 ml-2 mr-1 text-green-600" />
                    <span className="text-sm text-gray-900">Factory Ammo</span>
                  </label>
                </div>
              </div>

              <ItemSelector
                type={secondType}
                selectedItem={secondItem}
                onItemChange={setSecondItem}
                options={getFilteredOptions(secondType, getItemCaliber(firstItem))}
                placeholder={`Choose ${secondType === 'load' ? 'saved load' : 'factory ammo'}...`}
                excludeItem={firstItem}
              />
            </>
          )}
        </div>
      </div>

      {/* Comparison Results */}
      {comparison && firstItem && secondItem && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">Comparison Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* First Item */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              {firstType === 'load' ? (
                <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              ) : (
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              )}
              <div className="text-sm text-blue-600 mb-1">
                {firstType === 'load' ? 'Saved Load' : 'Factory Ammo'}
              </div>
              <div className="text-lg font-medium text-blue-900 mb-1">
                {firstType === 'load' ? firstItem.name : `${(firstItem as FactoryAmmo).manufacturer} ${firstItem.name}`}
              </div>
              <div className="text-2xl font-bold text-blue-900">
                ${firstItem.cost_per_round.toFixed(4)}
              </div>
              <div className="text-xs text-blue-600">per round</div>
            </div>

            {/* Comparison Arrow & Savings */}
            <div className="text-center p-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                comparison.isFirstCheaper ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {comparison.isFirstCheaper ? (
                  <TrendingDown className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingUp className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className={`text-lg font-semibold ${
                comparison.isFirstCheaper ? 'text-green-600' : 'text-red-600'
              }`}>
                {comparison.isFirstCheaper ? 'First is Cheaper' : 'Second is Cheaper'}
              </div>
              <div className={`text-2xl font-bold ${
                comparison.isFirstCheaper ? 'text-green-700' : 'text-red-700'
              }`}>
                ${comparison.savings.toFixed(4)}
              </div>
              <div className={`text-sm ${
                comparison.isFirstCheaper ? 'text-green-600' : 'text-red-600'
              }`}>
                ({comparison.percentage.toFixed(1)}% difference)
              </div>
            </div>

            {/* Second Item */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              {secondType === 'load' ? (
                <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
              ) : (
                <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              )}
              <div className="text-sm text-green-600 mb-1">
                {secondType === 'load' ? 'Saved Load' : 'Factory Ammo'}
              </div>
              <div className="text-lg font-medium text-green-900 mb-1">
                {secondType === 'load' ? secondItem.name : `${(secondItem as FactoryAmmo).manufacturer} ${secondItem.name}`}
              </div>
              <div className="text-2xl font-bold text-green-900">
                ${secondItem.cost_per_round.toFixed(4)}
              </div>
              <div className="text-xs text-green-600">per round</div>
            </div>
          </div>

          {/* Cost Per Volume Calculations */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4 text-center">Cost for Different Quantities</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[20, 50, 100, 1000].map(quantity => {
                const firstTotal = firstItem.cost_per_round * quantity
                const secondTotal = secondItem.cost_per_round * quantity
                const savings = secondTotal - firstTotal
                
                return (
                  <div key={quantity} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-2">{quantity} Rounds</div>
                    <div className="text-xs text-blue-600">First: ${firstTotal.toFixed(2)}</div>
                    <div className="text-xs text-green-600">Second: ${secondTotal.toFixed(2)}</div>
                    <div className={`text-xs font-medium mt-1 ${
                      savings > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Diff: {savings > 0 ? '+' : ''}${savings.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* No Selection State */}
      {!firstItem && !secondItem && (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to Compare</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select two items to compare their costs. You can compare saved loads against factory ammo or against other saved loads.
          </p>
          
          {/* Comparison Examples */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-5 w-5 text-blue-600 mr-1" />
                <span className="text-xs">vs</span>
                <Target className="h-5 w-5 text-green-600 ml-1" />
              </div>
              <div className="text-xs text-gray-600">Load vs Factory</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-5 w-5 text-blue-600 mr-1" />
                <span className="text-xs">vs</span>
                <Database className="h-5 w-5 text-blue-600 ml-1" />
              </div>
              <div className="text-xs text-gray-600">Load vs Load</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-green-600 mr-1" />
                <span className="text-xs">vs</span>
                <Target className="h-5 w-5 text-green-600 ml-1" />
              </div>
              <div className="text-xs text-gray-600">Factory vs Factory</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}