"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BetaNotification } from "@/components/beta-notification"

export default function SimuladosPage() {
  const router = useRouter()
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    setShowNotification(true)
  }, [])

  const handleCloseNotification = () => {
    setShowNotification(false)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen">
      <BetaNotification isOpen={showNotification} onClose={handleCloseNotification} featureName="Simulados" />
    </div>
  )
}
