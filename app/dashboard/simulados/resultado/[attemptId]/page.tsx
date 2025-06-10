"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, CheckCircle, XCircle, Star, Award, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface TestAnswer {
  id: string
  question_id: number
  question_text: string
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
  time_spent: number
  subject_area: string
  difficulty: string
}

interface TestAttempt {
  id: string
  test_id: number
  test_title: string
  subject: string
  score: number
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  unanswered_questions: number
  time_spent: number
  time_allowed: number
  completed_at: string
  user_rating?: number
}

interface TestResult {
  attempt: TestAttempt
  answers: TestAnswer[]
}

export default function TestResultPage() {
  const params = useParams()
  const { toast } = useToast()
  const attemptId = params.attemptId as string

  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (attemptId) {
      fetchTestResult()
    }
  }, [attemptId])

  const fetchTestResult = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/test-results/${attemptId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch test result")
      }

      setResult(data.data)
      setRating(data.data.attempt.user_rating || 0)
    } catch (error: any) {
      console.error("❌ Error fetching test result:", error)
      setError(error.message)
      toast({
        title: "Erro ao carregar resultado",
        description: "Não foi possível carregar os detalhes do teste.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRating = async (newRating: number) => {
    try {
      setSubmittingRating(true)

      const response = await fetch(`/api/test-results/${attemptId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_rating: newRating }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to update rating")
      }

      setRating(newRating)
      toast({
        title: "Avaliação enviada",
        description: "Obrigado por avaliar este teste!",
        variant: "success",
      })
    } catch (error: any) {
      console.error("❌ Error updating rating:", error)
      toast({
        title: "Erro ao avaliar",
        description: "Não foi possível enviar sua avaliação.",
        variant: "destructive",
      })
    } finally {
      setSubmittingRating(false)
    }
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "Excelente", color: "text-green-600", bg: "bg-green-50" }
    if (score >= 80) return { level: "Muito Bom", color: "text-blue-600", bg: "bg-blue-50" }
    if (score >= 70) return { level: "Bom", color: "text-yellow-600", bg: "bg-yellow-50" }
    if (score >= 60) return { level: "Regular", color: "text-orange-600", bg: "bg-orange-50" }
    return { level: "Precisa Melhorar", color: "text-red-600", bg: "bg-red-50" }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/simulados/historico">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resultado do Teste</h1>
            <p className="text-gray-600">Detalhes do seu desempenho</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Erro ao carregar resultado do teste</p>
            <Button onClick={fetchTestResult}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { attempt, answers } = result
  const performance = getPerformanceLevel(attempt.score)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/simulados/historico">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Histórico
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultado do Teste</h1>
          <p className="text-gray-600">{attempt.test_title}</p>
        </div>
      </div>

      {/* Performance Overview */}
      <Card className="border-blue-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Award className="h-6 w-6 text-blue-600" />
                {attempt.test_title}
              </CardTitle>
              <CardDescription>
                Realizado em {formatDate(attempt.completed_at)} • {attempt.subject}
              </CardDescription>
            </div>
            <div className={`px-4 py-2 rounded-lg ${performance.bg}`}>
              <p className={`text-lg font-bold ${performance.color}`}>{attempt.score.toFixed(1)}%</p>
              <p className={`text-sm ${performance.color}`}>{performance.level}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Acertos</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{attempt.correct_answers}</p>
              <p className="text-sm text-gray-500">de {attempt.total_questions}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-gray-600">Erros</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{attempt.incorrect_answers}</p>
              <p className="text-sm text-gray-500">questões</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-600">Não Respondidas</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{attempt.unanswered_questions}</p>
              <p className="text-sm text-gray-500">questões</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600">Tempo Usado</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatTime(attempt.time_spent)}</p>
              <p className="text-sm text-gray-500">de {formatTime(attempt.time_allowed)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Section */}
      <Card>
        <CardHeader>
          <CardTitle>Avalie este teste</CardTitle>
          <CardDescription>Sua avaliação nos ajuda a melhorar a qualidade dos testes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  disabled={submittingRating}
                  className="p-1 hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating ? "text-yellow-400 fill-current" : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                Você avaliou este teste com {rating} estrela{rating > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Revisão das Questões</CardTitle>
          <CardDescription>Veja suas respostas e as correções detalhadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {answers.map((answer, index) => (
              <div key={answer.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        answer.is_correct
                          ? "bg-green-100 text-green-700"
                          : answer.user_answer
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {answer.subject_area} • {answer.difficulty}
                      </Badge>
                      {answer.time_spent > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Tempo: {formatTime(answer.time_spent)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {answer.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : answer.user_answer ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Questão:</h4>
                    <p className="text-gray-700">{answer.question_text}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-1">Sua resposta:</h5>
                      <p
                        className={`p-2 rounded text-sm ${
                          answer.user_answer
                            ? answer.is_correct
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {answer.user_answer || "Não respondida"}
                      </p>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-1">Resposta correta:</h5>
                      <p className="p-2 rounded text-sm bg-green-50 text-green-700">{answer.correct_answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/dashboard/simulados">
          <Button variant="outline">Fazer Outro Teste</Button>
        </Link>
        <Link href="/dashboard/simulados/historico">
          <Button>Ver Histórico Completo</Button>
        </Link>
      </div>
    </div>
  )
}
