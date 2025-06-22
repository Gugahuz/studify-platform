"use client"
import { StudySuggestion } from "@/components/study-suggestion"
import { PerformanceCard } from "@/components/performance-card"
import { UpcomingEvents } from "@/components/upcoming-events"
import { QuickActions } from "@/components/quick-actions"
import { useUserData } from "@/hooks/use-user-data"
import { getCurrentDate, getGreeting } from "@/utils/date-helpers"
import { WelcomeBanner } from "@/components/welcome-banner"

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner de boas-vindas com identidade Studify */}
      <WelcomeBanner />

      {/* Layout principal com identidade do Studify */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna principal - conteúdo principal */}
        <div className="md:col-span-2 space-y-6">
          <StudySuggestion />
          <PerformanceCard />
        </div>

        {/* Sidebar - ações rápidas e informações */}
        <div className="space-y-6">
          <UpcomingEvents />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
