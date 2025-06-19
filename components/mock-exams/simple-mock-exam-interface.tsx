"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Clock, Flag, ChevronLeft, ChevronRight } from "lucide-react"
import {
  type MockExamTemplate,
  type MockExamAttempt,
  MockExamStorage,
  generateId,
  calculateResults,
} from "@/lib/mock-exam-data"

interface SimpleMockExamInterfaceProps {
  template: MockExamTemplate
  onComplete: (attempt: MockExamAttempt) => void
  onExit: () => void
}

export function SimpleMockExamInterface({ template, onComplete, onExit }: SimpleMockExamInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(template.timeLimit * 60)
  const [startTime] = useState(Date.now())
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [showFinishModal, setShowFinishModal] = useState(false)

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinishExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const currentQuestion = template.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / template.totalQuestions) * 100
  const answeredCount = Object.keys(responses).length
  const isLastQuestion = currentQuestionIndex === template.totalQuestions - 1

  const handleAnswerSelect = (answer: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < template.totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleFinishExam = () => {
    const endTime = Date.now()
    const timeSpent = Math.floor((endTime - startTime) / 1000)
    const results = calculateResults(template, responses)

    const attempt: MockExamAttempt = {
      id: generateId(),
      templateId: template.id,
      templateTitle: template.title,
      startTime,
      endTime,
      timeSpent,
      responses,
      score: results.totalPoints,
      percentage: results.percentage,
      totalQuestions: template.totalQuestions,
      correctAnswers: results.correctAnswers,
      status: "completed",
    }

    MockExamStorage.saveAttempt(attempt)
    setShowFinishModal(false)
    onComplete(attempt)
  }

  const toggleFlag = () => {
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

  const getQuestionStatus = (index: number) => {
    const questionId = template.questions[index]?.id
    const hasAnswer = responses[questionId]
    const isFlagged = flaggedQuestions.has(index)

    if (hasAnswer && isFlagged) return "answered-flagged"
    if (hasAnswer) return "answered"
    if (isFlagged) return "flagged"
    return "unanswered"
  }

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(3, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">{template.title}</h1>
            <Badge variant="secondary" className="text-sm">
              Multidisciplinar
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-mono text-lg">{formatTimer(timeLeft)}</span>
            </div>
            <Button onClick={() => setShowFinishModal(true)} className="bg-blue-600 hover:bg-blue-700">
              Finalizar Teste
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              Questão {currentQuestionIndex + 1} de {template.totalQuestions}
            </span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-white border-r p-6">
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Navegação</h3>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {template.questions.map((_, index) => {
                const status = getQuestionStatus(index)
                const isActive = index === currentQuestionIndex
                const isFlagged = flaggedQuestions.has(index)

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`
                      relative w-10 h-10 rounded-lg font-medium text-sm transition-all
                      ${
                        isActive
                          ? "bg-green-600 text-white"
                          : status === "answered"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : status === "flagged"
                              ? "bg-orange-100 text-orange-800 border border-orange-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                      }
                    `}
                  >
                    {index + 1}
                    {/* Subtle flag indicator */}
                    {isFlagged && (
                      <div className="absolute -top-1 -right-1 w-3 h-3">
                        <Flag className="w-3 h-3 text-orange-500 fill-orange-500" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-gray-600">Respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span className="text-gray-600">Não respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-4 h-4 bg-orange-100 border border-orange-200 rounded">
                  <Flag className="absolute -top-0.5 -right-0.5 w-2 h-2 text-orange-500 fill-orange-500" />
                </div>
                <span className="text-gray-600">Marcada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl">
            {/* Subject Badge and Flag Button */}
            <div className="mb-6 flex items-center gap-4">
              <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">{currentQuestion.subject}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFlag}
                className={`flex items-center gap-2 ${
                  flaggedQuestions.has(currentQuestionIndex) ? "bg-orange-50 border-orange-200" : ""
                }`}
              >
                <Flag
                  className={`h-4 w-4 ${
                    flaggedQuestions.has(currentQuestionIndex) ? "text-orange-500 fill-orange-500" : ""
                  }`}
                />
                Marcar
              </Button>
            </div>

            {/* Question */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <p className="text-gray-600 mb-4">Leia o texto abaixo e responda:</p>
              <div className="prose max-w-none mb-6">
                <p className="text-gray-900 leading-relaxed">{currentQuestion.text}</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <RadioGroup value={responses[currentQuestion.id] || ""} onValueChange={handleAnswerSelect}>
                  {currentQuestion.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index)
                    return (
                      <div key={index} className="flex items-center space-x-3">
                        <RadioGroupItem value={optionLetter} id={`option-${index}`} className="mt-1" />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer py-2">
                          <span className="font-medium mr-2">{optionLetter})</span>
                          {option}
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={() => setShowFinishModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Finalizar Teste
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Finish Confirmation Modal */}
      <Dialog open={showFinishModal} onOpenChange={setShowFinishModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Teste</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">Tem certeza que deseja finalizar o teste?</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Questões respondidas:</span>
                <span className="font-medium">
                  {answeredCount} de {template.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Questões não respondidas:</span>
                <span className="font-medium text-red-600">{template.totalQuestions - answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo restante:</span>
                <span className="font-medium">{formatTimer(timeLeft)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Após finalizar, você não poderá mais alterar suas respostas.</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFinishModal(false)}>
              Continuar Teste
            </Button>
            <Button onClick={handleFinishExam} className="bg-blue-600 hover:bg-blue-700">
              Finalizar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
