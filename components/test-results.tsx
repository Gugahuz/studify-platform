"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, Star, RotateCcw, Home, Trophy, Target, BookOpen } from "lucide-react"

interface TestResultsProps {
  test: any
  answers: Array<{
    questionId: number
    selectedAnswer: number | null
    timeSpent: number
  }>
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
  const [showDetailedResults, setShowDetailedResults] = useState(false)

  // Calculate results
  const correctAnswers = answers.filter(
    (answer, index) => answer.selectedAnswer === test.questions[index].correctAnswer,
  ).length

  const incorrectAnswers = answers.filter(
    (answer, index) => answer.selectedAnswer !== null && answer.selectedAnswer !== test.questions[index].correctAnswer,
  ).length

  const unansweredQuestions = answers.filter((answer) => answer.selectedAnswer === null).length
  const totalQuestions = test.questions.length
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100)
  const timeSpent = totalTime - timeRemaining
  const averageTimePerQuestion = timeSpent / totalQuestions

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: "Excelente", color: "text-green-600", bgColor: "bg-green-100" }
    if (percentage >= 70) return { level: "Bom", color: "text-blue-600", bgColor: "bg-blue-100" }
    if (percentage >= 50) return { level: "Regular", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    return { level: "Precisa Melhorar", color: "text-red-600", bgColor: "bg-red-100" }
  }

  const performance = getPerformanceLevel(scorePercentage)

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const handleRating = (rating: number) => {
    onRatingChange(rating)
    // Here you would typically send the rating to your backend
    console.log(`User rated test ${test.id} with ${rating} stars`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${performance.bgColor}`}>
            <Trophy className={`h-8 w-8 ${performance.color}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Teste Concluído!</h1>
            <p className="text-gray-600">{test.title}</p>
          </div>
        </div>
        <Badge className={`${performance.bgColor} ${performance.color} text-lg px-4 py-2`}>{performance.level}</Badge>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{scorePercentage}%</div>
            <div className="text-sm text-gray-600">Pontuação Final</div>
            <Progress value={scorePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <span className="text-3xl font-bold text-green-600">{correctAnswers}</span>
            </div>
            <div className="text-sm text-gray-600">Acertos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="h-6 w-6 text-red-600" />
              <span className="text-3xl font-bold text-red-600">{incorrectAnswers}</span>
            </div>
            <div className="text-sm text-gray-600">Erros</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-6 w-6 text-blue-600" />
              <span className="text-3xl font-bold text-blue-600">{formatTime(timeSpent)}</span>
            </div>
            <div className="text-sm text-gray-600">Tempo Gasto</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Estatísticas Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total de questões:</span>
              <span className="font-semibold">{totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span>Questões respondidas:</span>
              <span className="font-semibold">{totalQuestions - unansweredQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span>Questões não respondidas:</span>
              <span className="font-semibold text-gray-500">{unansweredQuestions}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span>Tempo total disponível:</span>
              <span className="font-semibold">{formatTime(totalTime)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tempo utilizado:</span>
              <span className="font-semibold">{formatTime(timeSpent)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tempo restante:</span>
              <span className="font-semibold text-green-600">{formatTime(timeRemaining)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tempo médio por questão:</span>
              <span className="font-semibold">{formatTime(averageTimePerQuestion)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Desempenho por Matéria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Calculate performance by subject */}
            {(() => {
              const subjectStats = test.questions.reduce((acc: any, question: any, index: number) => {
                const subject = question.subject
                if (!acc[subject]) {
                  acc[subject] = { correct: 0, total: 0 }
                }
                acc[subject].total++
                if (answers[index].selectedAnswer === question.correctAnswer) {
                  acc[subject].correct++
                }
                return acc
              }, {})

              return (
                <div className="space-y-3">
                  {Object.entries(subjectStats).map(([subject, stats]: [string, any]) => (
                    <div key={subject}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{subject}</span>
                        <span className="text-sm text-gray-600">
                          {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                        </span>
                      </div>
                      <Progress value={(stats.correct / stats.total) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Rating Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Avalie este simulado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span>Como você avalia este simulado?</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => handleRating(star)} className="transition-colors">
                  <Star
                    className={`h-6 w-6 ${star <= userRating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>
            {userRating > 0 && <span className="text-sm text-gray-600">Obrigado pela sua avaliação!</span>}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results Toggle */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revisão das Questões</CardTitle>
            <Button variant="outline" onClick={() => setShowDetailedResults(!showDetailedResults)}>
              {showDetailedResults ? "Ocultar" : "Mostrar"} Detalhes
            </Button>
          </div>
        </CardHeader>
        {showDetailedResults && (
          <CardContent className="space-y-6">
            {test.questions.map((question: any, index: number) => {
              const userAnswer = answers[index]
              const isCorrect = userAnswer.selectedAnswer === question.correctAnswer
              const wasAnswered = userAnswer.selectedAnswer !== null

              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0">
                      {wasAnswered ? (
                        isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600" />
                        )
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Questão {index + 1}</span>
                        <Badge variant="outline">{question.subject}</Badge>
                        <span className="text-sm text-gray-500">Tempo: {formatTime(userAnswer.timeSpent)}</span>
                      </div>
                      <p className="text-sm mb-3 whitespace-pre-line">{question.question}</p>

                      <div className="space-y-2">
                        {question.options.map((option: string, optionIndex: number) => {
                          const isUserAnswer = userAnswer.selectedAnswer === optionIndex
                          const isCorrectAnswer = question.correctAnswer === optionIndex

                          let className = "p-2 rounded text-sm "
                          if (isCorrectAnswer) {
                            className += "bg-green-100 border border-green-300 text-green-800"
                          } else if (isUserAnswer && !isCorrect) {
                            className += "bg-red-100 border border-red-300 text-red-800"
                          } else {
                            className += "bg-gray-50"
                          }

                          return (
                            <div key={optionIndex} className={className}>
                              <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)})</span>
                              {option}
                              {isCorrectAnswer && <span className="ml-2 text-green-600 font-medium">✓ Correta</span>}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="ml-2 text-red-600 font-medium">✗ Sua resposta</span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm">
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onRestart} variant="outline" size="lg">
          <RotateCcw className="h-5 w-5 mr-2" />
          Refazer Teste
        </Button>
        <Button onClick={onBackToTests} size="lg">
          <Home className="h-5 w-5 mr-2" />
          Voltar aos Simulados
        </Button>
      </div>
    </div>
  )
}
