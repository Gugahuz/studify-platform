"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Trophy } from "lucide-react"
import Link from "next/link"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"

interface TestAnswer {
  questionId: number
  selectedAnswer: number | null
  timeSpent: number
}

interface TestQuestion {
  id: number
  subject: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface TestProps {
  id: number
  title: string
  subject: string
  duration: number
  questions: TestQuestion[]
  description?: string
}

interface TestResultsProps {
  test: TestProps
  answers: TestAnswer[]
  timeRemaining: number
  totalTime: number
  onRestart: () => void
  onBackToTests: () => void
  userRating: number
  onRatingChange: (rating: number) => void
}

export function TestResults({
  test,
  answers,
  timeRemaining,
  totalTime,
  onRestart,
  onBackToTests,
  userRating,
  onRatingChange,
}: TestResultsProps) {
  const { userProfile } = useUserData()
  const { toast } = useToast()
  const [showDetails, setShowDetails] = useState(false)
  const [savingResults, setSavingResults] = useState(false)
  const [resultsSaved, setResultsSaved] = useState(false)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  // Calculate results
  const correctAnswers = answers.filter((answer, index) => {
    const question = test.questions[index]
    return answer.selectedAnswer === question.correctAnswer
  }).length

  const incorrectAnswers = answers.filter((answer, index) => {
    const question = test.questions[index]
    return answer.selectedAnswer !== null && answer.selectedAnswer !== question.correctAnswer
  }).length

  const unansweredQuestions = answers.filter((answer) => answer.selectedAnswer === null).length
  const score = (correctAnswers / test.questions.length) * 100
  const timeSpent = totalTime - timeRemaining

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Calculate performance by subject
  const subjectPerformance = test.questions.reduce(
    (acc: Record<string, { total: number; correct: number }>, question, index) => {
      const subject = question.subject
      if (!acc[subject]) {
        acc[subject] = { total: 0, correct: 0 }
      }

      acc[subject].total++

      const answer = answers[index]
      if (answer.selectedAnswer === question.correctAnswer) {
        acc[subject].correct++
      }

      return acc
    },
    {},
  )

  // Save results to database
  const saveResults = async () => {
    if (!userProfile?.id || resultsSaved || savingResults) return

    try {
      setSavingResults(true)

      const testAnswers = test.questions.map((question, index) => {
        const answer = answers[index]
        return {
          question_id: question.id,
          question_text: question.question,
          user_answer: answer.selectedAnswer !== null ? test.questions[index].options[answer.selectedAnswer] : null,
          correct_answer: test.questions[index].options[question.correctAnswer],
          is_correct: answer.selectedAnswer === question.correctAnswer,
          time_spent: answer.timeSpent || 0,
          subject_area: question.subject,
          difficulty: "Médio",
        }
      })

      console.log("💾 Attempting to save test results...")
      console.log("👤 User ID:", userProfile.id, "Type:", typeof userProfile.id)
      console.log("🧪 Test ID:", test.id, "Type:", typeof test.id)
      console.log("📊 Score:", score)

      const requestBody = {
        user_id: userProfile.id,
        test_id: test.id,
        test_title: test.title,
        subject: test.subject, // This will be 'test_subject' in the API
        description: test.description || `Simulado sobre ${test.title}`, // Add a default description
        test_duration_minutes: test.duration, // Add original test duration
        score: score,
        total_questions: test.questions.length,
        correct_answers: correctAnswers,
        incorrect_answers: incorrectAnswers,
        unanswered_questions: unansweredQuestions,
        time_spent: timeSpent,
        time_allowed: totalTime,
        answers: testAnswers,
        user_rating: userRating,
      }

      console.log("📤 Request body:", JSON.stringify(requestBody, null, 2))

      const response = await fetch("/api/test-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("📥 Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Falha ao decodificar erro do servidor." }))
        console.error("❌ Response error object:", errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Response data:", data)

      if (data.success) {
        setResultsSaved(true)
        console.log("✅ Results saved successfully with ID:", data.data.attempt_id)
        toast({
          title: "Resultados salvos",
          description: data.message || "Seus resultados foram salvos com sucesso no seu histórico.",
        })

        // Force refresh of history page data
        if (typeof window !== "undefined") {
          localStorage.setItem("test-completed", Date.now().toString())
        }
      } else {
        throw new Error(data.error || "Erro ao salvar resultados")
      }
    } catch (error) {
      console.error("❌ Error saving results:", (error as Error).message)
      toast({
        title: "Erro ao Salvar",
        description: (error as Error).message || "Não foi possível salvar seus resultados. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSavingResults(false)
    }
  }

  // Save results when component mounts
  useEffect(() => {
    if (userProfile?.id && !resultsSaved && !savingResults) {
      // Add a small delay to ensure everything is ready
      const timer = setTimeout(() => {
        saveResults()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [userProfile])

  // Performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "Excelente", color: "bg-green-500", textColor: "text-green-700" }
    if (score >= 70) return { level: "Bom", color: "bg-blue-500", textColor: "text-blue-700" }
    if (score >= 50) return { level: "Regular", color: "bg-yellow-500", textColor: "text-yellow-700" }
    return { level: "Precisa Melhorar", color: "bg-red-500", textColor: "text-red-700" }
  }

  const performanceLevel = getPerformanceLevel(score)

  const handleRatingChange = (rating: number) => {
    onRatingChange(rating)
    setRatingSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Teste Concluído!</h1>
          </div>
          <p className="text-lg text-gray-600 mb-4">{test.title}</p>
          <div className="inline-block">
            <span className={`px-4 py-2 rounded-full text-white font-medium ${performanceLevel.color}`}>
              {performanceLevel.level}
            </span>
          </div>

          {/* Debug info for development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-left">
              <strong>Debug Info:</strong>
              <br />
              User ID: {userProfile?.id} ({typeof userProfile?.id})<br />
              Test ID: {test.id} ({typeof test.id})<br />
              Score: {score}
              <br />
              Results Saved: {resultsSaved ? "Yes" : "No"}
              <br />
              Saving: {savingResults ? "Yes" : "No"}
            </div>
          )}
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">{score.toFixed(0)}%</div>
              <div className="text-sm text-gray-600 mb-3">Pontuação Final</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <svg className="h-6 w-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-4xl font-bold text-green-600">{correctAnswers}</span>
              </div>
              <div className="text-sm text-gray-600">Acertos</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <svg className="h-6 w-6 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-4xl font-bold text-red-600">{incorrectAnswers}</span>
              </div>
              <div className="text-sm text-gray-600">Erros</div>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-2">
                <svg className="h-6 w-6 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-4xl font-bold text-blue-600">{formatTime(timeSpent)}</span>
              </div>
              <div className="text-sm text-gray-600">Tempo Gasto</div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics and Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Detailed Statistics */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Estatísticas Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Total de questões:</span>
                  <span className="font-medium">{test.questions.length}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Questões respondidas:</span>
                  <span className="font-medium">{correctAnswers + incorrectAnswers}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Questões não respondidas:</span>
                  <span className="font-medium">{unansweredQuestions}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Tempo total disponível:</span>
                  <span className="font-medium">{formatTime(totalTime)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Tempo utilizado:</span>
                  <span className="font-medium">{formatTime(timeSpent)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Tempo restante:</span>
                  <span className="font-medium text-green-600">{formatTime(timeRemaining)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tempo médio por questão:</span>
                  <span className="font-medium">
                    {formatTime(Math.round(timeSpent / (correctAnswers + incorrectAnswers || 1)))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance by Subject */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center gap-2 text-gray-700">
                <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Desempenho por Matéria
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {Object.entries(subjectPerformance).map(([subject, data]) => {
                  const percentage = (data.correct / data.total) * 100
                  return (
                    <div key={subject}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700">{subject}</span>
                        <span className="text-sm font-semibold">
                          {data.correct}/{data.total} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-gray-700">Avalie este simulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Como você avalia este simulado?</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className="focus:outline-none transition-colors"
                    disabled={ratingSubmitted}
                  >
                    <Star
                      className={`h-6 w-6 ${star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
              {ratingSubmitted && <span className="text-green-600 font-medium">Obrigado pela sua avaliação!</span>}
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-700">Revisão das Questões</CardTitle>
              <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Ocultar Detalhes" : "Mostrar Detalhes"}
              </Button>
            </div>
          </CardHeader>
          {showDetails && (
            <CardContent className="space-y-6">
              {test.questions.map((question, index) => {
                const answer = answers[index]
                const isCorrect = answer.selectedAnswer === question.correctAnswer
                const wasAnswered = answer.selectedAnswer !== null

                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isCorrect
                            ? "bg-green-100 text-green-700"
                            : wasAnswered
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {isCorrect ? "✓" : wasAnswered ? "✗" : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">Questão {index + 1}</span>
                          <span className="text-sm text-gray-600">{question.subject}</span>
                          <span className="text-sm text-gray-500">Tempo: {formatTime(answer.timeSpent || 0)}</span>
                        </div>
                        <p className="text-gray-800 mb-3">{question.question}</p>

                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const isUserAnswer = answer.selectedAnswer === optionIndex
                            const isCorrectAnswer = question.correctAnswer === optionIndex

                            return (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded text-sm ${
                                  isCorrectAnswer
                                    ? "bg-green-100 text-green-800 border border-green-300"
                                    : isUserAnswer && !isCorrectAnswer
                                      ? "bg-red-100 text-red-800 border border-red-300"
                                      : "bg-gray-50"
                                }`}
                              >
                                <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)})</span>
                                {option}
                                {isCorrectAnswer && <span className="ml-2 text-green-600">✓ Correta</span>}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <span className="ml-2 text-red-600">✗ Sua resposta</span>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Explicação:</strong> {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          )}
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={onRestart} variant="outline">
            Refazer Teste
          </Button>
          <Link href="/dashboard/simulados/historico">
            <Button variant="outline">Ver Histórico</Button>
          </Link>
          <Button onClick={onBackToTests}>Voltar para Simulados</Button>
        </div>
      </div>
    </div>
  )
}
