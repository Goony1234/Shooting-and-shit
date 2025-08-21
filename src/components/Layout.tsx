import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calculator, Package, Database, BarChart3, Target, FlaskConical, Menu, X, User, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import UserProfile from './UserProfile'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  section: 'calculator' | 'development'
}

const navigation: NavItem[] = [
  // Reloading Calculator Section
  { name: 'Saved Loads', href: '/', icon: Database, section: 'calculator' },
  { name: 'Components', href: '/components', icon: Package, section: 'calculator' },
  { name: 'Factory Ammo', href: '/factory-ammo', icon: Target, section: 'calculator' },
  { name: 'Compare', href: '/compare', icon: BarChart3, section: 'calculator' },
  
  // Load Development Section
  { name: 'Load Development', href: '/load-development', icon: FlaskConical, section: 'development' },
]

const sections = [
  { id: 'calculator', name: 'Reloading Calculator', icon: Calculator },
  { id: 'development', name: 'Load Development', icon: FlaskConical },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const getCurrentSection = () => {
    const currentItem = navigation.find(item => item.href === location.pathname)
    return currentItem?.section || 'calculator'
  }

  const getNavigationForSection = (section: string) => {
    return navigation.filter(item => item.section === section)
  }

  const isActiveLink = (href: string) => {
    return location.pathname === href
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0'
        }`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition ease-in-out duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent getNavigationForSection={getNavigationForSection} isActiveLink={isActiveLink} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent getNavigationForSection={getNavigationForSection} isActiveLink={isActiveLink} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <button
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex justify-between items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {sections.find(s => s.id === getCurrentSection())?.name}
              </h1>
              <UserProfile />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-hidden focus:outline-none">
          <div className="h-full py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  getNavigationForSection: (section: string) => NavItem[]
  isActiveLink: (href: string) => boolean
}

function SidebarContent({ getNavigationForSection, isActiveLink }: SidebarContentProps) {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await signOut()
      } catch (error) {
        console.error('Sign out error:', error)
        // Force refresh if sign out fails
        window.location.reload()
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-6">
          <Calculator className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Reloading App</span>
        </div>

        {/* Navigation Sections */}
        <nav className="mt-5 flex-1 px-2 space-y-8">
          {sections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <div className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-md mb-2">
                <section.icon className="mr-3 h-5 w-5 text-gray-600" />
                {section.name}
              </div>
              
              {/* Section Navigation Items */}
              <div className="space-y-1">
                {getNavigationForSection(section.id).map((item) => {
                  const isActive = isActiveLink(item.href)
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-100 border-blue-500 text-blue-700 border-r-2'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center pl-6 pr-2 py-2 text-sm font-medium`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-5 w-5`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Account Section */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500">
              Signed in
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
