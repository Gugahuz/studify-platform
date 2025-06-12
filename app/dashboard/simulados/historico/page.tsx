"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy, Clock, Target, TrendingUp, Calendar, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import { MaintenanceMessage } from "@/components/maintenance-message"

interface TestAttempt {
  id: string
  user_id: string
  test_id: number
  test_title?: string
  subject?: string
  score: number
  total_questions: number
  correct_answers: number
  incorrect_answers: number
  unanswered_questions?: number
  time_spent?: number
  time_allowed?: number
  completed_at?: string
  created_at?: string
}

interface Statistics {
  totalAttempts: number
  averageScore: number
  totalCorrect: number
  totalIncorrect: number
  averageTime: number
  subjectPerformance: Array<{
    subject: string
    attempts: number
    averageScore: number
    totalCorrect: number
    totalIncorrect: number
  }>
}

export default function TestHistoryPage() {
  const { userProfile } = useUserData()
  const { toast } = useToast()
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTestHistory = async (showRefreshToast = false) => {
    if (!userProfile?.id) return

    try {
      if (showRefreshToast) setRefreshing(true)

      console.log("📊 Fetching test history for user:", userProfile.id)

      const response = await fetch(`/api/test-results?user_id=${userProfile.id}&limit=50`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📥 Received test history data:", data)

      if (data.success) {
        setAttempts(data.data.attempts || [])
        setStatistics(data.data.statistics || null)
        setError(null)

        if (showRefreshToast) {
          toast({
            title: "Histórico atualizado",
            description: `Encontrados ${data.data.attempts?.length || 0} simulados realizados.`,
          })
        }
      } else {
        throw new Error(data.error || "Erro ao carregar histórico")
      }
    } catch (error) {
      console.error("❌ Error fetching test history:", error)
      setError("Erro ao carregar histórico de simulados")

      if (showRefreshToast) {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível carregar o histórico. Tente novamente.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
      if (showRefreshToast) setRefreshing(false)
    }
  }

  useEffect(() => {
    if (userProfile?.id) {
      fetchTestHistory()
    }
  }, [userProfile])

  // Check for recent test completion
  useEffect(() => {
    const checkForNewTest = () => {
      const testCompleted = localStorage.getItem("test-completed")
      if (testCompleted) {
        const completedTime = Number.parseInt(testCompleted)
        const now = Date.now()

        // If test was completed in the last 30 seconds, refresh the data
        if (now - completedTime < 30000) {
          console.log("🔄 Recent test completion detected, refreshing data...")
          setTimeout(() => fetchTestHistory(true), 2000) // Wait 2 seconds then refresh
          localStorage.removeItem("test-completed")
        }
      }
    }

    checkForNewTest()

    // Also check when the page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForNewTest()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  const formatTime = (seconds: number) => {
    if (!seconds) return "N/A"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data não disponível"
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Data inválida"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 70) return "bg-blue-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return "Excelente"
    if (score >= 70) return "Bom"
    if (score >= 50) return "Regular"
    return "Precisa Melhorar"
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
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
        <MaintenanceMessage
          title="Histórico de Simulados em Manutenção"
          message="O histórico de simulados está temporariamente indisponível enquanto implementamos melhorias no sistema. Seus dados anteriores serão preservados e estarão disponíveis quando o serviço retornar."
          showBackButton={true}
          backUrl="/dashboard"
          backText="Voltar ao Dashboard"
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Simulados</h1>
          <p className="text-gray-600">Acompanhe seu desempenho nos simulados realizados</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchTestHistory(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Link href="/dashboard/simulados">
            <Button>Fazer Simulado</Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Total de Simulados</p>
                  <p className="text-2xl font-bold">{statistics.totalAttempts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Média Geral</p>
                  <p className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Total de Acertos</p>
                  <p className="text-2xl font-bold">{statistics.totalCorrect}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold">{formatTime(Math.round(statistics.averageTime))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subject Performance */}
      {statistics && statistics.subjectPerformance.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Desempenho por Matéria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statistics.subjectPerformance.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{subject.subject}</h3>
                    <p className="text-sm text-gray-600">
                      {subject.attempts} simulado{subject.attempts !== 1 ? "s" : ""} • {subject.totalCorrect} acertos •{" "}
                      {subject.totalIncorrect} erros
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{subject.averageScore.toFixed(1)}%</div>
                    <Badge variant="secondary" className={`${getPerformanceColor(subject.averageScore)} text-white`}>
                      {getPerformanceLabel(subject.averageScore)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Attempts List */}
      {attempts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Simulados Realizados</h2>
          {attempts.map((attempt) => (
            <Card key={attempt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {attempt.test_title || `Simulado #${attempt.test_id}`}
                    </h3>
                    <p className="text-sm text-gray-600">{attempt.subject || "Matéria não especificada"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{attempt.score.toFixed(1)}%</div>
                    <Badge variant="secondary" className={`${getPerformanceColor(attempt.score)} text-white`}>
                      {getPerformanceLabel(attempt.score)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Questões</p>
                    <p className="font-medium">{attempt.total_questions || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Acertos</p>
                    <p className="font-medium text-green-600">{attempt.correct_answers || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Erros</p>
                    <p className="font-medium text-red-600">{attempt.incorrect_answers || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tempo</p>
                    <p className="font-medium">{formatTime(attempt.time_spent || 0)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {formatDate(attempt.completed_at || attempt.created_at || "")}
                  </div>
                  <Link href={`/dashboard/simulados/resultado/${attempt.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum simulado realizado</h3>
            <p className="text-gray-600 mb-6">
              Você ainda não realizou nenhum simulado. Comece agora para acompanhar seu progresso!
            </p>
            <Link href="/dashboard/simulados">
              <Button>Fazer um Simulado</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
