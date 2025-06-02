import { Flame, AlertCircle } from "lucide-react"
import { useDailyStreak } from "@/hooks/use-daily-streak"

export function DailyStreak() {
  const { streak, isLoading, error } = useDailyStreak()

  if (isLoading) {
    return (
      <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border">
        <div className="mr-3 bg-orange-100 rounded-full p-1.5">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <div className="text-sm font-medium">Sequência atual</div>
          <div className="text-xl font-bold text-orange-500">...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border">
        <div className="mr-3 bg-red-100 rounded-full p-1.5">
          <AlertCircle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <div className="text-sm font-medium">Sequência atual</div>
          <div className="text-xl font-bold text-red-500">Erro</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border">
      <div className="mr-3 bg-orange-100 rounded-full p-1.5">
        <Flame className="h-5 w-5 text-orange-500" />
      </div>
      <div>
        <div className="text-sm font-medium">Sequência atual</div>
        <div className="text-xl font-bold text-orange-500">{streak} dias</div>
      </div>
    </div>
  )
}
