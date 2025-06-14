"use client"

import { useState } from "react"
import FlashcardItem from "./flashcard-item"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, CheckCircle, XCircle } from "lucide-react"
import type { Flashcard } from "@/types/flashcards"
import { Progress } from "@/components/ui/progress"

interface FlashcardViewerProps {
  flashcards: Flashcard[]
  onComplete?: () => void
}

export default function FlashcardViewer({ flashcards, onComplete }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)
  // Placeholder for actual progress tracking
  const [knownCount, setKnownCount] = useState(0)
  const [unknownCount, setUnknownCount] = useState(0)

  if (!flashcards || flashcards.length === 0) {
    return <p className="text-center text-gray-600">Nenhum flashcard para exibir.</p>
  }

  const handleNext = (known: boolean) => {
    if (known) setKnownCount((prev) => prev + 1)
    else setUnknownCount((prev) => prev + 1)

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setShowCompletion(true)
      if (onComplete) onComplete()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      // Adjust counts if going back - more complex logic needed for robust tracking
    }
  }

  const progressPercentage = ((currentIndex + 1) / flashcards.length) * 100

  if (showCompletion) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-green-600">Parabéns!</h2>
        <p className="text-lg mb-2">Você completou este deck de flashcards.</p>
        <p className="text-md text-gray-700">Corretos: {knownCount}</p>
        <p className="text-md text-gray-700 mb-6">Incorretos: {unknownCount}</p>
        <Button
          onClick={() => {
            setCurrentIndex(0)
            setShowCompletion(false)
            setKnownCount(0)
            setUnknownCount(0)
          }}
        >
          Revisar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <FlashcardItem flashcard={flashcards[currentIndex]} key={flashcards[currentIndex].id} />
      <Progress value={progressPercentage} className="w-full" />
      <p className="text-center text-sm text-gray-500">
        Flashcard {currentIndex + 1} de {flashcards.length}
      </p>
      <div className="flex justify-around items-center mt-4">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="px-4 py-2">
          <ArrowLeft className="h-5 w-5 mr-2" /> Anterior
        </Button>
        <div className="flex gap-4">
          <Button onClick={() => handleNext(false)} variant="destructive" className="px-6 py-3 text-lg">
            <XCircle className="h-6 w-6 mr-2" /> Errei
          </Button>
          <Button
            onClick={() => handleNext(true)}
            variant="default"
            className="bg-green-600 hover:bg-green-700 px-6 py-3 text-lg"
          >
            <CheckCircle className="h-6 w-6 mr-2" /> Acertei
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => handleNext(true)}
          disabled={currentIndex === flashcards.length - 1}
          className="px-4 py-2"
        >
          Próximo <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
