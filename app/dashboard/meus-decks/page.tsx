"use client"

import { useState } from "react"
import { CustomDeckCreator } from "@/components/custom-decks/custom-deck-creator"
import { CustomDeckList } from "@/components/custom-decks/custom-deck-list"
import { FlashcardViewer } from "@/components/flashcard/flashcard-viewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"

type ViewMode = "list" | "create" | "edit" | "study" | "stats"

interface CustomDeck {
  id: string
  name: string
  description?: string
  total_cards: number
  created_at: string
  updated_at: string
  is_active: boolean
}

export default function MeusDecksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedDeck, setSelectedDeck] = useState<CustomDeck | null>(null)
  const [editingFlashcards, setEditingFlashcards] = useState<any[]>([])

  const handleCreateNew = () => {
    setSelectedDeck(null)
    setEditingFlashcards([])
    setViewMode("create")
  }

  const handleEditDeck = async (deck: CustomDeck) => {
    try {
      // Buscar flashcards do deck para edição
      const userId = "user-id-placeholder" // Será substituído pela autenticação real
      const response = await fetch(`/api/custom-decks/${deck.id}?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setSelectedDeck(deck)
        setEditingFlashcards(result.flashcards || [])
        setViewMode("edit")
      } else {
        console.error("Erro ao carregar deck para edição:", result.error)
      }
    } catch (error) {
      console.error("Erro ao carregar deck:", error)
    }
  }

  const handleStudyDeck = async (deck: CustomDeck) => {
    try {
      // Buscar flashcards do deck para estudo
      const userId = "user-id-placeholder"
      const response = await fetch(`/api/custom-decks/${deck.id}?userId=${userId}`)
      const result = await response.json()

      if (result.success && result.flashcards?.length > 0) {
        setSelectedDeck(deck)
        setEditingFlashcards(result.flashcards)
        setViewMode("study")
      } else {
        console.error("Deck não possui flashcards para estudo")
      }
    } catch (error) {
      console.error("Erro ao carregar deck para estudo:", error)
    }
  }

  const handleViewStats = (deck: CustomDeck) => {
    setSelectedDeck(deck)
    setViewMode("stats")
  }

  const handleDeckCreated = () => {
    setViewMode("list")
    setSelectedDeck(null)
    setEditingFlashcards([])
  }

  const handleBackToList = () => {
    setViewMode("list")
    setSelectedDeck(null)
    setEditingFlashcards([])
  }

  const renderHeader = () => {
    switch (viewMode) {
      case "create":
        return (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Criar Novo Deck</h1>
              <p className="text-gray-600">Crie seu deck personalizado de flashcards</p>
            </div>
          </div>
        )
      case "edit":
        return (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Editar Deck</h1>
              <p className="text-gray-600">Modificando: {selectedDeck?.name}</p>
            </div>
          </div>
        )
      case "study":
        return (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Estudando Deck</h1>
              <p className="text-gray-600">
                {selectedDeck?.name} • {editingFlashcards.length} flashcards
              </p>
            </div>
          </div>
        )
      case "stats":
        return (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Estatísticas do Deck</h1>
              <p className="text-gray-600">{selectedDeck?.name}</p>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Meus Decks</h1>
              <p className="text-gray-600">Gerencie seus decks personalizados de flashcards</p>
            </div>
          </div>
        )
    }
  }

  const renderContent = () => {
    switch (viewMode) {
      case "create":
        return <CustomDeckCreator onDeckCreated={handleDeckCreated} onCancel={handleBackToList} />
      case "edit":
        return (
          <CustomDeckCreator
            editingDeck={selectedDeck}
            editingFlashcards={editingFlashcards}
            onDeckCreated={handleDeckCreated}
            onCancel={handleBackToList}
          />
        )
      case "study":
        return selectedDeck && editingFlashcards.length > 0 ? (
          <FlashcardViewer
            flashcards={editingFlashcards.map((card) => ({
              id: card.id,
              question: card.question,
              answer: card.answer,
              explanation: card.explanation,
              difficulty_level: card.difficulty_level,
              tags: card.tags || [],
            }))}
            title={selectedDeck.name}
            onComplete={(results) => {
              console.log("Sessão de estudo concluída:", results)
              // Aqui você pode registrar a sessão de estudo
              handleBackToList()
            }}
          />
        ) : (
          <div className="text-center py-12">
            <p>Erro ao carregar flashcards para estudo</p>
            <Button onClick={handleBackToList} className="mt-4">
              Voltar à lista
            </Button>
          </div>
        )
      case "stats":
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Estatísticas do deck em desenvolvimento...</p>
            <Button onClick={handleBackToList}>Voltar à lista</Button>
          </div>
        )
      default:
        return (
          <CustomDeckList
            onCreateNew={handleCreateNew}
            onEditDeck={handleEditDeck}
            onStudyDeck={handleStudyDeck}
            onViewStats={handleViewStats}
          />
        )
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {renderHeader()}
      {renderContent()}
    </div>
  )
}
