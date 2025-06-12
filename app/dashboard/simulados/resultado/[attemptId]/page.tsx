"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Trophy, Clock, CheckCircle, XCircle, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MaintenanceMessage } from "@/components/maintenance-message"

interface TestAnswerDetail {
  id: number
  attempt_id: string
  question_id: number
  question_text: string
  user_answer: string | null
  correct_answer: string
  is_correct: boolean
  time_spent_on_question_seconds: number | null
  subject_area: string | null
  difficulty: string | null
}

interface TestDetails {
  id: number
  title: string
  subject: string | null
  description: string | null
  duration_minutes: number | null
}

interface AttemptDetails {
  id: string
  user_id: string
  test_id: number
  score: number
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  unanswered_questions: number
  time_spent_seconds: number
  time_allowed_seconds: number
  completed_at: string
  user_rating: number | null
  tests: TestDetails // Joined test data
}

interface FullResultData {
  attempt: AttemptDetails
  answers: TestAnswerDetail[]
}

export default function SimuladoResultadoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const attemptId = params.attemptId as string

  const [resultData, setResultData] = useState<FullResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentRating, setCurrentRating] = useState<number>(0)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  useEffect(() => {
    if (attemptId) {
      fetchResultDetails()
    }
  }, [attemptId])

  const fetchResultDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/test-results/${attemptId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Failed to fetch result details: ${response.statusText}`)
      }
      const data = await response.json()
      if (data.success) {
        setResultData(data.data)
        setCurrentRating(data.data.attempt.user_rating || 0)
        setRatingSubmitted(!!data.data.attempt.user_rating)
      } else {
        throw new Error(data.error || "Could not load result details.")
      }
    } catch (err: any) {
      setError(err.message)
      toast({ title: "Erro ao Carregar Resultado", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleRatingChange = async (rating: number) => {
    if (!resultData) return
    setCurrentRating(rating)
    try {
      const response = await fetch(`/api/test-results/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_rating: rating }),
      })
      const data = await response.json()
      if (data.success) {
        toast({ title: "Avaliação Enviada", description: "Obrigado pelo seu feedback!" })
        setRatingSubmitted(true)
        // Update local data if needed, or rely on re-fetch/state
        setResultData((prev) => (prev ? { ...prev, attempt: { ...prev.attempt, user_rating: rating } } : null))
      } else {
        throw new Error(data.error || "Falha ao enviar avaliação.")
      }
    } catch (err: any) {
      toast({ title: "Erro na Avaliação", description: err.message, variant: "destructive" })
      setCurrentRating(resultData.attempt.user_rating || 0) // Revert on error
    }
  }

  const formatTime = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return "N/A"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m ` : ""}${s}s`
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "Excelente", color: "bg-green-500", textColor: "text-green-700" }
    if (score >= 70) return { level: "Bom", color: "bg-blue-500", textColor: "text-blue-700" }
    if (score >= 50) return { level: "Regular", color: "bg-yellow-500", textColor: "text-yellow-700" }
    return { level: "Precisa Melhorar", color: "bg-red-500", textColor: "text-red-700" }
  }

  useEffect(() => {
    if (attemptId) {
      fetchResultDetails()
    }
    // Redirect to the main simulados page after a short delay
    const timer = setTimeout(() => {
      router.push("/dashboard/simulados")
    }, 3000)

    return () => clearTimeout(timer)
  }, [attemptId, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <MaintenanceMessage
          title="Redirecionando..."
          message="Esta página está temporariamente indisponível. Você será redirecionado automaticamente."
          showBackButton={false}
        />
      </div>
    )
  }

  const { attempt, answers } = resultData
  const performance = getPerformanceLevel(attempt.score)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <CardTitle className="text-2xl font-bold mb-1">{attempt.tests.title}</CardTitle>
                <Badge variant="outline" className="text-sm mb-2 sm:mb-0">
                  {attempt.tests.subject || "Geral"}
                </Badge>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm text-white font-medium ${performance.color}`}>
                {performance.level} ({attempt.score.toFixed(1)}%)
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Realizado em: {new Date(attempt.completed_at).toLocaleString("pt-BR")}
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{attempt.score.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Pontuação</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{attempt.correct_answers}</p>
              <p className="text-sm text-gray-600">Acertos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{attempt.incorrect_answers}</p>
              <p className="text-sm text-gray-600">Erros</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-xl font-bold">{formatTime(attempt.time_spent_seconds)}</p>
              <p className="text-sm text-gray-600">Tempo Gasto</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes das Respostas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {answers.map((ans, index) => (
              <div key={ans.id || index} className="p-4 border rounded-lg bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-md">
                    Questão {index + 1}
                    {ans.subject_area && (
                      <Badge variant="secondary" className="ml-2">
                        {ans.subject_area}
                      </Badge>
                    )}
                  </h4>
                  {ans.is_correct ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <p className="text-gray-700 mb-2 whitespace-pre-line">{ans.question_text}</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Sua Resposta:</strong>{" "}
                    <span className={ans.is_correct ? "text-green-700" : "text-red-700"}>
                      {ans.user_answer || "Não respondida"}
                    </span>
                  </p>
                  {!ans.is_correct && (
                    <p>
                      <strong>Resposta Correta:</strong> <span className="text-green-700">{ans.correct_answer}</span>
                    </p>
                  )}
                  {/* Add explanation here if available in ans object */}
                </div>
              </div>
            ))}
            {answers.length === 0 && <p className="text-gray-600">Detalhes das respostas não disponíveis.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avalie este Simulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  disabled={ratingSubmitted && currentRating > 0}
                  className="focus:outline-none transition-colors"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= currentRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
              {ratingSubmitted && currentRating > 0 && (
                <span className="text-sm text-green-600 ml-2">Avaliação registrada!</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
