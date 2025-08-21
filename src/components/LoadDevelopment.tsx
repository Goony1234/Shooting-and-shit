import { FlaskConical, Target, TrendingUp, BarChart3 } from 'lucide-react'

export default function LoadDevelopment() {
  return (
    <div className="h-full px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="flex items-center mb-6">
        <FlaskConical className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Load Development</h2>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-center">
          <FlaskConical className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-blue-900">Load Development Suite</h3>
            <p className="text-blue-700 mt-1">
              Track your load development process, record shooting data, and analyze performance trends.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Target className="h-8 w-8 text-green-600" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Shooting Sessions</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Record shooting sessions with weather conditions, range data, and performance metrics.
          </p>
          <div className="text-sm text-gray-500">
            • Session tracking<br />
            • Weather logging<br />
            • Group measurements<br />
            • Velocity data
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Load Analysis</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Analyze load performance across different powder charges, seating depths, and components.
          </p>
          <div className="text-sm text-gray-500">
            • Powder charge ladder<br />
            • Seating depth testing<br />
            • OCW (Optimal Charge Weight)<br />
            • Statistical analysis
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <h3 className="ml-3 text-lg font-medium text-gray-900">Performance Tracking</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Visualize trends and compare load performance over time with detailed charts and graphs.
          </p>
          <div className="text-sm text-gray-500">
            • Accuracy trends<br />
            • Velocity consistency<br />
            • Environmental effects<br />
            • Load comparisons
          </div>
        </div>
      </div>

      {/* Development Roadmap */}
      <div className="mt-12 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Development Roadmap</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-1"></div>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">Phase 1: Session Management</h4>
                <p className="text-gray-600 text-sm">Create and manage shooting sessions with basic data collection</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-gray-300 rounded-full mt-1"></div>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">Phase 2: Data Collection</h4>
                <p className="text-gray-600 text-sm">Record velocity, accuracy, and environmental data</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-gray-300 rounded-full mt-1"></div>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">Phase 3: Analysis Tools</h4>
                <p className="text-gray-600 text-sm">Statistical analysis and performance visualization</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-gray-300 rounded-full mt-1"></div>
              </div>
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">Phase 4: Advanced Features</h4>
                <p className="text-gray-600 text-sm">OCW analysis, ladder testing, and comprehensive reporting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
