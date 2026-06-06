'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { supabase } from '@/lib/supabase'
import L from 'leaflet'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type Report = {
  id: string
  type: string
  description: string
  latitude: number
  longitude: number
  status: string
  created_at: string
}

export default function Map() {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase.from('reports').select('*')
      if (data) setReports(data)
    }
    fetchReports()
  }, [])

  return (
    <MapContainer
      center={[15.1450, 120.5887]}
      zoom={11}
      style={{ height: '400px', width: '100%', borderRadius: '12px', zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude]}
          icon={icon}
        >
          <Popup>
            <strong>{report.type}</strong><br />
            {report.description}<br />
            <span style={{ color: 'gray', fontSize: '12px' }}>{report.status}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}