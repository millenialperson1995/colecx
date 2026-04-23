'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

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

interface CollectionListProps {
  collections: Collection[]
  onDelete: (id: number) => void
  onSync: () => Promise<void>
}

export function CollectionList({ collections, onDelete, onSync }: CollectionListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent')
  const [filterSynced, setFilterSynced] = useState<'all' | 'synced' | 'pending'>('all')
  const [isSyncing, setIsSyncing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const filteredCollections = collections.filter((c) => {
    if (filterSynced === 'synced') return c.synced
    if (filterSynced === 'pending') return !c.synced
    return true
  })

  const sortedCollections = [...filteredCollections].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    }
    return a.clientName.localeCompare(b.clientName)
  })

  const exportAsCSV = () => {
    const headers = ['Nome', 'Número', 'Código', 'Data/Hora', 'Lat', 'Lng', 'Status']
    const rows = collections.map((c) => [
      c.clientName,
      c.number,
      c.collectionCode,
      new Date(c.timestamp).toLocaleString('pt-BR'),
      c.latitude.toFixed(6),
      c.longitude.toFixed(6),
      c.synced ? 'Sincronizado' : 'Pendente',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `coletas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const syncPending = async () => {
    setIsSyncing(true)
    try {
      await onSync()
      toast({
        title: 'Sincronização concluída',
        description: 'Todas as coletas pendentes foram sincronizadas.',
      })
    } catch (error) {
      toast({
        title: 'Erro de Sincronização',
        description: 'Não foi possível sincronizar as coletas.',
        variant: 'destructive'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = (id: number | undefined) => {
    if (id !== undefined && confirm('Deseja deletar este registro?')) {
      onDelete(id)
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (collections.length === 0) {
    return null
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:scale-95 transition-transform z-[1000] ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        aria-label="Mostrar histórico de coletas"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[1000] animate-in fade-in" onClick={() => setIsOpen(false)} />
      )}

      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-screen w-full max-w-md bg-white dark:bg-slate-900 shadow-xl z-[1001] transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Histórico ({collections.length})</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
            aria-label="Fechar painel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="bg-gray-50 dark:bg-slate-800 p-3 space-y-3 border-b border-gray-200 dark:border-slate-700">
          {/* Sort Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1 rounded text-xs font-medium transition flex-1 ${
                sortBy === 'recent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Recente
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded text-xs font-medium transition flex-1 ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Nome
            </button>
          </div>

          {/* Filter Options */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterSynced('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition flex-1 ${
                filterSynced === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setFilterSynced('synced')}
              className={`px-3 py-1 rounded text-xs font-medium transition flex-1 ${
                filterSynced === 'synced'
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Sincronizados
            </button>
            <button
              onClick={() => setFilterSynced('pending')}
              className={`px-3 py-1 rounded text-xs font-medium transition flex-1 ${
                filterSynced === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Pendentes
            </button>
          </div>
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {sortedCollections.map((collection) => (
              <div key={collection.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{collection.clientName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nº {collection.number}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(collection.id)}
                    className="text-gray-400 hover:text-red-500 transition p-1"
                    title="Deletar"
                    aria-label="Deletar coleta"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-1 mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Código: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{collection.collectionCode}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Horário: {formatDate(collection.timestamp)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    📍 {collection.latitude.toFixed(4)}, {collection.longitude.toFixed(4)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      collection.synced ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {collection.synced ? 'Sincronizado' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-slate-800 p-4 space-y-2">
          {/* Sync Pending Collections */}
          {collections.some((c) => !c.synced) && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncPending}
              disabled={isSyncing}
              className="w-full text-yellow-600 hover:text-yellow-700 border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
            >
              {isSyncing ? 'Sincronizando...' : `Sincronizar Pendentes (${collections.filter((c) => !c.synced).length})`}
            </Button>
          )}

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsCSV}
            className="w-full"
            disabled={collections.length === 0}
          >
            Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </div>
    </>
  )
}
