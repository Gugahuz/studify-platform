"use client"

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

interface CustomToastProps {
  type: "success" | "error" | "warning" | "info"
  title?: string
  message: string
  onClose: () => void
}

export function CustomToast({ type, title, message, onClose }: CustomToastProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-amber-50 border-amber-200"
      case "info":
        return "bg-blue-50 border-blue-200"
    }
  }

  return (
    <div
      className={`w-80 rounded-lg shadow-lg border p-4 ${getBackgroundColor()} animate-in slide-in-from-right`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          {title && <p className="text-sm font-medium text-gray-900">{title}</p>}
          <p className="mt-1 text-sm text-gray-600">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            className="bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
