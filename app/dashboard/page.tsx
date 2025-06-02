"use client"

import { DailyStreak } from "@/components/daily-streak"
import { StudySuggestion } from "@/components/study-suggestion"
import { PerformanceCard } from "@/components/performance-card"
import { UpcomingEvents } from "@/components/upcoming-events"
import { QuickActions } from "@/components/quick-actions"
import { useUserData } from "@/hooks/use-user-data"
import { getCurrentDate, getGreeting } from "@/utils/date-helpers"

export default function Dashboard() {
  const { userProfile, isLoading } = useUserData()

  const greeting = getGreeting()
  const currentDate = getCurrentDate()
  const userName = userProfile?.nome || "Estudante"

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {userName}!
          </h1>
          <p className="text-gray-600 capitalize">{currentDate}</p>
        </div>
        <DailyStreak />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <StudySuggestion />
          <PerformanceCard />
        </div>
        <div className="space-y-6">
          <UpcomingEvents />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
