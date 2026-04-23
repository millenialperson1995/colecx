'use client'

import { useState, useEffect, useCallback } from 'react'
import { openDB } from 'idb'

interface Collection {
  id?: number
  number: string
  clientName: string
  collectionCode: string
  latitude: number
  longitude: number
  timestamp: string
  synced: boolean
}

const DB_NAME = 'ColecXDB'
const STORE_NAME = 'collections'

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('synced', 'synced')
        store.createIndex('timestamp', 'timestamp')
      }
    },
  })
}

export function useOfflineStorage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('offline')
  const [isLoading, setIsLoading] = useState(true)

  // Carrega dados ao iniciar
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const db = await initDB()
        const allCollections = await db.getAll(STORE_NAME)
        setCollections(allCollections)

        // Verifica se há dados não sincronizados
        const unsynced = allCollections.filter((c) => !c.synced)
        if (unsynced.length > 0) {
          setSyncStatus('pending')
        } else {
          setSyncStatus('synced')
        }
      } catch (error) {
        console.error('[v0] Failed to load collections:', error)
        setSyncStatus('offline')
      } finally {
        setIsLoading(false)
      }
    }

    loadCollections()
  }, [])

  // Monitora conexão de rede
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('pending')
      // Aqui você poderia disparar um sync automático
    }

    const handleOffline = () => {
      setSyncStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const addCollection = useCallback(
    async (newCollection: Omit<Collection, 'id'>) => {
      try {
        const db = await initDB()
        const id = await db.add(STORE_NAME, newCollection)

        const collection: Collection = { id, ...newCollection }
        setCollections((prev) => [collection, ...prev])
        setSyncStatus('pending')

        return collection
      } catch (error) {
        console.error('[v0] Failed to add collection:', error)
        throw error
      }
    },
    []
  )

  const deleteCollection = useCallback(async (id: number) => {
    try {
      const db = await initDB()
      await db.delete(STORE_NAME, id)
      setCollections((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error('[v0] Failed to delete collection:', error)
      throw error
    }
  }, [])

  const updateCollection = useCallback(
    async (id: number, updates: Partial<Collection>) => {
      try {
        const db = await initDB()
        const collection = await db.get(STORE_NAME, id)
        if (collection) {
          const updated = { ...collection, ...updates }
          await db.put(STORE_NAME, updated)
          setCollections((prev) => prev.map((c) => (c.id === id ? updated : c)))
          return updated
        }
      } catch (error) {
        console.error('[v0] Failed to update collection:', error)
        throw error
      }
    },
    []
  )

  const getSyncPending = useCallback(async () => {
    try {
      const db = await initDB()
      const pending = await db.getAllFromIndex(STORE_NAME, 'synced', false)
      return pending
    } catch (error) {
      console.error('[v0] Failed to get pending collections:', error)
      return []
    }
  }, [])

  const markAsSynced = useCallback(async (id: number) => {
    return updateCollection(id, { synced: true })
  }, [updateCollection])

  return {
    collections,
    addCollection,
    deleteCollection,
    updateCollection,
    getSyncPending,
    markAsSynced,
    syncStatus,
    isLoading,
  }
}
