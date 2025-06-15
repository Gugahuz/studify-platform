"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  Target,
  ArrowLeft,
  Lightbulb,
  AlertCircle,
  Brain,
  Sparkles,
  Zap,
} from "lucide-react"
import type { Flashcard } from "@/types/flashcards"
import FlippableFlashcardItem, { type FlippableFlashcardRef } from "./flippable-flashcard-item"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface StudySession {
  currentIndex: number
  totalCards: number
  correctAnswers: number
  isComplete: boolean
}

interface FlashcardViewerProps {
  flashcards?: Flashcard[]
  onComplete?: (session: StudySession) => void
  onClose?: () => void
  initialDeckName?: string
  isLoading?: boolean
  loadingProgress?: number
  generationParams?: any
}

export function FlashcardViewer({
  flashcards = [],
  onComplete,
  onClose,
  initialDeckName = "Deck de Estudo",
  isLoading = false,
  loadingProgress = 0,
  generationParams,
}: FlashcardViewerProps) {
  const [session, setSession] = useState<StudySession>({
    currentIndex: 0,
    totalCards: flashcards.length,
    correctAnswers: 0,
    isComplete: false,
  })
  const [startTime] = useState(Date.now())
  const [studyTime, setStudyTime] = useState(0)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const [error, setError] = useState("")
  const cardRef = useRef<FlippableFlashcardRef>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      if (!session.isComplete && !isLoading) {
        setStudyTime(Math.floor((Date.now() - startTime) / 1000))
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [startTime, session.isComplete, isLoading])

  useEffect(() => {
    setAnswerRevealed(false)
    cardRef.current?.setFlipState(false)
  }, [session.currentIndex])

  useEffect(() => {
    if (flashcards.length > 0) {
      setSession((prev) => ({
        ...prev,
        totalCards: flashcards.length,
      }))
    }
  }, [flashcards])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (session.isComplete || isLoading) return

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          handlePrevious()
          break
        case "ArrowRight":
          e.preventDefault()
          handleNext()
          break
        case " ":
          e.preventDefault()
          if (!answerRevealed) {
            handleRevealAnswer()
          } else {
            cardRef.current?.flipCard()
          }
          break
        case "Enter":
          e.preventDefault()
          cardRef.current?.flipCard()
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [answerRevealed, session.isComplete, session.currentIndex, isLoading])

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 bg-studify-white min-h-screen">
        <div className="max-w-3xl mx-auto space-y-6">
          {onClose && (
            <div className="flex justify-start">
              <Button onClick={onClose} variant="outline" size="sm" className="border-studify-gray text-studify-gray">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Menu
              </Button>
            </div>
          )}

          <Card className="shadow-lg border rounded-lg bg-white">
            <CardContent className="p-6 space-y-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-studify-green/10 rounded-full flex items-center justify-center">
                      <Brain className="h-8 w-8 text-studify-green animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="h-6 w-6 text-yellow-500 animate-bounce" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-studify-green">Gerando Flashcards</h2>
                <p className="text-studify-gray">Nossa IA está criando flashcards personalizados para você...</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-studify-gray">
                  <span>Progresso da Geração</span>
                  <span>{Math.round(loadingProgress)}%</span>
                </div>
                <Progress value={loadingProgress} className="h-3 bg-green-100 [&>div]:bg-studify-green" />
              </div>

              {generationParams && (
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold text-studify-green">Configurações:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-studify-gray">
                    {generationParams.numberOfFlashcards && (
                      <div>
                        <span className="font-medium">Quantidade:</span> {generationParams.numberOfFlashcards} cards
                      </div>
                    )}
                    {generationParams.difficulty && (
                      <div>
                        <span className="font-medium">Dificuldade:</span>{" "}
                        {generationParams.difficulty === "easy"
                          ? "Fácil"
                          : generationParams.difficulty === "medium"
                            ? "Médio"
                            : "Difícil"}
                      </div>
                    )}
                    {generationParams.subjectName && (
                      <div className="col-span-2">
                        <span className="font-medium">Matéria:</span> {generationParams.subjectName}
                      </div>
                    )}
                    {generationParams.topicCount && (
                      <div>
                        <span className="font-medium">Tópicos:</span> {generationParams.topicCount}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-studify-gray">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Powered by GPT-4-turbo</span>
                </div>
                <p>⏱️ Tempo estimado: 30-60 segundos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 bg-studify-white min-h-screen">
        <div className="max-w-2xl mx-auto space-y-6">
          {onClose && (
            <div className="flex justify-start">
              <Button onClick={onClose} variant="outline" size="sm" className="border-studify-gray text-studify-gray">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Menu
              </Button>
            </div>
          )}

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>

          <div className="text-center">
            <Button onClick={onClose} className="bg-studify-green hover:bg-studify-lightgreen text-white">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="container mx-auto p-6 bg-studify-white min-h-screen">
        <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
          {onClose && (
            <div className="flex justify-start mb-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-studify-gray text-studify-gray hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Menu
              </Button>
            </div>
          )}
          <Target className="h-16 w-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-studify-gray">Nenhum flashcard para exibir</h3>
          <p className="text-studify-gray">
            Parece que este deck está vazio ou houve um problema ao carregar os flashcards.
          </p>
        </div>
      </div>
    )
  }

  const currentCard = flashcards[session.currentIndex]
  const progress = ((session.currentIndex + 1) / session.totalCards) * 100

  const handleRevealAnswer = () => {
    setAnswerRevealed(true)
    cardRef.current?.flipCard()
  }

  const handleAnswer = (correct: boolean) => {
    const newCorrectAnswers = correct ? session.correctAnswers + 1 : session.correctAnswers
    const isLastCard = session.currentIndex === session.totalCards - 1

    if (isLastCard) {
      const finalSession = {
        ...session,
        correctAnswers: newCorrectAnswers,
        isComplete: true,
      }
      setSession(finalSession)
      onComplete?.(finalSession)
    } else {
      setSession((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        correctAnswers: newCorrectAnswers,
      }))
    }
  }

  const handlePrevious = () => {
    if (session.currentIndex > 0) {
      setSession((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
      }))
    }
  }

  const handleNext = () => {
    if (session.currentIndex < session.totalCards - 1) {
      setSession((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
      }))
    }
  }

  const handleRestart = () => {
    setSession({
      currentIndex: 0,
      totalCards: flashcards.length,
      correctAnswers: 0,
      isComplete: false,
    })
    setAnswerRevealed(false)
    cardRef.current?.setFlipState(false)
    setStudyTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (session.isComplete) {
    const accuracy = session.totalCards > 0 ? Math.round((session.correctAnswers / session.totalCards) * 100) : 0
    const performanceMessage = accuracy >= 80 ? "Excelente!" : accuracy >= 60 ? "Bom trabalho!" : "Continue praticando!"

    return (
      <div className="container mx-auto p-4 md:p-6 bg-studify-white min-h-screen">
        <div className="max-w-2xl mx-auto text-center space-y-6 bg-white p-6 sm:p-8 rounded-xl shadow-xl border">
          {onClose && (
            <div className="flex justify-start mb-4">
              <Button onClick={onClose} variant="outline" size="sm" className="border-studify-gray text-studify-gray">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Menu
              </Button>
            </div>
          )}
          <Trophy className="h-20 w-20 text-yellow-500 mx-auto" />
          <h2 className="text-3xl font-bold text-studify-green">Sessão Concluída!</h2>
          <p className="text-xl text-studify-green font-medium">{performanceMessage}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-studify-green">
              <CardContent className="pt-5 text-center">
                <div className="text-3xl font-bold text-studify-green">{session.correctAnswers}</div>
                <p className="text-sm text-studify-gray mt-1">Corretas</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-studify-green">
              <CardContent className="pt-5 text-center">
                <div className="text-3xl font-bold text-studify-green">{accuracy}%</div>
                <p className="text-sm text-studify-gray mt-1">Precisão</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-studify-green">
              <CardContent className="pt-5 text-center">
                <div className="text-3xl font-bold text-studify-green">{formatTime(studyTime)}</div>
                <p className="text-sm text-studify-gray mt-1">Tempo Total</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              onClick={handleRestart}
              size="lg"
              className="bg-studify-green hover:bg-studify-lightgreen text-studify-white hover:text-studify-green"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Estudar Novamente
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="lg" className="border-studify-gray text-studify-gray">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Menu Principal
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Ensure we have a valid current card
  if (!currentCard) {
    return (
      <div className="container mx-auto p-6 bg-studify-white min-h-screen">
        <div className="max-w-2xl mx-auto text-center py-12 space-y-4">
          <Target className="h-16 w-16 text-gray-400 mx-auto" />
          <h3 className="text-xl font-semibold text-studify-gray">Erro ao carregar flashcard</h3>
          <p className="text-studify-gray">Não foi possível carregar o flashcard atual.</p>
          {onClose && (
            <Button onClick={onClose} variant="outline" className="border-studify-gray text-studify-gray">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Menu
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 bg-studify-white min-h-screen">
      <div className="max-w-3xl mx-auto space-y-5">
        {onClose && (
          <div className="flex justify-start">
            <Button onClick={onClose} variant="outline" size="sm" className="border-studify-gray text-studify-gray">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Menu
            </Button>
          </div>
        )}

        <Card className="shadow-lg border rounded-lg bg-white">
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
              <div className="font-semibold text-studify-green text-lg">{initialDeckName}</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-studify-gray">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span>
                    {session.currentIndex + 1} / {session.totalCards}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-studify-gray">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(studyTime)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-studify-green">
                  <CheckCircle className="h-4 w-4" />
                  <span>{session.correctAnswers}</span>
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2 bg-green-100 [&>div]:bg-studify-green" />
          </CardContent>
        </Card>

        <FlippableFlashcardItem
          ref={cardRef}
          flashcard={currentCard}
          onFlip={setAnswerRevealed}
          initialFlipState={answerRevealed}
        />

        <div className="grid grid-cols-3 gap-3 items-center pt-2">
          <Button
            onClick={handlePrevious}
            variant="outline"
            className="py-5 text-studify-gray hover:bg-gray-100 border-gray-300"
            disabled={session.currentIndex === 0}
            aria-label="Card Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {!answerRevealed ? (
            <Button
              onClick={handleRevealAnswer}
              size="lg"
              className="col-span-1 py-5 bg-studify-green hover:bg-studify-lightgreen text-studify-white hover:text-studify-green text-base"
            >
              <Eye className="mr-2 h-5 w-5" />
              Mostrar Resposta
            </Button>
          ) : (
            <div className="col-span-1 grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleAnswer(false)}
                variant="outline"
                className="py-5 text-red-600 hover:bg-red-50 border-red-300 hover:border-red-400"
                aria-label="Marcar como Errei"
              >
                <XCircle className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleAnswer(true)}
                className="py-5 bg-studify-green hover:bg-studify-lightgreen text-studify-white hover:text-studify-green"
                aria-label="Marcar como Acertei"
              >
                <CheckCircle className="h-5 w-5" />
              </Button>
            </div>
          )}

          <Button
            onClick={handleNext}
            variant="outline"
            className="py-5 text-studify-gray hover:bg-gray-100 border-gray-300"
            disabled={session.currentIndex === session.totalCards - 1 && answerRevealed}
            aria-label="Próximo Card"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-center text-xs text-studify-gray mt-2">
          Use as setas do teclado para navegar (← anterior, → próximo, Espaço para virar).
        </p>
      </div>
    </div>
  )
}

export default FlashcardViewer
