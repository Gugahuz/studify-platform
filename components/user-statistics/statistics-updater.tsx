"use client"

import { useEffect } from "react"
import { useUserStatistics } from "@/hooks/use-user-statistics"

interface StatisticsUpdaterProps {
  examData: {
    score: number
    totalQuestions: number
    correctAnswers: number
    timeSpent: number
    subjectAreas?: Record<string, { correct: number; total: number }>
  }
  onUpdateComplete?: () => void
}

export function StatisticsUpdater({ examData, onUpdateComplete }: StatisticsUpdaterProps) {
  const { updateStatistics } = useUserStatistics()

  useEffect(() => {
    const performUpdate = async () => {
      await updateStatistics(examData)
      onUpdateComplete?.()
    }

    if (examData.score !== undefined) {
      performUpdate()
    }
  }, [examData]) // Updated to include the entire examData object

  return null // This component doesn't render anything
}
