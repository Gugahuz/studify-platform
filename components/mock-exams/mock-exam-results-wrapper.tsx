"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, Clock, RotateCcw, History, Home } from "lucide-react"

interface MockExamAttempt {
  id: string
  user_id: string
  template_id: string
  templateTitle: string
  percentage: number
  correctAnswers: number
  totalQuestions: number
  score: number
  timeSpent: number
  endTime: string | null
}

interface MockExamResultsWrapperProps {
  attempt: MockExamAttempt
  onRetake: () => void
  onViewHistory: () => void
  onBackToDashboard: () => void
}

export function MockExamResultsWrapper({
  attempt,
  onRetake,
  onViewHistory,
  onBackToDashboard,
}: MockExamResultsWrapperProps) {
  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 90) return "Excelente"
    if (percentage >= 80) return "Muito Bom"
    if (percentage >= 70) return "Bom"
    if (percentage >= 60) return "Regular"
    return "Precisa Melhorar"
  }

  const getPerformanceBadgeColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 text-green-800"
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Trophy className={`h-16 w-16 mx-auto mb-4 ${getPerformanceColor(attempt.percentage)}`} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulado Concluído!</h1>
          <p className="text-gray-600">{attempt.templateTitle}</p>
        </div>

        {/* Results Summary */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Seu Resultado</CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`text-4xl font-bold ${getPerformanceColor(attempt.percentage)}`}>
                {attempt.percentage}%
              </span>
              <Badge className={getPerformanceBadgeColor(attempt.percentage)}>
                {getPerformanceLabel(attempt.percentage)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {attempt.correctAnswers}/{attempt.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Acertos</div>
              </div>

              <div className="text-center">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{formatTime(attempt.timeSpent)}</div>
                <div className="text-sm text-gray-600">Tempo Gasto</div>
              </div>

              <div className="text-center">
                <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{attempt.score}</div>
                <div className="text-sm text-gray-600">Pontuação</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Análise de Desempenho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Questões Corretas</span>
                <span className="font-medium text-green-600">{attempt.correctAnswers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Questões Incorretas</span>
                <span className="font-medium text-red-600">{attempt.totalQuestions - attempt.correctAnswers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Taxa de Acerto</span>
                <span className={`font-medium ${getPerformanceColor(attempt.percentage)}`}>{attempt.percentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Data de Realização</span>
                <span className="font-medium">
                  {attempt.endTime ? new Date(attempt.endTime).toLocaleDateString("pt-BR") : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onRetake} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Refazer Simulado
          </Button>

          <Button variant="outline" onClick={onViewHistory} className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Ver Histórico
          </Button>

          <Button variant="outline" onClick={onBackToDashboard} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Voltar ao Início
          </Button>
        </div>
      </div>
    </div>
  )
}
