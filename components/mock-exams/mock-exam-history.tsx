"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Trophy,
  Target,
  Calendar,
  RefreshCw,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Award,
  BarChart3,
  AlertCircle,
  Database,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { MockExamAttempt } from "@/types/mock-exams"

interface MockExamHistoryProps {
  onViewDetails: (attemptId: string) => void
}

interface UserStats {
  total_attempts: number
  completed_attempts: number
  average_score: number
  best_score: number
  worst_score: number
  total_time_spent: number
  last_attempt_date: string
  unique_templates_completed: number
}

interface HistoryData {
  attempts: MockExamAttempt[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  userStats: UserStats | null
}

export function MockExamHistory({ onViewDetails }: MockExamHistoryProps) {
  const { toast } = useToast()
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const fetchHistory = async (page = 1, showToast = false) => {
    try {
      if (showToast) setRefreshing(true)
      setError(null)
      setDebugInfo(null)

      console.log("📊 Fetching mock exam history, page:", page)

      const response = await fetch(`/api/mock-exams/history?page=${page}&limit=10&include_stats=true`)

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ HTTP error:", response.status, errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` }
        }

        setError(errorData.error || `HTTP error ${response.status}`)
        setDebugInfo(errorData.debug)
        return
      }

      const result = await response.json()

      if (result.success) {
        setHistoryData(result.data)
        setCurrentPage(page)

        if (showToast) {
          toast({
            title: "Histórico atualizado",
            description: `${result.data.attempts.length} simulados encontrados.`,
          })
        }

        // Show setup message if needed
        if (result.message) {
          toast({
            title: "Informação",
            description: result.message,
            variant: "default",
          })
        }
      } else {
        throw new Error(result.error || "Erro ao carregar histórico")
      }
    } catch (error: any) {
      console.error("❌ Error fetching history:", error)
      setError(error.message)
      toast({
        title: "Erro ao carregar histórico",
        description: error.message || "Não foi possível carregar o histórico de simulados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      if (showToast) setRefreshing(false)
    }
  }

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!confirm("Tem certeza que deseja excluir este simulado do histórico?")) {
      return
    }

    try {
      setDeletingId(attemptId)

      const response = await fetch(`/api/mock-exams/history/${attemptId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Simulado excluído",
          description: "O simulado foi removido do seu histórico.",
        })

        // Refresh current page
        await fetchHistory(currentPage)
      } else {
        throw new Error(result.error || "Erro ao excluir simulado")
      }
    } catch (error: any) {
      console.error("❌ Error deleting attempt:", error)
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o simulado.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleCleanupHistory = async () => {
    if (!confirm("Deseja limpar automaticamente simulados antigos (mantendo apenas os 10 mais recentes)?")) {
      return
    }

    try {
      const response = await fetch("/api/mock-exams/history", {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Limpeza concluída",
          description: `${result.data.cleanedAttempts} simulados antigos foram removidos.`,
        })

        // Refresh current page
        await fetchHistory(1)
      } else {
        throw new Error(result.error || "Erro na limpeza")
      }
    } catch (error: any) {
      console.error("❌ Error cleaning up:", error)
      toast({
        title: "Erro na limpeza",
        description: error.message || "Não foi possível limpar o histórico.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchHistory(1)
  }, [])

  const formatTime = (seconds: number) => {
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
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 80) return "bg-blue-500"
    if (score >= 70) return "bg-yellow-500"
    if (score >= 60) return "bg-orange-500"
    return "bg-red-500"
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return "Excelente"
    if (score >= 80) return "Muito Bom"
    if (score >= 70) return "Bom"
    if (score >= 60) return "Regular"
    return "Precisa Melhorar"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* History Skeleton */}
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
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro ao carregar histórico:</strong> {error}
          </AlertDescription>
        </Alert>

        {debugInfo && (
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Informações de Debug
              </h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button onClick={() => fetchHistory(1, true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!historyData) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar histórico</h3>
          <p className="text-gray-600 mb-6">Não foi possível carregar seu histórico de simulados.</p>
          <Button onClick={() => fetchHistory(1, true)}>Tentar Novamente</Button>
        </CardContent>
      </Card>
    )
  }

  const { attempts, pagination, userStats } = historyData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Simulados</h2>
          <p className="text-gray-600">
            {pagination.total} simulado{pagination.total !== 1 ? "s" : ""} realizado
            {pagination.total !== 1 ? "s" : ""} • Máximo de 10 salvos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchHistory(currentPage, true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          {pagination.total > 10 && (
            <Button variant="outline" onClick={handleCleanupHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Antigos
            </Button>
          )}
        </div>
      </div>

      {/* User Statistics */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Realizados</p>
                  <p className="text-2xl font-bold">{userStats.completed_attempts}</p>
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
                  <p className="text-2xl font-bold">{userStats.average_score?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Melhor Nota</p>
                  <p className="text-2xl font-bold">{userStats.best_score?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Templates Únicos</p>
                  <p className="text-2xl font-bold">{userStats.unique_templates_completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History List */}
      {attempts.length > 0 ? (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <Card key={attempt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {attempt.mock_exam_templates?.title || `Simulado #${attempt.template_id.slice(0, 8)}`}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Badge variant="outline">{attempt.mock_exam_templates?.category || "Geral"}</Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(attempt.completed_at || attempt.created_at)}
                      </span>
                      {attempt.user_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {attempt.user_rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{attempt.percentage.toFixed(1)}%</div>
                    <Badge className={`${getPerformanceColor(attempt.percentage)} text-white`}>
                      {getPerformanceLabel(attempt.percentage)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Questões</p>
                    <p className="font-medium">{attempt.total_questions}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Acertos</p>
                    <p className="font-medium text-green-600">{attempt.correct_answers}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Erros</p>
                    <p className="font-medium text-red-600">{attempt.incorrect_answers}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tempo</p>
                    <p className="font-medium">{formatTime(attempt.time_spent_seconds)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pontuação</p>
                    <p className="font-medium">
                      {attempt.total_points.toFixed(1)}/{attempt.max_points.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <Progress value={attempt.percentage} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onViewDetails(attempt.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAttempt(attempt.id)}
                      disabled={deletingId === attempt.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingId === attempt.id ? "Excluindo..." : "Excluir"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum simulado no histórico</h3>
            <p className="text-gray-600 mb-6">Complete alguns simulados para ver seu histórico aqui.</p>
            <Link href="/dashboard/simulados">
              <Button>Fazer um Simulado</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.totalPages} • {pagination.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHistory(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHistory(currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
