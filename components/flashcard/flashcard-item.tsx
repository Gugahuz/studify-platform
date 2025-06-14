"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { Flashcard } from "@/types/flashcards"
import { cn } from "@/lib/utils"

interface FlashcardItemProps {
  flashcard: Flashcard
  className?: string
}

export default function FlashcardItem({ flashcard, className }: FlashcardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <Card
      className={cn(
        "w-full h-64 md:h-80 flex flex-col justify-center items-center p-6 cursor-pointer shadow-lg transform-style-preserve-3d transition-transform duration-700 relative",
        isFlipped ? "rotate-y-180" : "",
        className,
      )}
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFlip()}
      aria-label={`Flashcard: ${isFlipped ? "Answer" : "Question"}. Click to flip.`}
    >
      <CardContent className="w-full h-full flex flex-col justify-center items-center text-center backface-hidden absolute top-0 left-0">
        <p className="text-sm text-gray-500 mb-2">
          {flashcard.subject} - {flashcard.topic}
        </p>
        <p className="text-lg md:text-xl font-semibold">{flashcard.question}</p>
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
      <CardContent className="w-full h-full flex flex-col justify-center items-center text-center backface-hidden rotate-y-180 absolute top-0 left-0 bg-gray-50">
        <p className="text-lg md:text-xl">{flashcard.answer}</p>
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
  )
}
