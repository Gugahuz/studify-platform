"use client"

import { useState, useEffect } from "react"

interface UserStatistics {
  totalExams: number
  totalQuestions: number
  totalCorrectAnswers: number
  averageScore: number
  bestScore: number
  worstScore: number
  currentStreak: number
  maxStreak: number
  totalTimeSpent: number
  subjectPerformance: Record<string, { correct: number; total: number }>
  lastUpdated: string
}

export function useUserStatistics() {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user-statistics")
      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }
      const data = await response.json()
      setStatistics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      console.error("Error fetching statistics:", err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatistics = async (examData: {
    score: number
    totalQuestions: number
    correctAnswers: number
    timeSpent: number
    subjectAreas?: Record<string, { correct: number; total: number }>
  }) => {
    try {
      const response = await fetch("/api/user-statistics/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      })

      if (!response.ok) {
        throw new Error("Failed to update statistics")
      }

      // Refresh statistics after update
      await fetchStatistics()
      console.log("✅ User statistics updated successfully")
    } catch (err) {
      console.error("❌ Error updating statistics:", err)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [])

  return {
    statistics,
    loading,
    error,
    updateStatistics,
    refreshStatistics: fetchStatistics,
  }
}
