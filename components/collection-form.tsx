'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CollectionFormProps {
  location: { lat: number; lng: number } | null
  onSubmit: (data: { number: string; clientName: string; collectionCode: string }) => void
  onClose: () => void
}

export function CollectionForm({ location, onSubmit, onClose }: CollectionFormProps) {
  const [number, setNumber] = useState('')
  const [clientName, setClientName] = useState('')
  const [collectionCode, setCollectionCode] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Focus na primeira entrada
    const firstInput = formRef.current?.querySelector('input') as HTMLInputElement
    if (firstInput) {
      firstInput.focus()
    }
  }, [])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!number.trim()) {
      newErrors.number = 'Número da casa/bloco/apto é obrigatório'
    } else if (number.trim().length < 1) {
      newErrors.number = 'Número deve ter pelo menos 1 caractere'
    }

    if (!clientName.trim()) {
      newErrors.clientName = 'Nome do cliente é obrigatório'
    } else if (clientName.trim().length < 3) {
      newErrors.clientName = 'Nome deve ter pelo menos 3 caracteres'
    }

    if (!collectionCode.trim()) {
      newErrors.collectionCode = 'Código de coleta é obrigatório'
    } else if (!collectionCode.match(/^[A-Z0-9\-]{3,}$/i)) {
      newErrors.collectionCode = 'Código deve ter apenas letras, números e hífens'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      onSubmit({
        number: number.trim(),
        clientName: clientName.trim(),
        collectionCode: collectionCode.trim(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 animate-in fade-in">
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-lg animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Registrar Coleta</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
            aria-label="Fechar formulário"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Location Info */}
        {location && (
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900/30">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              📍 Latitude: {location.lat.toFixed(6)} | Longitude: {location.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Progress Indicator */}
          <div className="flex gap-1">
            <div className={`h-1 flex-1 rounded-full ${number.trim() ? 'bg-green-500' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded-full ${clientName.trim() ? 'bg-green-500' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded-full ${collectionCode.trim() ? 'bg-green-500' : 'bg-gray-200'}`} />
          </div>

          {/* Número */}
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número (casa/bloco/apto) *
            </label>
            <div className="relative">
              <Input
                id="number"
                type="text"
                placeholder="Ex: 123, Bloco A, Apto 45"
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value)
                  if (errors.number) {
                    setErrors((prev) => ({ ...prev, number: '' }))
                  }
                }}
                disabled={isSubmitting}
                className={`${errors.number ? 'border-red-500 focus:ring-red-500' : number.trim() ? 'border-green-500 focus:ring-green-500' : ''}`}
                autoFocus
              />
              {number.trim() && !errors.number && (
                <div className="absolute right-3 top-3 text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number}</p>}
          </div>

          {/* Nome do Cliente */}
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Cliente * ({clientName.length}/50)
            </label>
            <div className="relative">
              <Input
                id="clientName"
                type="text"
                placeholder="Ex: João da Silva"
                value={clientName}
                maxLength={50}
                onChange={(e) => {
                  setClientName(e.target.value)
                  if (errors.clientName) {
                    setErrors((prev) => ({ ...prev, clientName: '' }))
                  }
                }}
                disabled={isSubmitting}
                className={`${errors.clientName ? 'border-red-500 focus:ring-red-500' : clientName.trim().length >= 3 && !errors.clientName ? 'border-green-500 focus:ring-green-500' : ''}`}
              />
              {clientName.trim().length >= 3 && !errors.clientName && (
                <div className="absolute right-3 top-3 text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
          </div>

          {/* Código de Coleta */}
          <div>
            <label htmlFor="collectionCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código de Coleta *
            </label>
            <div className="relative">
              <Input
                id="collectionCode"
                type="text"
                placeholder="Ex: COL-2024-001"
                value={collectionCode}
                onChange={(e) => {
                  setCollectionCode(e.target.value.toUpperCase())
                  if (errors.collectionCode) {
                    setErrors((prev) => ({ ...prev, collectionCode: '' }))
                  }
                }}
                disabled={isSubmitting}
                className={`${errors.collectionCode ? 'border-red-500 focus:ring-red-500' : collectionCode.match(/^[A-Z0-9\-]{3,}$/i) && !errors.collectionCode ? 'border-green-500 focus:ring-green-500' : ''}`}
              />
              {collectionCode.match(/^[A-Z0-9\-]{3,}$/i) && !errors.collectionCode && (
                <div className="absolute right-3 top-3 text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.collectionCode && <p className="text-xs text-red-500 mt-1">{errors.collectionCode}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Coleta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
