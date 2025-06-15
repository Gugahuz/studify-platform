"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, BookOpen, Brain, Star, Info, ChevronDown, ChevronUp } from "lucide-react"
import type { Flashcard } from "@/types/flashcards"
import { cn } from "@/lib/utils"

interface FlippableFlashcardItemProps {
  flashcard: Flashcard
  className?: string
  onFlip?: (isFlipped: boolean) => void
  initialFlipState?: boolean
}

export interface FlippableFlashcardRef {
  flipCard: () => void
  setFlipState: (isFlipped: boolean) => void
}

const FlippableFlashcardItem = forwardRef<FlippableFlashcardRef, FlippableFlashcardItemProps>(
  ({ flashcard, className, onFlip, initialFlipState = false }, ref) => {
    const [isFlipped, setIsFlipped] = useState(initialFlipState)
    const [isAnimating, setIsAnimating] = useState(false)
    const [showExplanation, setShowExplanation] = useState(false)

    // Defensive programming - ensure flashcard exists and has required properties
    const safeFlashcard = {
      id: flashcard?.id || "unknown",
      question: flashcard?.question || "Pergunta não disponível",
      answer: flashcard?.answer || "Resposta não disponível",
      explanation: flashcard?.explanation || null,
      difficulty_level: flashcard?.difficulty_level || 3,
      tags: flashcard?.tags || [],
      subject: flashcard?.subject || "Matéria",
      topic: flashcard?.topic || "Tópico",
      source: flashcard?.source || "Sistema",
    }

    useEffect(() => {
      setIsFlipped(initialFlipState)
      setShowExplanation(false)
    }, [initialFlipState, flashcard])

    const handleFlip = () => {
      if (isAnimating) return
      setIsAnimating(true)
      const newFlipState = !isFlipped
      setIsFlipped(newFlipState)
      setShowExplanation(false) // Reset explanation when flipping
      onFlip?.(newFlipState)
      setTimeout(() => setIsAnimating(false), 600)
    }

    useImperativeHandle(ref, () => ({
      flipCard: handleFlip,
      setFlipState: (newState) => {
        if (isAnimating) return
        setIsAnimating(true)
        setIsFlipped(newState)
        setShowExplanation(false) // Reset explanation when flipping
        onFlip?.(newState)
        setTimeout(() => setIsAnimating(false), 600)
      },
    }))

    const getDifficultyColor = (level: number) => {
      if (level <= 1) return "bg-green-100 text-studify-green border-green-300"
      if (level === 2) return "bg-blue-100 text-blue-800 border-blue-300"
      if (level === 3) return "bg-yellow-100 text-yellow-800 border-yellow-300"
      if (level === 4) return "bg-orange-100 text-orange-800 border-orange-300"
      return "bg-red-100 text-red-800 border-red-300"
    }

    const getDifficultyLabel = (level: number) => {
      const labels = ["N/A", "Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"]
      return labels[level] || "Indefinido"
    }

    const isLongExplanation = safeFlashcard.explanation && safeFlashcard.explanation.length > 100

    return (
      <div className={cn("perspective-1000 w-full max-w-xl mx-auto", className)}>
        <Card
          className={cn(
            "w-full h-[400px] md:h-[450px] cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 transform-style-preserve-3d relative rounded-xl border-2",
            isFlipped ? "rotate-y-180" : "",
            isAnimating ? "pointer-events-none" : "",
            isFlipped ? "border-studify-green" : "border-studify-lightgreen",
          )}
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFlip()}
          aria-label={`Flashcard: ${isFlipped ? "Resposta" : "Pergunta"}. Clique para virar.`}
        >
          {/* Front Side - Question */}
          <CardContent
            className={cn(
              "w-full h-full flex flex-col justify-between p-6 backface-hidden absolute top-0 left-0 rounded-xl",
              "bg-gradient-to-br from-green-50 via-studify-white to-green-100",
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-sm text-studify-green">
                <BookOpen className="h-4 w-4" />
                <span className="font-semibold">{safeFlashcard.subject}</span>
                {safeFlashcard.topic && (
                  <>
                    <span className="opacity-50">•</span>
                    <span className="font-medium">{safeFlashcard.topic}</span>
                  </>
                )}
              </div>
              <Badge variant="outline" className={cn("text-xs", getDifficultyColor(safeFlashcard.difficulty_level))}>
                {getDifficultyLabel(safeFlashcard.difficulty_level)}
              </Badge>
            </div>

            <div className="flex-1 flex items-center justify-center text-center">
              <div className="space-y-3">
                <Brain className="h-10 w-10 text-studify-green mx-auto" />
                <p className="text-xl md:text-2xl font-semibold text-gray-800 leading-snug">{safeFlashcard.question}</p>
              </div>
            </div>

            <div className="flex justify-end items-end mt-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-studify-green hover:text-studify-lightgreen hover:bg-green-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFlip()
                }}
                aria-label="Virar card"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>

          {/* Back Side - Answer */}
          <CardContent
            className={cn(
              "w-full h-full flex flex-col justify-between p-6 backface-hidden rotate-y-180 absolute top-0 left-0 rounded-xl",
              "bg-gradient-to-br from-blue-50 via-studify-white to-blue-100",
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-sm text-studify-green">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">Resposta</span>
              </div>
              {safeFlashcard.source && (
                <Badge variant="outline" className="text-xs border-studify-green text-studify-green">
                  Fonte: {safeFlashcard.source}
                </Badge>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent">
              <p className="text-lg md:text-xl font-medium text-gray-800 leading-snug mb-3">{safeFlashcard.answer}</p>

              {safeFlashcard.explanation && (
                <div className="mt-3 bg-studify-white/80 rounded-lg border border-studify-green w-full max-w-md">
                  {isLongExplanation ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowExplanation(!showExplanation)
                        }}
                        className="w-full p-3 justify-between text-left hover:bg-green-50"
                      >
                        <div className="flex items-center text-sm font-semibold text-studify-green">
                          <Info className="h-4 w-4 mr-1.5" />
                          Explicação Adicional
                        </div>
                        {showExplanation ? (
                          <ChevronUp className="h-4 w-4 text-studify-green" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-studify-green" />
                        )}
                      </Button>
                      {showExplanation && (
                        <div className="px-3 pb-3">
                          <p className="text-sm text-studify-gray text-left leading-relaxed">
                            {safeFlashcard.explanation}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3">
                      <div className="flex items-center text-sm font-semibold text-studify-green mb-1.5">
                        <Info className="h-4 w-4 mr-1.5" />
                        Explicação Adicional:
                      </div>
                      <p className="text-sm text-studify-gray text-left leading-relaxed">{safeFlashcard.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end items-end mt-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-studify-green hover:text-studify-lightgreen hover:bg-green-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFlip()
                }}
                aria-label="Virar card"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  },
)

FlippableFlashcardItem.displayName = "FlippableFlashcardItem"
export default FlippableFlashcardItem
