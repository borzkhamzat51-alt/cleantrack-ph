'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { MapPin, Camera, AlertTriangle, CheckCircle, Loader2, Trash2, Building2, Waves, Biohazard, Package } from 'lucide-react'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const wasteTypes = [
  { value: 'garbage', label: 'Garbage / trash', icon: Trash2, color: 'text-orange-500' },
  { value: 'construction', label: 'Construction waste', icon: Building2, color: 'text-yellow-600' },
  { value: 'sewer', label: 'Sewer blockage', icon: Waves, color: 'text-blue-500' },
  { value: 'chemical', label: 'Chemical / hazardous', icon: Biohazard, color: 'text-red-500' },
  { value: 'other', label: 'Other', icon: Package, color: 'text-gray-500' },
]

export default function Home() {
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!type) return alert('Please select a waste type')
    setLoading(true)

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      let photo_url = null

      if (photo) {
        const fileName = `${Date.now()}-${photo.name}`
        const { error } = await supabase.storage
          .from('report-photos')
          .upload(fileName, photo)
        if (!error) {
          const { data: urlData } = supabase.storage
            .from('report-photos')
            .getPublicUrl(fileName)
          photo_url = urlData.publicUrl
        }
      }

      const { error } = await supabase.from('reports').insert([{
        type, description, latitude, longitude, photo_url, status: 'pending'
      }])

      setLoading(false)
      if (!error) {
        setSuccess(true)
        setType('')
        setDescription('')
        setPhoto(null)
        setTimeout(() => setSuccess(false), 4000)
      } else {
        alert('Error submitting report: ' + error.message)
      }
    }, () => {
      setLoading(false)
      alert('Please allow location access to submit a report')
    })
  }

  const selectedType = wasteTypes.find(w => w.value === type)

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Success banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-green-800">Report submitted successfully</p>
              <p className="text-xs text-green-600 mt-0.5">Thank you for helping keep Pampanga clean.</p>
            </div>
          </div>
        )}

        {/* Map card */}
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

        {/* Report form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-0.5">Submit a report</h2>
          <p className="text-xs text-slate-400 mb-5">Your GPS location will be captured automatically</p>

          {/* Waste type selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Waste type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {wasteTypes.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    type === value
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${type === value ? 'text-green-600' : color}`} />
                  <span className={`text-sm font-medium ${type === value ? 'text-green-800' : 'text-slate-700'}`}>
                    {label}
                  </span>
                  {type === value && (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Description
            </label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Describe what you see — location details, severity, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Photo upload */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Photo <span className="text-slate-400 normal-case font-normal">(optional)</span>
            </label>
            <label className="flex items-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3.5 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-700 font-medium">
                  {photo ? photo.name : 'Upload a photo'}
                </p>
                <p className="text-xs text-slate-400">JPG, PNG up to 50MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl py-3.5 font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Submit report
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          CleanTrack PH · Built for Pampanga
        </p>
      </div>
    </main>
  )
}