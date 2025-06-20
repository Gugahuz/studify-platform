"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, Clock, TrendingUp, BarChart3, Zap } from "lucide-react"

interface UserStatistics {
  total_exams_completed: number
  total_questions_answered: number
  total_correct_answers: number
  overall_accuracy: number
  average_score: number
  best_score: number
  worst_score: number
  current_streak: number
  longest_streak: number
  total_hours_studied: number
  last_exam_date: string | null
  created_at: string | null
}

interface UserStatsCardProps {
  userId: string
  className?: string
}

export function UserStatsCard({ userId, className = "" }: UserStatsCardProps) {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatistics()
  }, [userId])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user-statistics?userId=${userId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }

      const data = await response.json()
      setStatistics(data.statistics)
    } catch (err) {
      console.error("Error fetching statistics:", err)
      setError("Erro ao carregar estatísticas")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getStreakBadgeColor = (streak: number) => {
    if (streak >= 7) return "bg-green-500"
    if (streak >= 3) return "bg-yellow-500"
    return "bg-blue-500"
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: "Excelente", color: "text-green-600" }
    if (score >= 80) return { label: "Muito Bom", color: "text-blue-600" }
    if (score >= 70) return { label: "Bom", color: "text-yellow-600" }
    if (score >= 60) return { label: "Regular", color: "text-orange-600" }
    return { label: "Precisa Melhorar", color: "text-red-600" }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!statistics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-gray-500">Nenhuma estatística disponível</p>
        </CardContent>
      </Card>
    )
  }

  const performanceLevel = getPerformanceLevel(statistics.average_score)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{statistics.total_exams_completed}</span>
            </div>
            <p className="text-sm text-gray-600">Simulados Concluídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{statistics.overall_accuracy.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-gray-600">Precisão Geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{statistics.current_streak}</span>
            </div>
            <p className="text-sm text-gray-600">Sequência Atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{statistics.total_hours_studied.toFixed(1)}h</span>
            </div>
            <p className="text-sm text-gray-600">Tempo Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Desempenho Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Média Geral:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{statistics.average_score.toFixed(1)}%</span>
                <Badge className={performanceLevel.color}>{performanceLevel.label}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{statistics.average_score.toFixed(1)}%</span>
              </div>
              <Progress value={statistics.average_score} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{statistics.best_score.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Melhor Nota</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{statistics.worst_score.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">Pior Nota</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Atividade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Questões Respondidas:</span>
              <span className="font-semibold">{statistics.total_questions_answered}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Acertos:</span>
              <span className="font-semibold text-green-600">{statistics.total_correct_answers}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sequência Máxima:</span>
              <Badge className={getStreakBadgeColor(statistics.longest_streak)}>{statistics.longest_streak} dias</Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Último Simulado:</span>
              <span className="font-semibold">{formatDate(statistics.last_exam_date)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
