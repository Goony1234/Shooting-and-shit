import { useState } from 'react'
import { Calculator } from 'lucide-react'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Calculator className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          SHOOTING & SHIT
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Compare reloading costs to factory ammunition
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Secure authentication powered by Supabase
        </p>
      </div>
    </div>
  )
}
