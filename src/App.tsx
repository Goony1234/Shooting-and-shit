import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Calculator, Package, Database, BarChart3, Target, FlaskConical, Menu, X } from 'lucide-react'
import { useState } from 'react'
import BulletBuilder from './components/BulletBuilder'
import ComponentManager from './components/ComponentManager'
import SavedLoads from './components/SavedLoads'
import CostComparison from './components/CostComparison'
import FactoryAmmoManager from './components/FactoryAmmoManager'
import LoadDevelopment from './components/LoadDevelopment'

import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<BulletBuilder />} />
          <Route path="/components" element={<ComponentManager />} />
          <Route path="/saved" element={<SavedLoads />} />
          <Route path="/factory-ammo" element={<FactoryAmmoManager />} />
          <Route path="/compare" element={<CostComparison />} />
          <Route path="/load-development" element={<LoadDevelopment />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App