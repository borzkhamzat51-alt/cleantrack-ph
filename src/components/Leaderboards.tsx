'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy, Medal } from 'lucide-react'

type Entry = { name: string; count: number }
type Tab = 'barangay' | 'city' | 'province'

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('barangay')
  const [data, setData] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data: rows } = await supabase
        .from('reports')
        .select(tab)
      
      if (rows) {
        const counts: Record<string, number> = {}
        rows.forEach((r: any) => {
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
    fetch()
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

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
        {(['barangay', 'city', 'province'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg capitalize transition-all ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}>
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
        <p className="text-xs text-slate-400 text-center py-6">No data yet</p>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <div key={entry.name}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                i === 0 ? 'bg-yellow-50 border border-yellow-100' :
                i === 1 ? 'bg-slate-50 border border-slate-100' :
                i === 2 ? 'bg-orange-50 border border-orange-100' :
                'bg-slate-50 border border-slate-100'
              }`}>
              <span className="text-base w-6 text-center">
                {medals[i] || <span className="text-xs text-slate-400 font-bold">{i + 1}</span>}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700 truncate">{entry.name}</span>
              <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200">
                {entry.count} report{entry.count !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}