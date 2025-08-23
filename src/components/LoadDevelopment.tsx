import { useState } from 'react'
import { Target, Plus, BarChart3, Thermometer } from 'lucide-react'

// Fake data for UI development
const mockSessions = [
  {
    id: '1',
    name: '168gr SMK Load Development',
    gun: 'Remington 700 .308',
    barrelTwist: '1:10',
    focusVariable: 'powder_charge',
    baselineLoad: {
      bullet: 'Sierra 168gr MatchKing',
      powder: 'Hodgdon Varget',
      powderCharge: 42.0,
      case: 'Lapua .308 Win',
      caseLength: 2.015,
      coal: 2.800,
      primer: 'CCI BR2'
    },
    testsCompleted: 3,
    totalTests: 5,
    createdAt: '2024-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: '55gr V-MAX Seating Depth',
    gun: 'AR-15 16" 1:7',
    barrelTwist: '1:7',
    focusVariable: 'seating_depth',
    baselineLoad: {
      bullet: 'Hornady 55gr V-MAX',
      powder: 'IMR 4166',
      powderCharge: 25.5,
      case: 'Winchester .223',
      caseLength: 1.760,
      coal: 2.260,
      primer: 'CCI 400'
    },
    testsCompleted: 5,
    totalTests: 5,
    createdAt: '2024-01-10',
    status: 'completed'
  }
]

const mockTestResults = [
  {
    testNumber: 1,
    variable: 'Powder Charge',
    value: '41.4gr',
    velocities: [2650, 2645, 2655, 2648, 2652],
    groupSize: 1.2,
    weather: { temp: 72, humidity: 45, pressure: 29.92 }
  },
  {
    testNumber: 2,
    variable: 'Powder Charge',
    value: '41.7gr',
    velocities: [2675, 2680, 2672, 2678, 2674],
    groupSize: 0.8,
    weather: { temp: 72, humidity: 45, pressure: 29.92 }
  },
  {
    testNumber: 3,
    variable: 'Powder Charge',
    value: '42.0gr',
    velocities: [2695, 2698, 2692, 2700, 2694],
    groupSize: 0.6,
    weather: { temp: 73, humidity: 43, pressure: 29.90 }
  }
]

export default function LoadDevelopment() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'create' | 'results'>('sessions')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const calculateStats = (velocities: number[]) => {
    const avg = velocities.reduce((a, b) => a + b, 0) / velocities.length
    const variance = velocities.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / velocities.length
    const sd = Math.sqrt(variance)
    const es = Math.max(...velocities) - Math.min(...velocities)
    return { avg: avg.toFixed(0), sd: sd.toFixed(1), es: es.toFixed(0) }
  }

  const getVariableLabel = (variable: string) => {
    const labels: Record<string, string> = {
      powder_charge: 'Powder Charge',
      seating_depth: 'Seating Depth',
      bullet_weight: 'Bullet Weight',
      case_length: 'Case Length'
    }
    return labels[variable] || variable
  }

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'text-green-600' : 'text-blue-600'
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Target className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Load Development</h2>
            <span className="ml-2 text-sm text-gray-500">({mockSessions.length} sessions)</span>
      </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'sessions'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Create New
            </button>
            {selectedSession && (
              <button
                onClick={() => setActiveTab('results')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'results'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Results
              </button>
            )}
          </div>
        </div>

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {mockSessions.length === 0 ? (
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No development sessions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first load development session.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedSession(session.id)
                      setActiveTab('results')
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {session.name}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          session.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {session.status}
                        </span>
      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Gun:</span>
                          <span className="font-medium">{session.gun}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Focus:</span>
                          <span className="font-medium">{getVariableLabel(session.focusVariable)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progress:</span>
                          <span className="font-medium">
                            {session.testsCompleted}/{session.totalTests} tests
                          </span>
          </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span className="font-medium">{session.createdAt}</span>
          </div>
        </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round((session.testsCompleted / session.totalTests) * 100)}%</span>
          </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${(session.testsCompleted / session.totalTests) * 100}%` }}
                          />
          </div>
        </div>

                      {/* Baseline Load Summary */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Baseline Load
                        </h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>{session.baselineLoad.bullet}</div>
                          <div>{session.baselineLoad.powderCharge}gr {session.baselineLoad.powder}</div>
                          <div>COAL: {session.baselineLoad.coal}"</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create New Session Tab */}
        {activeTab === 'create' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Create New Load Development Session</h3>
              
              <form className="space-y-6">
                {/* Session Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Session Name
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., 168gr SMK Load Development"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gun/Rifle
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Remington 700 .308"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Barrel Twist Rate
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., 1:10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Focus Variable
                    </label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                      <option value="">Select variable to test...</option>
                      <option value="powder_charge">Powder Charge</option>
                      <option value="seating_depth">Seating Depth (COAL)</option>
                      <option value="bullet_weight">Bullet Weight</option>
                      <option value="case_length">Case Length</option>
                    </select>
                  </div>
                </div>

                {/* Baseline Load Configuration */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Baseline Load Configuration</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Bullet
                      </label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select bullet...</option>
                        <option value="1">Sierra 168gr MatchKing</option>
                        <option value="2">Hornady 55gr V-MAX</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Powder
                      </label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select powder...</option>
                        <option value="1">Hodgdon Varget</option>
                        <option value="2">IMR 4166</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Powder Charge (gr)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="42.0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Case
                      </label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select case...</option>
                        <option value="1">Lapua .308 Win</option>
                        <option value="2">Winchester .223</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Case Length (in)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="2.015"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        COAL (in)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="2.800"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Primer
                      </label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Select primer...</option>
                        <option value="1">CCI BR2</option>
                        <option value="2">CCI 400</option>
                      </select>
          </div>
        </div>
      </div>

                {/* Test Configuration */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Test Configuration</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sample Size (shots per test)
                      </label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="3">3 shots</option>
                        <option value="5">5 shots</option>
                        <option value="10">10 shots</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Number of Tests
                      </label>
                      <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="3">3 tests</option>
                        <option value="5">5 tests</option>
                        <option value="7">7 tests</option>
                      </select>
        </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Target Distance (yards)
                      </label>
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="100"
                      />
              </div>
              </div>
            </div>
            
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('sessions')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && selectedSession && (
          <div className="space-y-6">
            {/* Session Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {mockSessions.find(s => s.id === selectedSession)?.name}
                </h3>
                <div className="flex items-center space-x-4">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Thermometer className="h-4 w-4 mr-2" />
                    Get Weather
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Gun:</span>
                  <div className="font-medium">{mockSessions.find(s => s.id === selectedSession)?.gun}</div>
                </div>
                <div>
                  <span className="text-gray-500">Focus Variable:</span>
                  <div className="font-medium">{getVariableLabel(mockSessions.find(s => s.id === selectedSession)?.focusVariable || '')}</div>
                </div>
                <div>
                  <span className="text-gray-500">Progress:</span>
                  <div className="font-medium">
                    {mockSessions.find(s => s.id === selectedSession)?.testsCompleted}/
                    {mockSessions.find(s => s.id === selectedSession)?.totalTests} tests
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div className={`font-medium ${getStatusColor(mockSessions.find(s => s.id === selectedSession)?.status || '')}`}>
                    {mockSessions.find(s => s.id === selectedSession)?.status}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Test Results */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Test Results</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variable Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Velocities (fps)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Vel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SD
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ES
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group (MOA)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weather
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockTestResults.map((result) => {
                      const stats = calculateStats(result.velocities)
                      return (
                        <tr key={result.testNumber} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{result.testNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.value}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {result.velocities.join(', ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stats.avg}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stats.sd}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {stats.es}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {result.groupSize}"
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {result.weather.temp}°F, {result.weather.humidity}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Quick Charts Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Group Size Trend</h4>
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>Chart will show group size vs variable</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Velocity Consistency</h4>
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>Chart will show SD/ES vs variable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}