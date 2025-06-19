"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  RotateCcw,
  History,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react"
import type { MockExamAttempt, MockExamResponse } from "@/types/mock-exams"

interface MockExamResultsProps {
  attempt: MockExamAttempt
  responses: MockExamResponse[]
  onRetake: () => void
  onViewHistory: () => void
  onBackToDashboard: () => void
}

interface SubjectPerformance {
  subject_area: string
  total_questions: number
  correct_answers: number
  percentage: number
}

export function MockExamResults({
  attempt,
  responses = [], // Default empty array
  onRetake,
  onViewHistory,
  onBackToDashboard,
}: MockExamResultsProps) {
  const [rating, setRating] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  // Safe access to attempt properties with defaults
  const safeAttempt = useMemo(
    () => ({
      percentage: attempt?.percentage || 0,
      correct_answers: attempt?.correct_answers || 0,
      incorrect_answers: attempt?.incorrect_answers || 0,
      total_questions: attempt?.total_questions || 0,
      answered_questions: attempt?.answered_questions || 0,
      skipped_questions: attempt?.skipped_questions || 0,
      time_spent_seconds: attempt?.time_spent_seconds || 0,
      time_limit_seconds: attempt?.time_limit_seconds || 0,
      total_points: attempt?.total_points || 0,
      max_points: attempt?.max_points || 0,
      mock_exam_templates: attempt?.mock_exam_templates || { title: "Simulado", passing_score: 60 },
      id: attempt?.id || "",
    }),
    [attempt],
  )

  // Calculate subject performance using useMemo to prevent recalculation on every render
  const subjectPerformance = useMemo(() => {
    // Safe check for responses array
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      console.log("No responses available for subject performance calculation")
      return []
    }

    // Calculate subject performance
    const subjectMap: Record<string, { total: number; correct: number }> = {}

    responses.forEach((response) => {
      const subject = response?.mock_exam_questions?.subject_area || "Geral"
      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, correct: 0 }
      }
      subjectMap[subject].total++
      if (response?.is_correct) {
        subjectMap[subject].correct++
      }
    })

    return Object.entries(subjectMap).map(([subject, data]) => ({
      subject_area: subject,
      total_questions: data.total,
      correct_answers: data.correct,
      percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
    }))
  }, [responses]) // Only recalculate when responses change

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating)

    try {
      await fetch(`/api/mock-exams/attempts/${safeAttempt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_rating: newRating }),
      })
    } catch (error) {
      console.error("Error saving rating:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 90) return "Excelente"
    if (percentage >= 80) return "Muito Bom"
    if (percentage >= 70) return "Bom"
    if (percentage >= 60) return "Regular"
    return "Precisa Melhorar"
  }

  const getSubjectColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const passingScore = safeAttempt.mock_exam_templates?.passing_score || 60
  const passed = safeAttempt.percentage >= passingScore

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Teste Concluído!</h1>
          </div>
          <h2 className="text-xl text-gray-600 mb-2">{safeAttempt.mock_exam_templates?.title || "Simulado"}</h2>
          <Badge className="bg-yellow-100 text-yellow-800">{getPerformanceLabel(safeAttempt.percentage)}</Badge>
          {passed && <p className="text-green-600 font-medium mt-2">✅ Você atingiu a meta de {passingScore}%!</p>}
        </div>

        {/* Main Results */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Score */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-8 text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">{safeAttempt.percentage.toFixed(0)}%</div>
              <div className="text-green-700 font-medium">Pontuação Final</div>
              <Progress value={safeAttempt.percentage} className="mt-4 h-3" />
            </CardContent>
          </Card>

          {/* Correct Answers */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="text-5xl font-bold text-blue-600">{safeAttempt.correct_answers}</div>
              </div>
              <div className="text-blue-700 font-medium">Acertos</div>
            </CardContent>
          </Card>

          {/* Errors */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="text-5xl font-bold text-red-600">{safeAttempt.incorrect_answers}</div>
              </div>
              <div className="text-red-700 font-medium">Erros</div>
            </CardContent>
          </Card>

          {/* Time Spent */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="text-3xl font-bold text-purple-600">{formatTime(safeAttempt.time_spent_seconds)}</div>
              </div>
              <div className="text-purple-700 font-medium">Tempo Gasto</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Detailed Statistics */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Target className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Estatísticas Detalhadas</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total de questões:</span>
                  <span className="font-semibold">{safeAttempt.total_questions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questões respondidas:</span>
                  <span className="font-semibold">{safeAttempt.answered_questions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Questões não respondidas:</span>
                  <span className="font-semibold">{safeAttempt.skipped_questions}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tempo total disponível:</span>
                  <span className="font-semibold">{formatTime(safeAttempt.time_limit_seconds)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tempo utilizado:</span>
                  <span className="font-semibold">{formatTime(safeAttempt.time_spent_seconds)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tempo restante:</span>
                  <span className="font-semibold text-green-600">
                    {formatTime(Math.max(0, safeAttempt.time_limit_seconds - safeAttempt.time_spent_seconds))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tempo médio por questão:</span>
                  <span className="font-semibold">
                    {safeAttempt.answered_questions > 0
                      ? Math.round(safeAttempt.time_spent_seconds / safeAttempt.answered_questions)
                      : 0}
                    s
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Desempenho por Matéria</h3>
              </div>

              <div className="space-y-4">
                {subjectPerformance.length > 0 ? (
                  subjectPerformance.map((subject) => (
                    <div key={subject.subject_area}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{subject.subject_area}</span>
                        <span className="text-sm text-gray-600">
                          {subject.correct_answers}/{subject.total_questions} ({subject.percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getSubjectColor(subject.percentage)}`}
                          style={{ width: `${subject.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">Nenhum dado de performance disponível</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Avalie este simulado</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-600">Como você avalia este simulado?</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className={`h-6 w-6 ${star <= rating ? "text-yellow-500 fill-current" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revisão das Questões</h3>
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2"
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? "Ocultar Detalhes" : "Mostrar Detalhes"}
              </Button>
            </div>

            {showDetails && (
              <div className="space-y-6">
                {responses.length > 0 ? (
                  responses.map((response, index) => (
                    <div key={response.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-1 rounded ${response.is_correct ? "bg-green-100" : "bg-red-100"}`}>
                          {response.is_correct ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">Questão {index + 1}</span>
                            <Badge variant="outline">{response.mock_exam_questions?.subject_area || "Geral"}</Badge>
                            <span className="text-sm text-gray-500">
                              Tempo: {Math.round(response.time_spent_seconds || 0)}s
                            </span>
                          </div>

                          <div className="mb-3">
                            <p className="text-gray-900 leading-relaxed">
                              {response.mock_exam_questions?.question_text || "Questão não disponível"}
                            </p>
                          </div>

                          {response.mock_exam_questions?.options && (
                            <div className="space-y-2 mb-3">
                              {response.mock_exam_questions.options.map((option, optionIndex) => {
                                const optionLetter = String.fromCharCode(65 + optionIndex)
                                const isUserAnswer = option === response.user_answer
                                const isCorrectAnswer = option === response.mock_exam_questions?.correct_answer

                                return (
                                  <div
                                    key={optionIndex}
                                    className={`p-2 rounded border ${
                                      isCorrectAnswer
                                        ? "bg-green-50 border-green-200"
                                        : isUserAnswer && !isCorrectAnswer
                                          ? "bg-red-50 border-red-200"
                                          : "bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{optionLetter})</span>
                                      <span>{option}</span>
                                      {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
                                      {isUserAnswer && !isCorrectAnswer && (
                                        <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {response.mock_exam_questions?.explanation && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <div className="flex items-start gap-2">
                                <div className="text-blue-600 font-medium text-sm">Explicação:</div>
                              </div>
                              <p className="text-blue-800 text-sm mt-1">{response.mock_exam_questions.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">Nenhuma resposta disponível para revisão</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button onClick={onRetake} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Refazer Teste
          </Button>
          <Button onClick={onViewHistory} variant="outline" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Ver Histórico
          </Button>
          <Button onClick={onBackToDashboard} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Simulados
          </Button>
        </div>
      </div>
    </div>
  )
}
