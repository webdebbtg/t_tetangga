'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

interface Props {
  lat: number
  lng: number
  onChange?: (coords: { lat: number; lng: number }) => void
  readonly?: boolean
}

export default function MapPicker({ lat, lng, onChange, readonly }: Props) {
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    if (typeof window === 'undefined' || !containerRef.current) return

    import('leaflet').then((L) => {
      if (!mountedRef.current) return

      // Cleanup previous instance
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

      const map = L.map(containerRef.current!, {
        zoomAnimation: false,   // Prevent _leaflet_pos race condition on unmount
        fadeAnimation: false,
        markerZoomAnimation: false,
      }).setView([lat, lng], 16)
      mapRef.current = map

      // Pastikan ukuran container terbaca dengan benar setelah render
      timerRef.current = setTimeout(() => {
        if (mountedRef.current && mapRef.current) map.invalidateSize()
      }, 100)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      const icon = L.divIcon({
        html: '<div style="background:#16A34A;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
        iconSize: [20, 20], iconAnchor: [10, 10],
        className: '',
      })

      const marker = L.marker([lat, lng], { icon, draggable: !readonly }).addTo(map)
      markerRef.current = marker

      if (!readonly && onChange) {
        marker.on('dragend', () => {
          if (!mountedRef.current) return
          const pos = marker.getLatLng()
          onChange({ lat: pos.lat, lng: pos.lng })
        })
        map.on('click', (e: any) => {
          if (!mountedRef.current) return
          marker.setLatLng(e.latlng)
          onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
        })
      }
    })

    return () => {
      mountedRef.current = false
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      if (mapRef.current) {
        try { mapRef.current.remove() } catch (_) {}
        mapRef.current = null
      }
      markerRef.current = null
    }
  }, [])

  // Update marker on external change
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current.setView([lat, lng], 16)
    }
  }, [lat, lng])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
