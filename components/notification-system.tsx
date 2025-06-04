"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export type NotificationType = "success" | "error" | "info" | "loading"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description?: string
  duration?: number
}

interface NotificationSystemProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationCard key={notification.id} notification={notification} onRemove={onRemove} />
      ))}
    </div>
  )
}

function NotificationCard({ notification, onRemove }: { notification: Notification; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)

    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onRemove(notification.id), 300)
      }, notification.duration)

      return () => clearTimeout(timer)
    }
  }, [notification.id, notification.duration, onRemove])

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />
      case "loading":
        return <Upload className="h-5 w-5 text-green-600 animate-pulse" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case "success":
        return "border-green-200"
      case "error":
        return "border-red-200"
      case "info":
        return "border-blue-200"
      case "loading":
        return "border-green-200"
      default:
        return "border-gray-200"
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50"
      case "error":
        return "bg-red-50"
      case "info":
        return "bg-blue-50"
      case "loading":
        return "bg-green-50"
      default:
        return "bg-gray-50"
    }
  }

  return (
    <div
      className={cn(
        "transform transition-all duration-300 ease-in-out",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      <div
        className={cn(
          "bg-white rounded-lg shadow-lg border-l-4 p-4 min-w-[320px]",
          getBorderColor(),
          getBackgroundColor(),
        )}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
            {notification.description && <p className="mt-1 text-sm text-gray-600">{notification.description}</p>}
          </div>
          {notification.type !== "loading" && (
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(() => onRemove(notification.id), 300)
              }}
              className="ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook para gerenciar notificações
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    }

    setNotifications((prev) => [...prev, newNotification])
    return id
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)))
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    updateNotification,
  }
}
