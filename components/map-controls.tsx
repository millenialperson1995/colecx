'use client'

import { useRef, useEffect } from 'react'

interface MapControlsProps {
  onCenterClick: () => void
  onShowHistory: () => void
  locationAccuracy: number | null
  isCentering: boolean
}

export function MapControls({
  onCenterClick,
  onShowHistory,
  locationAccuracy,
  isCentering,
}: MapControlsProps) {
  return (
    <div className="absolute bottom-32 right-4 flex flex-col gap-3 z-50">
      {/* Center Location Button */}
      <button
        onClick={onCenterClick}
        disabled={isCentering}
        className="bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg w-12 h-12 flex items-center justify-center shadow-lg transition-all active:scale-95"
        title="Centralizar em minha localização"
        aria-label="Centralizar em minha localização"
      >
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Show History Button */}
      <button
        onClick={onShowHistory}
        className="bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg w-12 h-12 flex items-center justify-center shadow-lg transition-all active:scale-95"
        title="Ver histórico de coletas"
        aria-label="Ver histórico de coletas"
      >
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Accuracy Info */}
      {locationAccuracy !== null && (
        <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg shadow-lg text-xs">
          <p className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Precisão: <span className="font-semibold text-gray-900 dark:text-white">{Math.round(locationAccuracy)}m</span>
          </p>
        </div>
      )}
    </div>
  )
}
