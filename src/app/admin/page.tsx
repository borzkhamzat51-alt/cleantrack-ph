'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Clock, CheckCircle, AlertTriangle, Loader2, Filter, Trash2, Building2, Waves, Biohazard, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Report = {
  id: string
  type: string
  description: string
  latitude: number
  longitude: number
  status: string
  photo_url: string | null
  created_at: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'in progress': 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  'in progress': <Loader2 className="w-3 h-3" />,
  resolved: <CheckCircle className="w-3 h-3" />,
}

const typeIcons: Record<string, React.ReactNode> = {
  garbage: <Trash2 className="w-4 h-4 text-orange-500" />,
  construction: <Building2 className="w-4 h-4 text-yellow-600" />,
  sewer: <Waves className="w-4 h-4 text-blue-500" />,
  chemical: <Biohazard className="w-4 h-4 text-red-500" />,
  other: <Package className="w-4 h-4 text-gray-500" />,
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setReports(data)
    setLoading(false)
  }

    useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
      } else {
        fetchReports()
      }
    }
    checkSession()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await supabase.from('reports').update({ status }).eq('id', id)
    await fetchReports()
    setUpdating(null)
  }

  const filtered = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterType !== 'all' && r.type !== filterType) return false
    return true
  })

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shadow">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">Admin Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">CleanTrack PH · LGU Control Panel</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/admin/login')
            }}
            className="ml-auto text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">Total reports</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl border border-yellow-100 shadow-sm p-4">
            <p className="text-xs text-yellow-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4">
            <p className="text-xs text-blue-600 mb-1">In progress</p>
            <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
          </div>
          <div className="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4">
            <p className="text-xs text-green-600 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="garbage">Garbage / trash</option>
            <option value="construction">Construction waste</option>
            <option value="sewer">Sewer blockage</option>
            <option value="chemical">Chemical / hazardous</option>
            <option value="other">Other</option>
          </select>
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} reports shown</span>
        </div>

        {/* Reports list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No reports found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => (
              <div key={report.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100">
                    {typeIcons[report.type] || typeIcons.other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 capitalize">{report.type}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[report.status] || statusColors.pending}`}>
                        {statusIcons[report.status]}
                        {report.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                      {report.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  {report.photo_url && (
                    <img
                      src={report.photo_url}
                      alt="Report photo"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                    />
                  )}
                </div>
                {report.status !== 'resolved' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    {report.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(report.id, 'in progress')}
                        disabled={updating === report.id}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        {updating === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Loader2 className="w-3 h-3" />}
                        Mark in progress
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(report.id, 'resolved')}
                      disabled={updating === report.id}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-xl py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      {updating === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Mark resolved
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}