"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, BookOpen, Brain, Star } from "lucide-react"
import type { Flashcard } from "@/types/flashcards"
import { cn } from "@/lib/utils"

interface EnhancedFlashcardItemProps {
  flashcard: Flashcard
  className?: string
  showDifficulty?: boolean
  showTags?: boolean
  onRate?: (rating: number) => void
}

export default function EnhancedFlashcardItem({
  flashcard,
  className,
  showDifficulty = true,
  showTags = true,
  onRate,
}: EnhancedFlashcardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleFlip = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsFlipped(!isFlipped)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-green-100 text-green-800"
      case 2:
        return "bg-blue-100 text-blue-800"
      case 3:
        return "bg-yellow-100 text-yellow-800"
      case 4:
        return "bg-orange-100 text-orange-800"
      case 5:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1:
        return "Muito Fácil"
      case 2:
        return "Fácil"
      case 3:
        return "Médio"
      case 4:
        return "Difícil"
      case 5:
        return "Muito Difícil"
      default:
        return "Indefinido"
    }
  }

  return (
    <div className="perspective-1000">
      <Card
        className={cn(
          "w-full h-80 md:h-96 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform-style-preserve-3d relative",
          isFlipped ? "rotate-y-180" : "",
          isAnimating ? "pointer-events-none" : "",
          className,
        )}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFlip()}
        aria-label={`Flashcard: ${isFlipped ? "Answer" : "Question"}. Click to flip.`}
      >
        {/* Front Side - Question */}
        <CardContent className="w-full h-full flex flex-col justify-between p-6 backface-hidden absolute top-0 left-0 bg-gradient-to-br from-white to-gray-50">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{flashcard.subject}</span>
              {flashcard.topic && (
                <>
                  <span>•</span>
                  <span>{flashcard.topic}</span>
                </>
              )}
            </div>
            {showDifficulty && (
              <Badge className={getDifficultyColor(flashcard.difficulty_level || 3)}>
                {getDifficultyLabel(flashcard.difficulty_level || 3)}
              </Badge>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Brain className="h-8 w-8 text-purple-500 mx-auto mb-4" />
              <p className="text-lg md:text-xl font-semibold text-gray-800 leading-relaxed">{flashcard.question}</p>
            </div>
          </div>

          {showTags && flashcard.tags && flashcard.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {flashcard.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {flashcard.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{flashcard.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-4 right-4 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation()
              handleFlip()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Virar
          </Button>
        </CardContent>

        {/* Back Side - Answer */}
        <CardContent className="w-full h-full flex flex-col justify-between p-6 backface-hidden rotate-y-180 absolute top-0 left-0 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Resposta</span>
            </div>
            {flashcard.source && (
              <Badge variant="outline" className="text-xs">
                {flashcard.source}
              </Badge>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center text-center">
            <div className="space-y-4">
              <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">{flashcard.answer}</p>
              {flashcard.explanation && (
                <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 italic">💡 {flashcard.explanation}</p>
                </div>
              )}
            </div>
          </div>

          {onRate && (
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRate(rating)
                  }}
                  className="p-1"
                >
                  <Star className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-4 right-4 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation()
              handleFlip()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Virar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
