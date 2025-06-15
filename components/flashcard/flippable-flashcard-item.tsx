"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, BookOpen, Brain, Star, Info } from "lucide-react"
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

    useEffect(() => {
      setIsFlipped(initialFlipState)
    }, [initialFlipState, flashcard]) // Reset flip state when card changes or initial state changes

    const handleFlip = () => {
      if (isAnimating) return
      setIsAnimating(true)
      const newFlipState = !isFlipped
      setIsFlipped(newFlipState)
      onFlip?.(newFlipState)
      setTimeout(() => setIsAnimating(false), 600) // Animation duration
    }

    useImperativeHandle(ref, () => ({
      flipCard: handleFlip,
      setFlipState: (newState) => {
        if (isAnimating) return
        setIsAnimating(true)
        setIsFlipped(newState)
        onFlip?.(newState)
        setTimeout(() => setIsAnimating(false), 600)
      },
    }))

    const getDifficultyColor = (level: number) => {
      if (level <= 1) return "bg-green-100 text-green-800 border-green-300"
      if (level === 2) return "bg-blue-100 text-blue-800 border-blue-300"
      if (level === 3) return "bg-yellow-100 text-yellow-800 border-yellow-300"
      if (level === 4) return "bg-orange-100 text-orange-800 border-orange-300"
      return "bg-red-100 text-red-800 border-red-300"
    }

    const getDifficultyLabel = (level: number) => {
      const labels = ["N/A", "Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"]
      return labels[level] || "Indefinido"
    }

    return (
      <div className={cn("perspective-1000 w-full max-w-xl mx-auto", className)}>
        <Card
          className={cn(
            "w-full h-[400px] md:h-[450px] cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-300 transform-style-preserve-3d relative rounded-xl border-2",
            isFlipped ? "rotate-y-180" : "",
            isAnimating ? "pointer-events-none" : "",
            isFlipped ? "border-blue-400" : "border-purple-400",
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
              "bg-gradient-to-br from-purple-50 via-white to-purple-100",
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-sm text-purple-700">
                <BookOpen className="h-4 w-4" />
                <span className="font-semibold">{flashcard.subject}</span>
                {flashcard.topic && (
                  <>
                    <span className="opacity-50">•</span>
                    <span className="font-medium">{flashcard.topic}</span>
                  </>
                )}
              </div>
              <Badge variant="outline" className={cn("text-xs", getDifficultyColor(flashcard.difficulty_level))}>
                {getDifficultyLabel(flashcard.difficulty_level)}
              </Badge>
            </div>

            <div className="flex-1 flex items-center justify-center text-center">
              <div className="space-y-3">
                <Brain className="h-10 w-10 text-purple-500 mx-auto" />
                <p className="text-xl md:text-2xl font-semibold text-gray-800 leading-snug">{flashcard.question}</p>
              </div>
            </div>

            <div className="flex justify-between items-end mt-3">
              {flashcard.tags && flashcard.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {flashcard.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-purple-500 hover:text-purple-700 hover:bg-purple-100"
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
              "bg-gradient-to-br from-blue-50 via-white to-blue-100",
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">Resposta</span>
              </div>
              {flashcard.source && (
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                  Fonte: {flashcard.source}
                </Badge>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
              <p className="text-lg md:text-xl font-medium text-gray-800 leading-snug mb-3">{flashcard.answer}</p>
              {flashcard.explanation && (
                <div className="mt-3 bg-white/80 rounded-lg p-3 border border-blue-200 w-full max-w-md">
                  <div className="flex items-center text-sm font-semibold text-blue-600 mb-1.5">
                    <Info className="h-4 w-4 mr-1.5" />
                    Explicação Adicional:
                  </div>
                  <p className="text-sm text-gray-700 text-left leading-relaxed">{flashcard.explanation}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end items-end mt-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
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
