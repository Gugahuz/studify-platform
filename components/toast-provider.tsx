"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { CustomToast } from "@/components/ui/custom-toast"

interface Toast {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "warning" | "info"
}

interface ToastContextType {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, type: "success" })
    },
    [addToast],
  )

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, type: "error" })
    },
    [addToast],
  )

  const warning = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, type: "warning" })
    },
    [addToast],
  )

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ title, description, type: "info" })
    },
    [addToast],
  )

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <CustomToast
            key={toast.id}
            title={toast.title}
            description={toast.description}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
}
