"use client"

import type { ReactNode } from "react"

interface ComingSoonOverlayProps {
  children: ReactNode
  disabled?: boolean
}

export function ComingSoonOverlay({ children, disabled = true }: ComingSoonOverlayProps) {
  if (!disabled) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center rounded-lg backdrop-blur-sm">
        <div className="bg-white px-4 py-2 rounded-full shadow-md border">
          <span className="text-sm font-medium text-gray-600">Em Breve</span>
        </div>
      </div>
    </div>
  )
}
