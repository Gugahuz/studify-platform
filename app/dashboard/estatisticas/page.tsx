"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStatistics } from "@/hooks/use-user-statistics"
import { Trophy, Target, Clock, TrendingUp, Calendar, BookOpen } from "lucide-react"

export default function EstatisticasPage() {
  const { statistics, loading, error } = useUserStatistics()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">Erro ao carregar estatísticas</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma estatística encontrada</h3>
              <p className="text-gray-600">Complete alguns simulados para ver suas estatísticas aqui.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Suas Estatísticas</h1>
        <p className="text-gray-600">Acompanhe seu progresso e performance nos simulados</p>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Exams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Simulados</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalExams}</div>
            <p className="text-xs text-muted-foreground">simulados realizados</p>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">pontuação média</p>
          </CardContent>
        </Card>

        {/* Best Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhor Nota</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.bestScore}%</div>
            <p className="text-xs text-muted-foreground">maior pontuação</p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.currentStreak}</div>
            <p className="text-xs text-muted-foreground">simulados consecutivos</p>
          </CardContent>
        </Card>

        {/* Total Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreforeground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(statistics.totalTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">tempo estudando</p>
          </CardContent>
        </Card>

        {/* Accuracy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalQuestions > 0
                ? ((statistics.totalCorrectAnswers / statistics.totalQuestions) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalCorrectAnswers} de {statistics.totalQuestions} questões
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      {Object.keys(statistics.subjectPerformance).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance por Matéria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statistics.subjectPerformance).map(([subject, performance]) => {
                const percentage = performance.total > 0 ? (performance.correct / performance.total) * 100 : 0

                return (
                  <div key={subject} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{subject}</span>
                      <Badge variant={percentage >= 70 ? "default" : "secondary"}>{percentage.toFixed(1)}%</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {performance.correct}/{performance.total} questões
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 inline mr-1" />
          Última atualização: {new Date(statistics.lastUpdated).toLocaleString("pt-BR")}
        </p>
      </div>
    </div>
  )
}
