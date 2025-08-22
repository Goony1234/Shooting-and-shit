import { useState } from 'react'
import { Settings as SettingsIcon, Save, AlertCircle, Info } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'

export default function Settings() {
  const { loading, updateSettings, salesTaxEnabled, salesTaxRate } = useSettings()
  const [formData, setFormData] = useState({
    sales_tax_enabled: salesTaxEnabled,
    sales_tax_rate: salesTaxRate * 100 // Convert to percentage for display
  })
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage('')

    try {
      // Validate tax rate
      if (formData.sales_tax_enabled && (formData.sales_tax_rate < 0 || formData.sales_tax_rate > 50)) {
        throw new Error('Sales tax rate must be between 0% and 50%')
      }

      await updateSettings({
        sales_tax_enabled: formData.sales_tax_enabled,
        sales_tax_rate: formData.sales_tax_rate / 100 // Convert back to decimal
      })

      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage(error instanceof Error ? error.message : 'Error saving settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleTaxToggle = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      sales_tax_enabled: enabled,
      // Reset tax rate to 0 when disabling
      sales_tax_rate: enabled ? prev.sales_tax_rate : 0
    }))
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center mb-6">
          <SettingsIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sales Tax Section */}
              <div>
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sales Tax Settings</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Enable sales tax calculations to get more accurate cost estimates for your location.
                      All prices in the app are pre-tax, so enabling this will add your local tax rate to all cost calculations.
                    </p>
                  </div>
                </div>

                {/* Tax Toggle */}
                <div className="flex items-center justify-between py-4 border-t border-gray-200">
                  <div className="flex-1">
                    <label htmlFor="tax-toggle" className="text-sm font-medium text-gray-900">
                      Enable Sales Tax Calculation
                    </label>
                    <p className="text-sm text-gray-500">
                      Add sales tax to all price calculations throughout the app
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      type="button"
                      onClick={() => handleTaxToggle(!formData.sales_tax_enabled)}
                      className={`${
                        formData.sales_tax_enabled ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                      role="switch"
                      aria-checked={formData.sales_tax_enabled}
                      aria-labelledby="tax-toggle"
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          formData.sales_tax_enabled ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </button>
                  </div>
                </div>

                {/* Tax Rate Input */}
                {formData.sales_tax_enabled && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Sales Tax Rate</h4>
                        <p className="text-sm text-blue-800 mb-4">
                          Enter your local sales tax rate as a percentage. This varies by state and local jurisdiction.
                          You can usually find this information on your state's tax website or by checking a recent receipt.
                        </p>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 max-w-xs">
                            <label htmlFor="tax-rate" className="sr-only">
                              Tax Rate Percentage
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                id="tax-rate"
                                min="0"
                                max="50"
                                step="0.01"
                                value={formData.sales_tax_rate || ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  sales_tax_rate: parseFloat(e.target.value) || 0
                                }))}
                                className="block w-full rounded-md border-gray-300 pr-8 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="8.25"
                                required={formData.sales_tax_enabled}
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-blue-700">
                            {formData.sales_tax_rate > 0 && (
                              <span>
                                Example: $1.00 becomes ${(1 + formData.sales_tax_rate / 100).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-blue-600">
                          <p><strong>Common tax rates by state:</strong></p>
                          <p>• California: 7.25% - 10.25% • Texas: 6.25% - 8.25% • New York: 4% - 8.5%</p>
                          <p>• Florida: 6% - 8% • Washington: 6.5% - 10.4% • No tax: Alaska, Delaware, Montana, New Hampshire, Oregon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning when tax is disabled */}
                {!formData.sales_tax_enabled && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p><strong>Sales tax is currently disabled.</strong></p>
                        <p>All prices shown are pre-tax. Enable sales tax above to see total costs including tax for your location.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-5 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              {/* Save Message */}
              {saveMessage && (
                <div className={`rounded-md p-4 ${
                  saveMessage.includes('Error') 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  <p className="text-sm">{saveMessage}</p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">About Sales Tax Calculations</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              • All component prices and factory ammo prices in this app are entered as pre-tax amounts
            </p>
            <p>
              • When sales tax is enabled, the tax rate is applied to all cost calculations throughout the app
            </p>
            <p>
              • Tax calculations are applied to individual component costs before calculating total load costs
            </p>
            <p>
              • You can toggle tax calculations on/off at any time without affecting your saved data
            </p>
            <p>
              • Tax rates are stored as decimal values (e.g., 8.25% = 0.0825) but displayed as percentages for convenience
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
