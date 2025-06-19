"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, FileText, Navigation, Flag, Play } from "lucide-react"
import type { MockExamTemplate, MockExamSession } from "@/types/mock-exams"

interface MockExamSetupProps {
  template: MockExamTemplate
  onStartExam: (session: MockExamSession) => void
  onBack: () => void
}

export function MockExamSetup({ template, onStartExam, onBack }: MockExamSetupProps) {
  const [loading, setLoading] = useState(false)

  const handleStartExam = async () => {
    setLoading(true)
    try {
      console.log("Starting exam for template:", template.id)

      const response = await fetch("/api/mock-exams/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          template_id: template.id,
        }),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", response.headers.get("content-type"))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("Non-JSON response:", responseText)
        throw new Error("Server returned non-JSON response")
      }

      const result = await response.json()
      console.log("API result:", result)

      if (result.success) {
        // Create session object
        const session: MockExamSession = {
          attempt: result.data.attempt,
          questions: result.data.questions,
          responses: [],
          currentQuestionIndex: 0,
          timeRemaining: template.time_limit_minutes * 60,
          isComplete: false,
          isPaused: false,
        }

        console.log("Starting session:", session)
        onStartExam(session)
      } else {
        throw new Error(result.error || "Failed to start exam")
      }
    } catch (error: any) {
      console.error("Error starting exam:", error)
      alert(`Erro ao iniciar o simulado: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyLabel = (level: number) => {
    if (level <= 2) return "Básico"
    if (level <= 3) return "Intermediário"
    return "Avançado"
  }

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return "bg-green-100 text-green-800"
    if (level <= 3) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        {/* Main Setup Card */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{template.title}</h1>
              <Badge className={getDifficultyColor(template.difficulty_level)}>
                {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
              </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-900 mb-1">{template.total_questions}</div>
                  <div className="text-sm text-blue-700">Questões</div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-900 mb-1">{template.time_limit_minutes}</div>
                  <div className="text-sm text-green-700">Minutos</div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Navigation className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-purple-900 mb-1">Livre</div>
                  <div className="text-sm text-purple-700">Navegação</div>
                </CardContent>
              </Card>
            </div>

            {/* Instructions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instruções:</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Você pode navegar livremente entre as questões</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use a flag para marcar questões que deseja revisar</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>O tempo começará a contar assim que você iniciar o teste</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Suas respostas são salvas automaticamente</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Você pode finalizar o teste a qualquer momento</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {template.description && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{template.description}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Detalhes do Simulado</h4>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Nível de Dificuldade:</span>
                    <span className="font-medium">{getDifficultyLabel(template.difficulty_level)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nota de Aprovação:</span>
                    <span className="font-medium">{template.passing_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipo de Navegação:</span>
                    <span className="font-medium">Livre</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Recursos Disponíveis</h4>
                <div className="space-y-2 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-orange-500" />
                    <span>Marcar questões para revisão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-500" />
                    <span>Navegação entre questões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span>Timer com tempo restante</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <Button
                onClick={handleStartExam}
                disabled={loading}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 text-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Iniciando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Iniciar Teste
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
