"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface UserStats {
  total_exams: number
  total_correct: number
  total_questions: number
  best_score: number
  average_score: number
  total_time_minutes: number
  last_exam_date: string | null
}

export function UserStatsSimple() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchStats()
    }
  }, [userId])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    } catch (error) {
      console.error("Error getting user:", error)
    }
  }

  const fetchStats = async () => {
    if (!userId) return

    try {
      const response = await fetch(`/api/stats?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suas Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.total_exams === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suas Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Complete alguns simulados para ver suas estatísticas.</p>
        </CardContent>
      </Card>
    )
  }

  const accuracy = stats.total_questions > 0 ? (stats.total_correct / stats.total_questions) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Suas Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.total_exams}</div>
            <div className="text-xs text-gray-500">Simulados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{accuracy.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Precisão</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{stats.best_score}%</div>
            <div className="text-xs text-gray-500">Melhor</div>
          </div>
        </div>

        {stats.total_time_minutes > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {Math.floor(stats.total_time_minutes / 60)}h {stats.total_time_minutes % 60}m estudados
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
