"use client"

import { useState, useEffect } from "react"

interface SubscriptionStatus {
  isPremium: boolean
  premiumExpiresAt?: string
  subscription?: {
    plan_type: string
    status: string
    current_period_end: string
  }
}

export function useSubscription(userId?: string) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchSubscriptionStatus()
    } else {
      setLoading(false)
    }
  }, [userId])

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching subscription status for user:", userId)

      const response = await fetch(`/api/subscription-status?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("❌ Response not OK:", response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Subscription data received:", data)

      setSubscriptionStatus(data)
    } catch (error) {
      console.error("❌ Error fetching subscription status:", error)
      // Fallback para usuário free em caso de erro
      setSubscriptionStatus({ isPremium: false })
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = () => {
    if (userId) {
      console.log("🔄 Refreshing subscription status...")
      fetchSubscriptionStatus()
    }
  }

  return {
    subscriptionStatus,
    loading,
    refreshStatus,
    isPremium: subscriptionStatus?.isPremium || false,
  }
}
