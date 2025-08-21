import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ComponentManager from './components/ComponentManager'
import SavedLoads from './components/SavedLoads'
import CostComparison from './components/CostComparison'
import FactoryAmmoManager from './components/FactoryAmmoManager'
import LoadDevelopment from './components/LoadDevelopment'
import Layout from './components/Layout'
import AuthPage from './components/Auth/AuthPage'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SavedLoads />} />
        <Route path="/components" element={<ComponentManager />} />
        <Route path="/factory-ammo" element={<FactoryAmmoManager />} />
        <Route path="/compare" element={<CostComparison />} />
        <Route path="/load-development" element={<LoadDevelopment />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App