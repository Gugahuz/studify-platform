"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Clock, ChevronLeft, ChevronRight, Flag, Send, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FinishExamModal } from "./finish-exam-modal"
import type { MockExamSession, MockExamAttempt, MockExamResponse } from "@/types/mock-exams"

interface MockExamInterfaceProps {
  session: MockExamSession
  onComplete: (attempt: MockExamAttempt, responses: MockExamResponse[]) => void
  onExit: () => void
}

export function MockExamInterface({ session, onComplete, onExit }: MockExamInterfaceProps) {
  const { toast } = useToast()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(session.currentQuestionIndex || 0)
  const [responses, setResponses] = useState<Record<string, string>>(() => {
    // Initialize responses from session
    const initialResponses: Record<string, string> = {}
    session.responses?.forEach((response) => {
      if (response.user_answer) {
        initialResponses[response.question_id] = response.user_answer
      }
    })
    return initialResponses
  })
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(() => {
    // Get time limit from template or attempt, with fallback
    const timeLimit =
      session.attempt?.mock_exam_templates?.time_limit_minutes || session.attempt?.time_limit_seconds || 3600 // 1 hour default
    return typeof timeLimit === "number" ? timeLimit : timeLimit * 60
  })
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQuestionList, setShowQuestionList] = useState(false)
  const [startTime] = useState(Date.now())

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleFinishExam()
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleFinishExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Ensure we have valid data
  const validSession = !!session?.attempt && !!session?.questions && session.questions.length > 0
  const currentQuestion = session.questions[currentQuestionIndex]
  const totalQuestions = session.questions.length

  // Calculate progress
  const answeredCount = Object.keys(responses).filter((key) => responses[key]?.trim()).length
  const progress = (answeredCount / totalQuestions) * 100

  // Auto-save responses
  const saveResponse = useCallback(
    async (questionId: string, answer: string) => {
      try {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)

        const response = await fetch("/api/mock-exams/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attempt_id: session.attempt.id,
            question_id: questionId,
            user_answer: answer,
            time_spent_seconds: timeSpent,
            is_flagged: flaggedQuestions.has(currentQuestionIndex),
          }),
        })

        if (!response.ok) {
          console.error("Failed to save response:", response.statusText)
          return
        }

        const result = await response.json()
        if (!result.success) {
          console.error("Failed to save response:", result.error)
        }
      } catch (error) {
        console.error("Error saving response:", error)
      }
    },
    [session.attempt.id, currentQuestionIndex, flaggedQuestions, startTime],
  )

  const handleAnswerChange = (answer: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }))

    // Auto-save after a short delay
    setTimeout(() => {
      saveResponse(currentQuestion.id, answer)
    }, 500)
  }

  const handleFlagQuestion = () => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex)
      } else {
        newSet.add(currentQuestionIndex)
      }
      return newSet
    })
  }

  const handleFinishExam = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setShowFinishModal(false)

    try {
      console.log("🏁 Starting exam completion process...")

      const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000)

      // Complete the exam using the new API
      const completeResponse = await fetch("/api/mock-exams/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: session.attempt.id,
          time_spent_seconds: totalTimeSpent,
        }),
      })

      if (!completeResponse.ok) {
        throw new Error(`HTTP ${completeResponse.status}: ${completeResponse.statusText}`)
      }

      const completeResult = await completeResponse.json()

      if (!completeResult.success) {
        throw new Error(completeResult.error || "Failed to complete exam")
      }

      console.log("✅ Exam completed successfully")

      // Calculate results
      const calculateResponse = await fetch("/api/mock-exams/calculate-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: session.attempt.id,
        }),
      })

      let finalResults
      if (!calculateResponse.ok) {
        console.warn("⚠️ Results calculation failed, using basic completion data")
        // Use the completion data as fallback
        finalResults = {
          attempt: completeResult.data.attempt,
          responses: [],
        }
      } else {
        const calculateResult = await calculateResponse.json()
        if (calculateResult.success) {
          console.log("✅ Results calculated successfully")
          finalResults = calculateResult.data
        } else {
          console.warn("⚠️ Results calculation failed, using basic completion data")
          finalResults = {
            attempt: completeResult.data.attempt,
            responses: [],
          }
        }
      }

      // Set flag in localStorage to trigger history refresh
      localStorage.setItem("test-completed", Date.now().toString())

      toast({
        title: "Exame concluído!",
        description: "Seus resultados foram salvos com sucesso.",
      })

      // Call onComplete with the results
      onComplete(finalResults.attempt, finalResults.responses || [])
    } catch (error: any) {
      console.error("❌ Error finishing exam:", error)
      toast({
        title: "Erro ao finalizar exame",
        description: error.message || "Não foi possível finalizar o exame. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const getQuestionStatus = (index: number) => {
    const questionId = session.questions[index]?.id
    const hasAnswer = responses[questionId]?.trim()
    const isFlagged = flaggedQuestions.has(index)

    if (hasAnswer && isFlagged) return "answered-flagged"
    if (hasAnswer) return "answered"
    if (isFlagged) return "flagged"
    return "unanswered"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-green-500 text-white"
      case "flagged":
        return "bg-yellow-500 text-white"
      case "answered-flagged":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-200 text-gray-700"
    }
  }

  if (!validSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar simulado</h2>
            <p className="text-gray-600 mb-4">Não foi possível carregar os dados do simulado.</p>
            <Button onClick={onExit}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Carregando questão...</h2>
          <p className="text-gray-600">Por favor, aguarde.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{session.attempt?.mock_exam_templates?.title || "Simulado"}</h1>
            <Badge variant="outline">
              Questão {currentQuestionIndex + 1} de {totalQuestions}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className={`font-mono ${timeRemaining < 300 ? "text-red-600" : "text-gray-700"}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowQuestionList(!showQuestionList)}>
              {showQuestionList ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showQuestionList ? "Ocultar" : "Questões"}
            </Button>

            <Button variant="outline" size="sm" onClick={onExit} disabled={isSubmitting}>
              Sair
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-6xl mx-auto mt-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>
              Progresso: {answeredCount}/{totalQuestions} respondidas
            </span>
            <span>({progress.toFixed(0)}%)</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question List Sidebar */}
          {showQuestionList && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Navegação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {session.questions.map((_, index) => {
                      const status = getQuestionStatus(index)
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestionIndex(index)}
                          disabled={isSubmitting}
                          className={`
                            w-8 h-8 rounded text-xs font-medium transition-colors
                            ${getStatusColor(status)}
                            ${index === currentQuestionIndex ? "ring-2 ring-blue-500" : ""}
                            ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Respondida</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Marcada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Respondida + Marcada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-200 rounded"></div>
                      <span>Não respondida</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Question Area */}
          <div className={showQuestionList ? "lg:col-span-3" : "lg:col-span-4"}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>Questão {currentQuestionIndex + 1}</CardTitle>
                    {currentQuestion.subject_area && <Badge variant="outline">{currentQuestion.subject_area}</Badge>}
                    {currentQuestion.difficulty && <Badge variant="secondary">{currentQuestion.difficulty}</Badge>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFlagQuestion}
                    disabled={isSubmitting}
                    className={flaggedQuestions.has(currentQuestionIndex) ? "bg-yellow-100" : ""}
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    {flaggedQuestions.has(currentQuestionIndex) ? "Desmarcada" : "Marcar"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Question Text */}
                <div className="prose max-w-none">
                  <p className="text-gray-900 leading-relaxed">{currentQuestion.question_text}</p>
                </div>

                <Separator />

                {/* Answer Options */}
                <div>
                  <h4 className="font-medium mb-4">Selecione uma alternativa:</h4>
                  <RadioGroup
                    value={responses[currentQuestion.id] || ""}
                    onValueChange={handleAnswerChange}
                    disabled={isSubmitting}
                    className="space-y-3"
                  >
                    {currentQuestion.options?.map((option, index) => {
                      const optionLetter = String.fromCharCode(65 + index)
                      return (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            <span className="font-medium mr-2">{optionLetter})</span>
                            {option}
                          </Label>
                        </div>
                      )
                    })}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0 || isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex === totalQuestions - 1 ? (
                  <Button
                    onClick={() => setShowFinishModal(true)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Finalizar Exame
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                    disabled={isSubmitting}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finish Exam Modal */}
      <FinishExamModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={handleFinishExam}
        isSubmitting={isSubmitting}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining}
        examTitle={session.attempt?.mock_exam_templates?.title || "Simulado"}
      />

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Finalizando Simulado</h3>
              <p className="text-gray-600">Calculando seus resultados...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
