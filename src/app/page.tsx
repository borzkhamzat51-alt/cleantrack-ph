'use client'

import { useState, useEffect } from 'react'
import { supabase, generateTrackingCode } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { MapPin, Camera, AlertTriangle, CheckCircle, Loader2, Trash2, Building2, Waves, Biohazard, Package, Trophy, Mail } from 'lucide-react'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const wasteTypes = [
  { value: 'garbage', label: 'Garbage / trash', icon: Trash2, color: 'text-orange-500' },
  { value: 'construction', label: 'Construction waste', icon: Building2, color: 'text-yellow-600' },
  { value: 'sewer', label: 'Sewer blockage', icon: Waves, color: 'text-blue-500' },
  { value: 'chemical', label: 'Chemical / hazardous', icon: Biohazard, color: 'text-red-500' },
  { value: 'other', label: 'Other', icon: Package, color: 'text-gray-500' },
]

type LeaderboardTab = 'barangay' | 'city' | 'province'
type LeaderboardEntry = { name: string; count: number }

// ── Leaderboard ────────────────────────────────────────────────────────────────
function Leaderboard() {
  const [tab, setTab] = useState<LeaderboardTab>('barangay')
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: rows } = await supabase.from('reports').select(tab)
      if (rows) {
        const counts: Record<string, number> = {}
        rows.forEach((r: Record<string, any>) => {
          const key = r[tab]
          if (key) counts[key] = (counts[key] || 0) + 1
        })
        const sorted = Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
        setData(sorted)
      }
      setLoading(false)
    }
    fetchData()
  }, [tab])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Leaderboard</h2>
          <p className="text-xs text-slate-400">Most active reporting communities</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
        {(['barangay', 'city', 'province'] as LeaderboardTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg capitalize transition-all ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-6">No data yet — submit a report to get on the board!</p>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <div
              key={entry.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                i === 0 ? 'bg-yellow-50 border-yellow-100' :
                i === 1 ? 'bg-slate-50 border-slate-100' :
                i === 2 ? 'bg-orange-50 border-orange-100' :
                'bg-slate-50 border-slate-100'
              }`}
            >
              <span className="text-base w-6 text-center flex-shrink-0">
                {medals[i] ?? <span className="text-xs text-slate-400 font-bold">{i + 1}</span>}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">{entry.name}</span>
              <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 flex-shrink-0">
                {entry.count} report{entry.count !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Home ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [email, setEmail] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [trackingCode, setTrackingCode] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!type) return alert('Please select a waste type')
    setLoading(true)

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      const code = generateTrackingCode()

      let barangay: string | null = null
      let city: string | null = null
      let province: string | null = null
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        )
        const geo = await res.json()
        const addr = geo.address ?? {}
        barangay = addr.village ?? addr.suburb ?? addr.neighbourhood ?? null
        city = addr.city ?? addr.town ?? addr.municipality ?? null
        province = addr.province ?? addr.state ?? null
      } catch {
        // silently ignore geocoding errors
      }

      const { error } = await supabase.from('reports').insert([{
        type,
        description,
        latitude,
        longitude,
        photo_url: null,
        status: 'pending',
        tracking_code: code,
        barangay,
        city,
        province,
        reporter_email: email.trim() || null,
      }])

      setLoading(false)
      if (!error) {
        setSuccess(true)
        setTrackingCode(code)
        setType('')
        setDescription('')
        setPhoto(null)
        setEmail('')
      } else {
        alert('Error: ' + error.message)
      }
    }, () => {
      setLoading(false)
      alert('Please allow location access to submit a report')
    })
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">CleanTrack PH</h1>
            <p className="text-xs text-slate-400 mt-0.5">Pampanga Waste Report System</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              Live in Pampanga
            </span>
            <h2 className="text-3xl font-bold leading-tight mb-3">
              Report illegal dumping.<br />Keep Pampanga clean.
            </h2>
            <p className="text-green-100 text-sm leading-relaxed">
              CleanTrack PH lets residents report waste dumping, blocked sewers, and flood hazards directly to LGU officials with real-time tracking so you always know the status of your report.
            </p>
          </div>
          <div className="flex gap-3 mb-8">
            <a href="#report" className="bg-white text-green-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors">Submit a report</a>
            <a href="/admin/login" className="bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/30 transition-colors border border-white/30">LGU Admin</a>
          </div>
          <HeroStats />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {success && trackingCode && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-800">Report submitted successfully</p>
                <p className="text-xs text-green-600 mt-0.5">Save your tracking code to check the status anytime.</p>
              </div>
            </div>
            <div className="bg-white border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Your tracking code</p>
                <p className="text-xl font-bold text-slate-800 tracking-widest">{trackingCode}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(trackingCode); alert('Copied!') }}
                className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Live report map</h2>
              <p className="text-xs text-slate-400">All dumping reports in Pampanga</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <Map />
        </div>

        {/* Leaderboard */}
        <Leaderboard />

        <TrackReport />

        {/* Report form */}
        <div id="report" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-0.5">Submit a report</h2>
          <p className="text-xs text-slate-400 mb-5">Your GPS location will be captured automatically</p>

          {/* Waste type */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Waste type</label>
            <div className="grid grid-cols-1 gap-2">
              {wasteTypes.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    type === value ? 'border-green-500 bg-green-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${type === value ? 'text-green-600' : color}`} />
                  <span className={`text-sm font-medium ${type === value ? 'text-green-800' : 'text-slate-700'}`}>{label}</span>
                  {type === value && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Description</label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Describe what you see — location details, severity, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Email <span className="text-slate-400 normal-case font-normal">(optional — for status updates)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">We'll notify you when your report status changes</p>
          </div>

          {/* Photo */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Photo <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <label className="flex items-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3.5 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-700 font-medium">{photo ? photo.name : 'Upload a photo'}</p>
                <p className="text-xs text-slate-400">JPG, PNG up to 50MB</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl py-3.5 font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><MapPin className="w-4 h-4" /> Submit report</>}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">CleanTrack PH · Built for Pampanga</p>
      </div>
    </main>
  )
}

// ── HeroStats ──────────────────────────────────────────────────────────────────
function HeroStats() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('reports').select('status')
      if (data) {
        setStats({
          total: data.length,
          resolved: data.filter(r => r.status === 'resolved').length,
          pending: data.filter(r => r.status === 'pending').length,
        })
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-xs text-green-100 mt-0.5">Total reports</p>
      </div>
      <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
        <p className="text-2xl font-bold">{stats.resolved}</p>
        <p className="text-xs text-green-100 mt-0.5">Resolved</p>
      </div>
      <div className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
        <p className="text-2xl font-bold">{stats.pending}</p>
        <p className="text-xs text-green-100 mt-0.5">Pending</p>
      </div>
    </div>
  )
}

// ── TrackReport ────────────────────────────────────────────────────────────────
function TrackReport() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'in progress': 'bg-blue-50 text-blue-700 border-blue-200',
    resolved: 'bg-green-50 text-green-700 border-green-200',
  }

  const statusMessages: Record<string, string> = {
    pending: 'Your report has been received and is awaiting review by LGU officials.',
    'in progress': 'LGU officials are currently working on resolving this report.',
    resolved: 'This report has been resolved. Thank you for helping keep Pampanga clean!',
  }

  const handleTrack = async () => {
    if (!code.trim()) return
    setLoading(true)
    setNotFound(false)
    setResult(null)

    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('tracking_code', code.trim().toUpperCase())
      .single()

    setLoading(false)
    if (data) setResult(data)
    else setNotFound(true)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-semibold text-slate-800 mb-0.5">Track your report</h2>
      <p className="text-xs text-slate-400 mb-4">Enter your tracking code to check the status</p>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="e.g. CT-AB1234"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
        />
        <button
          onClick={handleTrack}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
        </button>
      </div>
      {notFound && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
          No report found with that tracking code. Please check and try again.
        </div>
      )}
      {result && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColors[result.status] ?? statusColors.pending}`}>
              {result.status}
            </span>
          </div>
          <p className="text-xs text-slate-600">{statusMessages[result.status]}</p>
          <div className="border-t border-slate-200 pt-3 space-y-1">
            <p className="text-xs text-slate-500"><span className="font-medium">Type:</span> {result.type}</p>
            {result.barangay && <p className="text-xs text-slate-500"><span className="font-medium">Barangay:</span> {result.barangay}</p>}
            {result.city && <p className="text-xs text-slate-500"><span className="font-medium">City:</span> {result.city}</p>}
            {result.province && <p className="text-xs text-slate-500"><span className="font-medium">Province:</span> {result.province}</p>}
            <p className="text-xs text-slate-500">
              <span className="font-medium">Submitted:</span>{' '}
              {new Date(result.created_at).toLocaleDateString('en-PH', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
            {result.description && <p className="text-xs text-slate-500"><span className="font-medium">Description:</span> {result.description}</p>}
          </div>
        </div>
      )}
    </div>
  )
}