'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Collection {
  id?: number
  latitude: number
  longitude: number
  clientName: string
  number: string
}

interface MapContainerProps {
  location: { lat: number; lng: number } | null
  accuracy: number | null
  collections: Collection[]
  onMapClick: (lat: number, lng: number) => void
  onMapReady?: (map: L.Map) => void
}

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333] // São Paulo
const DEFAULT_ZOOM = 15

export function MapContainer({
  location,
  accuracy,
  collections,
  onMapClick,
  onMapReady,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const accuracyCircleRef = useRef<L.Circle | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const hasCenteredRef = useRef(false)

  // Inicializa o mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(location ? [location.lat, location.lng] : DEFAULT_CENTER, DEFAULT_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Adiciona controles personalizados
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapRef.current = map
    onMapReady?.(map)

    // Evento de clique no mapa
    map.on('click', (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Atualiza localização do usuário
  useEffect(() => {
    if (!mapRef.current || !location) return

    // Centraliza o mapa na localização do usuário na primeira vez
    if (!hasCenteredRef.current) {
      mapRef.current.flyTo([location.lat, location.lng], DEFAULT_ZOOM, {
        duration: 1.5,
      })
      hasCenteredRef.current = true
    }

    // Remove marcador anterior
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current)
    }

    // Remove círculo de precisão anterior
    if (accuracyCircleRef.current) {
      mapRef.current.removeLayer(accuracyCircleRef.current)
    }

    // Adiciona novo marcador
    const userIcon = L.divIcon({
      html: `<div style="width: 16px; height: 16px; background-color: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })

    userMarkerRef.current = L.marker([location.lat, location.lng], { icon: userIcon }).addTo(
      mapRef.current
    )

    // Adiciona círculo de precisão
    if (accuracy) {
      accuracyCircleRef.current = L.circle([location.lat, location.lng], {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(mapRef.current)
    }
  }, [location, accuracy])

  // Atualiza marcadores de coleções
  useEffect(() => {
    if (!mapRef.current) return

    const currentMap = mapRef.current

    // Remove marcadores antigos
    markersRef.current.forEach((marker) => {
      currentMap.removeLayer(marker)
    })
    markersRef.current.clear()

    // Adiciona novos marcadores
    collections.forEach((collection) => {
      const icon = L.divIcon({
        html: `<div style="width: 32px; height: 32px; background-color: #22c55e; color: white; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">✓</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([collection.latitude, collection.longitude], { icon })
        .bindPopup(
          `<div style="font-family: system-ui, sans-serif;">
            <p style="font-weight: 600; margin: 0;">${collection.clientName}</p>
            <p style="font-size: 14px; color: #4b5563; margin: 4px 0 0 0;">Nº ${collection.number}</p>
          </div>`
        )
        .addTo(currentMap)

      markersRef.current.set(collection.id || 0, marker)
    })
  }, [collections])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{
        backgroundColor: '#e5e7eb',
      }}
    />
  )
}
