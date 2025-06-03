"use client"

import { useState, useCallback } from "react"

interface ToastData {
  id: string
  title: string
  description?: string
  type: "success" | "error" | "warning" | "info"
}

export function useCustomToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "success" })
    },
    [showToast],
  )

  const error = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "error" })
    },
    [showToast],
  )

  const warning = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "warning" })
    },
    [showToast],
  )

  const info = useCallback(
    (title: string, description?: string) => {
      showToast({ title, description, type: "info" })
    },
    [showToast],
  )

  return {
    toasts,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
