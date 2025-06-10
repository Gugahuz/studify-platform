"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, Flag, Clock } from "lucide-react"
import { TestResults } from "@/components/test-results"
import { useUserData } from "@/hooks/use-user-data"

// Mock test data with questions
const mockTests = {
  1: {
    id: 1,
    title: "ENEM 2023 - Simulado Completo",
    subject: "Multidisciplinar",
    duration: 330, // 5.5 hours in minutes
    questions: [
      {
        id: 1,
        subject: "Português",
        question:
          "Leia o texto abaixo e responda:\n\n'A linguagem é um sistema de signos que permite a comunicação entre os seres humanos. Ela não é apenas um meio de transmitir informações, mas também uma forma de construir a realidade social.'\n\nSegundo o texto, a linguagem:",
        options: [
          "É apenas um meio de comunicação básica",
          "Serve exclusivamente para transmitir informações",
          "Constrói a realidade social além de comunicar",
          "É um sistema simples de signos",
          "Não influencia a sociedade",
        ],
        correctAnswer: 2,
        explanation:
          "O texto afirma que a linguagem 'não é apenas um meio de transmitir informações, mas também uma forma de construir a realidade social', indicando que ela tem função além da comunicação básica.",
      },
      {
        id: 2,
        subject: "Matemática",
        question: "Uma função f(x) = 2x + 3 tem como domínio o conjunto dos números reais. Qual é o valor de f(5)?",
        options: ["8", "10", "13", "15", "18"],
        correctAnswer: 2,
        explanation: "Substituindo x = 5 na função: f(5) = 2(5) + 3 = 10 + 3 = 13",
      },
      {
        id: 3,
        subject: "História",
        question: "A Proclamação da República no Brasil ocorreu em:",
        options: [
          "15 de novembro de 1889",
          "7 de setembro de 1822",
          "15 de novembro de 1888",
          "13 de maio de 1888",
          "15 de dezembro de 1889",
        ],
        correctAnswer: 0,
        explanation:
          "A Proclamação da República brasileira ocorreu em 15 de novembro de 1889, liderada pelo Marechal Deodoro da Fonseca.",
      },
      {
        id: 4,
        subject: "Geografia",
        question: "Qual é o maior bioma brasileiro em extensão territorial?",
        options: ["Mata Atlântica", "Cerrado", "Amazônia", "Caatinga", "Pampa"],
        correctAnswer: 2,
        explanation: "A Amazônia é o maior bioma brasileiro, ocupando cerca de 49,29% do território nacional.",
      },
      {
        id: 5,
        subject: "Física",
        question: "Um corpo em movimento retilíneo uniforme percorre 120 metros em 8 segundos. Sua velocidade é:",
        options: ["10 m/s", "12 m/s", "15 m/s", "18 m/s", "20 m/s"],
        correctAnswer: 2,
        explanation: "Velocidade = distância/tempo = 120m/8s = 15 m/s",
      },
    ],
  },
  2: {
    id: 2,
    title: "Português - Interpretação de Texto",
    subject: "Português",
    duration: 45,
    questions: [
      {
        id: 1,
        subject: "Português",
        question:
          "Analise o período: 'Embora chovesse muito, saímos para o passeio.' A oração subordinada adverbial expressa ideia de:",
        options: ["Causa", "Consequência", "Concessão", "Condição", "Finalidade"],
        correctAnswer: 2,
        explanation:
          "A conjunção 'embora' introduz uma oração subordinada adverbial concessiva, expressando uma ideia contrária à da oração principal.",
      },
      {
        id: 2,
        subject: "Português",
        question: "Qual das alternativas apresenta um exemplo de linguagem conotativa?",
        options: [
          "O céu está azul hoje",
          "Ela tem um coração de ouro",
          "A temperatura é de 25 graus",
          "O livro tem 300 páginas",
          "São 15 horas",
        ],
        correctAnswer: 1,
        explanation:
          "A expressão 'coração de ouro' é um exemplo de linguagem conotativa, pois usa o sentido figurado para expressar bondade.",
      },
    ],
  },
  3: {
    id: 3,
    title: "Matemática - Funções e Geometria",
    subject: "Matemática",
    duration: 60,
    questions: [
      {
        id: 1,
        subject: "Matemática",
        question: "Qual é o valor de x na equação 2x + 5 = 15?",
        options: ["3", "5", "7", "10", "15"],
        correctAnswer: 1,
        explanation: "2x + 5 = 15 → 2x = 10 → x = 5",
      },
    ],
  },
}

type TestState = "not-started" | "in-progress" | "completed"
type Answer = number | null

interface TestAnswer {
  questionId: number
  selectedAnswer: Answer
  timeSpent: number
}

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const testId = Number.parseInt(params.testId as string)
  const test = mockTests[testId as keyof typeof mockTests]
  const { userProfile } = useUserData()

  const [testState, setTestState] = useState<TestState>("not-started")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<TestAnswer[]>([])
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [testStartTime, setTestStartTime] = useState<Date | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null)
  const [userRating, setUserRating] = useState<number>(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!test) {
      router.push("/dashboard/simulados")
      return
    }

    // Initialize answers array
    const initialAnswers = test.questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: null,
      timeSpent: 0,
    }))
    setAnswers(initialAnswers)
    setTimeRemaining(test.duration * 60) // Convert minutes to seconds
  }, [test, router])

  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval)
      }
    }
  }, [timerInterval])

  const startTest = () => {
    setTestState("in-progress")
    setTestStartTime(new Date())
    setQuestionStartTime(new Date())

    // Start timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          finishTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimerInterval(interval)
  }

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    const now = new Date()
    const timeSpent = questionStartTime ? (now.getTime() - questionStartTime.getTime()) / 1000 : 0

    setAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === questionId
          ? { ...answer, selectedAnswer: answerIndex, timeSpent: answer.timeSpent + timeSpent }
          : answer,
      ),
    )
    setQuestionStartTime(now)
  }

  const navigateToQuestion = (index: number) => {
    if (questionStartTime) {
      const now = new Date()
      const timeSpent = (now.getTime() - questionStartTime.getTime()) / 1000
      const currentQuestion = test.questions[currentQuestionIndex]

      setAnswers((prev) =>
        prev.map((answer) =>
          answer.questionId === currentQuestion.id ? { ...answer, timeSpent: answer.timeSpent + timeSpent } : answer,
        ),
      )
    }

    setCurrentQuestionIndex(index)
    setQuestionStartTime(new Date())
  }

  const toggleFlag = (questionId: number) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const finishTest = () => {
    // Stop timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }

    if (questionStartTime) {
      const now = new Date()
      const timeSpent = (now.getTime() - questionStartTime.getTime()) / 1000
      const currentQuestion = test.questions[currentQuestionIndex]

      setAnswers((prev) =>
        prev.map((answer) =>
          answer.questionId === currentQuestion.id ? { ...answer, timeSpent: answer.timeSpent + timeSpent } : answer,
        ),
      )
    }

    setTestState("completed")
  }

  const restartTest = () => {
    setTestState("not-started")
    setCurrentQuestionIndex(0)
    setAnswers(
      test.questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: null,
        timeSpent: 0,
      })),
    )
    setFlaggedQuestions(new Set())
    setTimeRemaining(test.duration * 60)
    setTestStartTime(null)
    setQuestionStartTime(null)
    setUserRating(0)
  }

  if (!test) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Teste não encontrado</h2>
            <p className="text-gray-600 mb-4">O teste solicitado não foi encontrado.</p>
            <Button onClick={() => router.push("/dashboard/simulados")}>Voltar para Simulados</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (testState === "not-started") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/simulados")}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
            <CardTitle className="text-2xl">{test.title}</CardTitle>
            <Badge variant="outline">{test.subject}</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{test.questions.length}</div>
                <div className="text-sm text-gray-600">Questões</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{test.duration}</div>
                <div className="text-sm text-gray-600">Minutos</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Livre</div>
                <div className="text-sm text-gray-600">Navegação</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Instruções:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Você pode navegar livremente entre as questões</li>
                <li>• Use a flag para marcar questões que deseja revisar</li>
                <li>• O tempo começará a contar assim que você iniciar o teste</li>
                <li>• Suas respostas são salvas automaticamente</li>
                <li>• Você pode finalizar o teste a qualquer momento</li>
              </ul>
            </div>

            <Button onClick={startTest} className="w-full" size="lg">
              Iniciar Teste
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (testState === "completed") {
    return (
      <TestResults
        test={test}
        answers={answers}
        timeRemaining={timeRemaining}
        totalTime={test.duration * 60}
        onRestart={restartTest}
        onBackToTests={() => router.push("/dashboard/simulados")}
        userRating={userRating}
        onRatingChange={setUserRating}
      />
    )
  }

  const currentQuestion = test.questions[currentQuestionIndex]
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id)
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold">{test.title}</h1>
              <Badge variant="outline">{test.subject}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <Button onClick={finishTest} variant="outline">
                Finalizar Teste
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Questão {currentQuestionIndex + 1} de {test.questions.length}
              </span>
              <span>{Math.round(progress)}% concluído</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Navegação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {test.questions.map((_, index) => {
                    const answer = answers.find((a) => a.questionId === test.questions[index].id)
                    const isAnswered = answer?.selectedAnswer !== null
                    const isFlagged = flaggedQuestions.has(test.questions[index].id)
                    const isCurrent = index === currentQuestionIndex

                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        className={`relative h-10 ${
                          isAnswered ? "bg-green-100 border-green-300" : ""
                        } ${isCurrent ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() => navigateToQuestion(index)}
                      >
                        {index + 1}
                        {isFlagged && (
                          <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500 fill-current" />
                        )}
                      </Button>
                    )
                  })}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span>Respondida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    <span>Não respondida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-orange-500 fill-current" />
                    <span>Marcada</span>
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
                  <Badge variant="secondary">{currentQuestion.subject}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFlag(currentQuestion.id)}
                    className={flaggedQuestions.has(currentQuestion.id) ? "text-orange-500" : ""}
                  >
                    <Flag className={`h-4 w-4 ${flaggedQuestions.has(currentQuestion.id) ? "fill-current" : ""}`} />
                    {flaggedQuestions.has(currentQuestion.id) ? "Desmarcada" : "Marcar"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-lg leading-relaxed whitespace-pre-line">{currentQuestion.question}</p>
                </div>

                <RadioGroup
                  value={currentAnswer?.selectedAnswer?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, Number.parseInt(value))}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)})</span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>

                  {currentQuestionIndex === test.questions.length - 1 ? (
                    <Button onClick={finishTest} className="bg-green-600 hover:bg-green-700">
                      Finalizar Teste
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigateToQuestion(Math.min(test.questions.length - 1, currentQuestionIndex + 1))}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
