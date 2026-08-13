'use client'

import { useEffect, useRef } from 'react'
import { adminApi } from '@/lib/api'
import 'leaflet/dist/leaflet.css'

interface HeatPoint { latitude: number; longitude: number; kesimpulan_otomatis: string; status_laporan?: string }

const KESIMPULAN_COLORS: Record<string, string> = {
  Kemiskinan_Ekstrem: '#EF4444',
  Darurat_Kesehatan: '#F97316',
  Permukiman_Tidak_Layak: '#8B5CF6',
  Putus_Sekolah_Kritis: '#0EA5E9',
  Rentan_Miskin: '#F97316',
  Perlu_Bantuan_Kesehatan: '#EC4899',
  Permukiman_Kurang_Layak: '#A78BFA',
  Risiko_Putus_Sekolah: '#38BDF8',
  Kondisi_Normal: '#22C55E',
  Kondisi_Kritis: '#DC2626',
}

export default function HeatmapView() {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    if (typeof window === 'undefined' || !containerRef.current) return

    import('leaflet').then((L) => {
      if (!mountedRef.current) return

      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }

      // Default center: Bontang, Kalimantan Timur
      const map = L.map(containerRef.current!, {
        preferCanvas: true,
        zoomAnimation: false,   // Prevent _leaflet_pos race condition on unmount
        fadeAnimation: false,
        markerZoomAnimation: false,
      }).setView([-0.1322, 117.5003], 12)
      mapRef.current = map

      // Pastikan ukuran container terbaca dengan benar setelah render
      timerRef.current = setTimeout(() => {
        if (mountedRef.current && mapRef.current) map.invalidateSize()
      }, 100)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      adminApi.heatmap().then(res => {
        if (!mountedRef.current || !mapRef.current) return

        const points: HeatPoint[] = res.data.points || []

        points.forEach(p => {
          if (!mountedRef.current || !mapRef.current) return
          if (!p.latitude || !p.longitude) return

          const color = KESIMPULAN_COLORS[p.kesimpulan_otomatis] || '#6B7280'
          const icon = L.divIcon({
            html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);opacity:0.9"></div>`,
            iconSize: [16, 16], iconAnchor: [8, 8], className: '',
          })

          L.marker([p.latitude, p.longitude], { icon })
            .bindPopup(`<b>${p.kesimpulan_otomatis?.replace(/_/g, ' ') || 'Laporan'}</b><br/>Status: ${p.status_laporan || '—'}`)
            .addTo(map)
        })

        // Fit bounds jika ada data
        if (mountedRef.current && mapRef.current && points.length > 0) {
          const validPoints = points.filter(p => p.latitude && p.longitude)
          if (validPoints.length > 0) {
            try {
              const bounds = L.latLngBounds(validPoints.map(p => [p.latitude, p.longitude]))
              map.fitBounds(bounds, { padding: [40, 40], animate: false })
            } catch (_) {}
          }
        }
      }).catch(() => {})

      // Legend
      const legend = (L as any).control({ position: 'bottomright' })
      legend.onAdd = () => {
        const div = L.DomUtil.create('div')
        div.style.cssText = 'background:white;padding:12px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:12px;font-family:sans-serif;max-width:200px;'
        div.innerHTML = '<b style="display:block;margin-bottom:8px">Legenda Kasus</b>' +
          Object.entries(KESIMPULAN_COLORS).map(([k, c]) =>
            `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><div style="width:12px;height:12px;border-radius:50%;background:${c};flex-shrink:0"></div><span>${k.replace(/_/g, ' ')}</span></div>`
          ).join('')
        return div
      }
      if (mountedRef.current) legend.addTo(map)
    })

    return () => {
      mountedRef.current = false
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      if (mapRef.current) {
        try { mapRef.current.remove() } catch (_) {}
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
