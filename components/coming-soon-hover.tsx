"use client"

import type { ReactNode } from "react"

interface ComingSoonHoverProps {
  children: ReactNode
  message?: string
}

export function ComingSoonHover({ children, message = "Em breve" }: ComingSoonHoverProps) {
  return (
    <div className="relative group cursor-not-allowed">
      <div className="opacity-75 pointer-events-none">{children}</div>

      {/* Hover tooltip */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-50 rounded-lg z-10">
        <div className="bg-white px-3 py-2 rounded-md shadow-lg">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
      </div>
    </div>
  )
}
