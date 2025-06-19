"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { type MockExamAttempt, MOCK_EXAM_TEMPLATES } from "@/lib/mock-exam-data"

interface QuestionReviewProps {
  attempt: MockExamAttempt
  onBack: () => void
}

export function QuestionReview({ attempt, onBack }: QuestionReviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Get the template and questions
  const template = MOCK_EXAM_TEMPLATES.find((t) => t.id === attempt.templateId)
  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Simulado não encontrado</h3>
            <Button onClick={onBack}>Voltar ao Histórico</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const questions = template.questions
  const currentQuestion = questions[currentQuestionIndex]
  const userAnswer = attempt.responses[currentQuestion.id]
  const userAnswerValue = userAnswer ? currentQuestion.options[userAnswer.charCodeAt(0) - 65] : undefined
  const isCorrect = userAnswerValue === currentQuestion.correctAnswer
  const wasAnswered = userAnswer !== undefined

  const getQuestionStatus = (questionId: string) => {
    const answerLetter = attempt.responses[questionId]
    const question = questions.find((q) => q.id === questionId)
    if (!question) return "unanswered"

    if (answerLetter === undefined) return "unanswered"

    // Convert letter to option value
    const optionIndex = answerLetter.charCodeAt(0) - 65
    const answerValue = question.options[optionIndex]

    return answerValue === question.correctAnswer ? "correct" : "incorrect"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "correct":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "incorrect":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "correct":
        return "bg-green-100 text-green-800 border-green-200"
      case "incorrect":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Histórico
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revisão de Questões</h1>
            <p className="text-gray-600">
              {template.title} - {attempt.percentage}% de aproveitamento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navegação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question.id)
                    return (
                      <button
                        key={question.id}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                          index === currentQuestionIndex
                            ? "border-blue-500 bg-blue-50"
                            : `border-gray-200 hover:border-gray-300 ${getStatusColor(status)}`
                        }`}
                      >
                        <span className="font-medium">{index + 1}</span>
                        {getStatusIcon(status)}
                      </button>
                    )
                  })}
                </div>

                {/* Summary */}
                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Corretas
                    </span>
                    <span className="font-medium">{attempt.correctAnswers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Incorretas
                    </span>
                    <span className="font-medium">{attempt.totalQuestions - attempt.correctAnswers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    Questão {currentQuestionIndex + 1} de {questions.length}
                  </CardTitle>
                  <Badge className={getStatusColor(getQuestionStatus(currentQuestion.id))}>
                    {wasAnswered ? (isCorrect ? "Correta" : "Incorreta") : "Não Respondida"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question */}
                <div>
                  <h3 className="text-lg font-medium mb-3">{currentQuestion.text}</h3>{" "}
                  {/* Changed from currentQuestion.question to currentQuestion.text */}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index) // A, B, C, D
                    const isUserAnswer = userAnswer === optionLetter
                    const isCorrectAnswer = currentQuestion.correctAnswer === option // Compare with option value, not letter

                    let optionClass = "p-4 rounded-lg border-2 transition-all"

                    if (isCorrectAnswer) {
                      optionClass += " border-green-500 bg-green-50"
                    } else if (isUserAnswer && !isCorrectAnswer) {
                      optionClass += " border-red-500 bg-red-50"
                    } else {
                      optionClass += " border-gray-200 bg-gray-50"
                    }

                    return (
                      <div key={index} className={optionClass}>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                              isCorrectAnswer
                                ? "bg-green-600 text-white"
                                : isUserAnswer
                                  ? "bg-red-600 text-white"
                                  : "bg-gray-300 text-gray-700"
                            }`}
                          >
                            {optionLetter}
                          </div>
                          <span className="flex-1">{option}</span>
                          {isCorrectAnswer && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {isUserAnswer && !isCorrectAnswer && <XCircle className="h-5 w-5 text-red-600" />}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* User Answer Status */}
                {wasAnswered && (
                  <div
                    className={`p-4 rounded-lg ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${isCorrect ? "text-green-800" : "text-red-800"}`}>
                        {isCorrect ? "Resposta Correta!" : "Resposta Incorreta"}
                      </span>
                    </div>
                    <p className={`text-sm ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                      Sua resposta:{" "}
                      <strong>
                        {userAnswer} - {currentQuestion.options[userAnswer.charCodeAt(0) - 65]}
                      </strong>
                      {!isCorrect && (
                        <>
                          <br />
                          Resposta correta: <strong>{currentQuestion.correctAnswer}</strong>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Explicação:</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button variant="outline" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>

                  <span className="text-sm text-gray-600">
                    {currentQuestionIndex + 1} de {questions.length}
                  </span>

                  <Button
                    variant="outline"
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
