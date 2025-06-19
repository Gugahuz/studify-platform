"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuccessNotificationProps {
  message: string
  isVisible: boolean
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export function SuccessNotification({
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 3000,
}: SuccessNotificationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShow(true)

      if (autoClose) {
        const timer = setTimeout(() => {
          setShow(false)
          setTimeout(onClose, 300) // Aguarda animação
        }, duration)

        return () => clearTimeout(timer)
      }
    } else {
      setShow(false)
    }
  }, [isVisible, autoClose, duration, onClose])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <Alert className="bg-green-50 border-green-200 shadow-lg min-w-[300px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">{message}</AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShow(false)
              setTimeout(onClose, 300)
            }}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  )
}
