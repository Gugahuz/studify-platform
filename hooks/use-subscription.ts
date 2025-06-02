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
    }
  }, [userId])

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscription-status?userId=${userId}`)
      const data = await response.json()
      setSubscriptionStatus(data)
    } catch (error) {
      console.error("❌ Error fetching subscription status:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStatus = () => {
    if (userId) {
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
