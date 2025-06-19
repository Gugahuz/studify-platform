"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, Target, Trophy, TrendingUp } from "lucide-react"
import { MockExamStorage, type MockExamAttempt, formatTime } from "@/lib/mock-exam-data"

interface SimpleMockExamHistoryProps {
  onBack: () => void
  onReviewQuestions?: (attempt: MockExamAttempt) => void
}

export function SimpleMockExamHistory({ onBack, onReviewQuestions }: SimpleMockExamHistoryProps) {
  const [attempts, setAttempts] = useState<MockExamAttempt[]>([])

  useEffect(() => {
    const completedAttempts = MockExamStorage.getCompletedAttempts()
    setAttempts(completedAttempts.sort((a, b) => (b.endTime || 0) - (a.endTime || 0)))
  }, [])

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-100"
    if (percentage >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 90) return "Excelente"
    if (percentage >= 80) return "Muito Bom"
    if (percentage >= 70) return "Bom"
    if (percentage >= 60) return "Regular"
    return "Precisa Melhorar"
  }

  // Calculate stats
  const totalAttempts = attempts.length
  const averageScore =
    totalAttempts > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts) : 0
  const bestScore = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.percentage)) : 0
  const totalTimeSpent = attempts.reduce((sum, a) => sum + a.timeSpent, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Histórico de Simulados</h1>
            <p className="text-gray-600">Acompanhe seu progresso e desempenho</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{totalAttempts}</div>
              <div className="text-sm text-gray-600">Simulados Realizados</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{averageScore}%</div>
              <div className="text-sm text-gray-600">Média Geral</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{bestScore}%</div>
              <div className="text-sm text-gray-600">Melhor Resultado</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{formatTime(totalTimeSpent)}</div>
              <div className="text-sm text-gray-600">Tempo Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Attempts List */}
        {attempts.length > 0 ? (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{attempt.templateTitle}</h3>
                        <Badge className={getPerformanceColor(attempt.percentage)}>
                          {getPerformanceLabel(attempt.percentage)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">
                            {attempt.endTime ? new Date(attempt.endTime).toLocaleDateString("pt-BR") : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">
                            {attempt.correctAnswers}/{attempt.totalQuestions} acertos
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{attempt.percentage}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{formatTime(attempt.timeSpent)}</span>
                        </div>
                      </div>
                    </div>

                    {onReviewQuestions && (
                      <Button variant="outline" onClick={() => onReviewQuestions(attempt)}>
                        Revisar Questões
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum simulado realizado</h3>
              <p className="text-gray-600 mb-4">Você ainda não completou nenhum simulado.</p>
              <Button onClick={onBack}>Fazer Primeiro Simulado</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
