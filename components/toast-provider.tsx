"use client"

import type React from "react"

import { CustomToast } from "@/components/ui/custom-toast"
import { useCustomToast } from "@/hooks/use-custom-toast"
import { createContext, useContext } from "react"

const ToastContext = createContext<ReturnType<typeof useCustomToast> | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useCustomToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
        {toast.toasts.map((toastData) => (
          <CustomToast
            key={toastData.id}
            title={toastData.title}
            description={toastData.description}
            type={toastData.type}
            onClose={() => toast.removeToast(toastData.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider")
  }
  return context
}
