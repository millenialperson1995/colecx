'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { CollectionForm } from '@/components/collection-form'
import { CollectionList } from '@/components/collection-list'
import { MapControls } from '@/components/map-controls'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useOfflineStorage } from '@/hooks/use-offline-storage'
import { AuthWrapper } from '@/components/auth-wrapper'

// Importa MapContainer apenas no cliente (Leaflet não suporta SSR)
const MapContainer = dynamic(
  () => import('@/components/map-container').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Carregando mapa...</p>
        </div>
      </div>
    ),
  }
)

function HomeContent() {
  const [showForm, setShowForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isCentering, setIsCentering] = useState(false)
  const { location, accuracy, error: locationError } = useGeolocation()
  const { collections, addCollection, deleteCollection, syncStatus } = useOfflineStorage()
  const mapRef = useRef<any>(null)

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng })
    setShowForm(true)
  }

  const handleMapReady = (map: any) => {
    mapRef.current = map
  }

  const handleFormSubmit = (data: { number: string; clientName: string; collectionCode: string }) => {
    if (selectedLocation) {
      addCollection({
        ...data,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        timestamp: new Date().toISOString(),
        synced: false,
      })
      setShowForm(false)
      setSelectedLocation(null)
    }
  }

  const handleCenterClick = async () => {
    if (!location || !mapRef.current) return

    setIsCentering(true)
    try {
      mapRef.current.flyTo([location.lat, location.lng], 17, {
        duration: 1,
      })
    } finally {
      setTimeout(() => setIsCentering(false), 1000)
    }
  }

  const handleQuickCollect = () => {
    if (location) {
      setSelectedLocation({ lat: location.lat, lng: location.lng })
      setShowForm(true)
    }
  }

  return (
    <main className="h-[100dvh] w-full flex flex-col bg-background overflow-hidden">
      {/* Map Container */}
      <div className="flex-1 relative w-full">
        <MapContainer
          location={location}
          accuracy={accuracy}
          collections={collections}
          onMapClick={handleMapClick}
          onMapReady={handleMapReady}
        />

        {/* Error Banner */}
        {locationError && (
          <div className="absolute top-4 left-4 right-4 bg-destructive text-white px-4 py-3 rounded-lg text-sm z-[400] shadow-lg">
            {locationError}
          </div>
        )}

        {/* Sync Status Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg shadow z-[400]">
          <div
            className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced'
                ? 'bg-green-500'
                : syncStatus === 'pending'
                  ? 'bg-yellow-500'
                  : 'bg-gray-500'
            }`}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'pending' ? 'Pendente' : 'Offline'}
          </span>
        </div>

        {/* Collections Count */}
        <div className="absolute bottom-32 left-4 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg shadow text-sm font-medium z-[400]">
          {collections.length} coleta{collections.length !== 1 ? 's' : ''}
        </div>

        {/* Map Controls */}
        <MapControls
          onCenterClick={handleCenterClick}
          onShowHistory={() => {}}
          locationAccuracy={accuracy}
          isCentering={isCentering}
        />
      </div>

      {/* Floating Action Button - Nova coleta */}
      {!showForm && (
        <button
          onClick={handleQuickCollect}
          disabled={!location}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[400] bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Registrar nova coleta"
        >
          <span className="text-3xl leading-none">+</span>
        </button>
      )}

      {/* Collection Form Modal */}
      {showForm && (
        <CollectionForm
          location={selectedLocation}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false)
            setSelectedLocation(null)
          }}
        />
      )}

      {/* Collections List Panel */}
      <CollectionList collections={collections} onDelete={deleteCollection} />
    </main>
  )
}

export default function Home() {
  return (
    <AuthWrapper>
      <HomeContent />
    </AuthWrapper>
  )
}
