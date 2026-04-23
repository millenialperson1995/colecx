'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { CollectionForm } from '@/components/collection-form'
import { CollectionList } from '@/components/collection-list'
import { MapControls } from '@/components/map-controls'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useOfflineStorage } from '@/hooks/use-offline-storage'
import { AuthWrapper } from '@/components/auth-wrapper'
import { useAuth } from '@/hooks/use-auth'

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
  const { collections, addCollection, deleteCollection, syncStatus, markAsSynced } = useOfflineStorage()
  const { logout, user } = useAuth()
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

  const handleSyncPending = async () => {
    const pending = collections.filter(c => !c.synced)
    for (const c of pending) {
      if (c.id !== undefined) {
        await markAsSynced(c.id)
      }
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
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between z-[1001] shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">ColecX</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Sync Status Indicator */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700">
            <div
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced'
                  ? 'bg-green-500'
                  : syncStatus === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-gray-500'
              }`}
            />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:inline-block">
              {syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'pending' ? 'Pendente' : 'Offline'}
            </span>
          </div>

          <div className="h-4 w-px bg-gray-300 dark:bg-slate-700 hidden sm:block"></div>

          {user && (
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:inline-block">Olá, {user.name.split(' ')[0]}</span>
          )}
          <button onClick={() => window.location.reload()} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-slate-800" aria-label="Atualizar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Sair">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative w-full bg-gray-100 dark:bg-slate-800">
        {!location ? (
          <div className="w-full h-full flex items-center justify-center flex-col gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Buscando localização GPS...</p>
          </div>
        ) : (
          <MapContainer
            location={location}
            accuracy={accuracy}
            collections={collections}
            onMapClick={handleMapClick}
            onMapReady={handleMapReady}
          />
        )}

        {/* Error Banner */}
        {locationError && (
          <div className="absolute top-4 left-4 right-4 bg-destructive text-white px-4 py-3 rounded-lg text-sm z-[1000] shadow-lg">
            {locationError}
          </div>
        )}

        {/* Collections Count */}
        <div className="absolute bottom-32 left-4 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg shadow text-sm font-medium z-[1000]">
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
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
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
      <CollectionList collections={collections} onDelete={deleteCollection} onSync={handleSyncPending} />
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
