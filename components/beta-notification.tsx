"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"

interface BetaNotificationProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
}

export function BetaNotification({ isOpen, onClose, featureName }: BetaNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <Card className="w-full max-w-md border-amber-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg relative">
            <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-amber-800">Funcionalidade em Desenvolvimento</CardTitle>
                <CardDescription className="text-amber-700">Versão BETA</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-gray-700">
                A funcionalidade <strong>"{featureName}"</strong> ainda está em desenvolvimento e não está disponível na
                versão BETA do Studify.
              </p>
              <p className="text-sm text-gray-600">
                Estamos trabalhando para disponibilizar esta funcionalidade em breve no Studify. Obrigado pela
                compreensão!
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleClose} className="bg-studify-green hover:bg-studify-green/90">
                Entendi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
