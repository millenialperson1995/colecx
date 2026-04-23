'use client'

import { useState, useEffect } from 'react'

interface Location {
  lat: number
  lng: number
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste dispositivo')
      return
    }

    // Obtém localização inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setAccuracy(position.coords.accuracy)
        setError(null)
      },
      (err) => {
        setError('Permissão de localização negada')
        console.error('[v0] Geolocation error:', err)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Monitora localização em tempo real
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setAccuracy(position.coords.accuracy)
        setError(null)
        setWatching(true)
      },
      (err) => {
        console.error('[v0] Watch position error:', err)
        if (err.code === 1) {
          setError('Permissão de localização negada')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return { location, accuracy, error, watching }
}
