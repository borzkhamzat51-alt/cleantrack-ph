'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Loader2, MapPin } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) return setError('Please fill in all fields')
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center shadow mb-3">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">CleanTrack PH</h1>
          <p className="text-sm text-slate-400 mt-1">LGU Admin Portal</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Sign in to continue</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                placeholder="admin@lgu.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Sign in
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Authorized LGU personnel only
        </p>
      </div>
    </main>
  )
}