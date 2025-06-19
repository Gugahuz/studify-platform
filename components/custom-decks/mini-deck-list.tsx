"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Plus, BookOpen, Edit, Trash2, Play, Calendar, Clock, ArrowLeft, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@supabase/supabase-js"
import { CustomDeckCreator } from "./custom-deck-creator"
import { DeleteDeckModal } from "./delete-deck-modal"
import { SuccessNotification } from "./success-notification"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface CustomDeck {
  id: string
  name: string
  description?: string
  total_cards: number
  created_at: string
  updated_at: string
  is_active: boolean
}

interface MiniDeckListProps {
  onStudyDeck?: (deck: any) => void
  onCreateNew?: () => void
  hideTitle?: boolean
  hideSearch?: boolean
}

export function MiniDeckList({ onStudyDeck, onCreateNew, hideTitle = false, hideSearch = false }: MiniDeckListProps) {
  const [decks, setDecks] = useState<CustomDeck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCreator, setShowCreator] = useState(false)
  const [editingDeck, setEditingDeck] = useState<CustomDeck | null>(null)
  const [editingFlashcards, setEditingFlashcards] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Estados para modal de exclusão
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    deck: CustomDeck | null
    isDeleting: boolean
  }>({
    isOpen: false,
    deck: null,
    isDeleting: false,
  })

  // Estado para notificação de sucesso
  const [successNotification, setSuccessNotification] = useState<{
    isVisible: boolean
    message: string
  }>({
    isVisible: false,
    message: "",
  })

  const filteredDecks = decks.filter(
    (deck) =>
      deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  const showSuccess = (message: string) => {
    setSuccessNotification({
      isVisible: true,
      message,
    })
  }

  // Obter usuário atual
  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error("Erro ao obter usuário:", error)
        return null
      }

      return user?.id || null
    } catch (error) {
      console.error("Erro ao obter usuário:", error)
      return null
    }
  }

  const loadDecks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const userId = await getCurrentUser()
      if (!userId) {
        showError("Usuário não autenticado")
        setIsLoading(false)
        return
      }

      setCurrentUserId(userId)

      const response = await fetch(`/api/custom-decks?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setDecks(result.decks)
      } else {
        showError(result.error || "Erro ao carregar decks")
      }
    } catch (error) {
      console.error("Erro ao carregar decks:", error)
      showError("Erro ao carregar decks")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDeck = async () => {
    if (!deleteModal.deck || !currentUserId) return

    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }))

      const response = await fetch(`/api/custom-decks/${deleteModal.deck.id}?userId=${currentUserId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        // Remover deck da lista
        setDecks((prev) => prev.filter((deck) => deck.id !== deleteModal.deck!.id))

        // Fechar modal
        setDeleteModal({
          isOpen: false,
          deck: null,
          isDeleting: false,
        })

        // Mostrar notificação de sucesso
        showSuccess("Deck excluído com sucesso!")
      } else {
        throw new Error(result.error || "Erro ao excluir deck")
      }
    } catch (error) {
      console.error("Erro ao excluir deck:", error)
      showError("Erro ao excluir deck")
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const openDeleteModal = (deck: CustomDeck) => {
    setDeleteModal({
      isOpen: true,
      deck,
      isDeleting: false,
    })
  }

  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({
        isOpen: false,
        deck: null,
        isDeleting: false,
      })
    }
  }

  const handleEditDeck = async (deck: CustomDeck) => {
    if (!currentUserId) {
      showError("Usuário não autenticado")
      return
    }

    try {
      setError(null)

      // Carregar flashcards do deck para edição
      const response = await fetch(`/api/custom-decks/${deck.id}?userId=${currentUserId}`)
      const result = await response.json()

      if (result.success) {
        setEditingDeck(deck)
        setEditingFlashcards(result.flashcards || [])
        setShowCreator(true)
      } else {
        showError(result.error || "Erro ao carregar deck para edição")
      }
    } catch (error) {
      console.error("Erro ao carregar deck:", error)
      showError("Erro ao carregar deck")
    }
  }

  const handleStudyDeck = async (deck: CustomDeck) => {
    if (!currentUserId) {
      showError("Usuário não autenticado")
      return
    }

    try {
      setError(null)

      // Carregar flashcards do deck
      const response = await fetch(`/api/custom-decks/${deck.id}?userId=${currentUserId}`)
      const result = await response.json()

      if (result.success && result.flashcards) {
        // Converter para formato compatível com FlashcardViewer
        const flashcards = result.flashcards.map((card: any) => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation,
          difficulty: "medium", // Pode ser mapeado do difficulty_level
          subject_id: null,
          topic_id: null,
          created_at: card.created_at,
        }))

        const deckData = {
          ...deck,
          flashcards,
        }

        onStudyDeck?.(deckData)
      } else {
        showError("Erro ao carregar flashcards do deck")
      }
    } catch (error) {
      console.error("Erro ao estudar deck:", error)
      showError("Erro ao estudar deck")
    }
  }

  const handleCreateNew = () => {
    setEditingDeck(null)
    setEditingFlashcards([])
    setShowCreator(true)
  }

  const handleDeckCreated = (deck: any) => {
    setShowCreator(false)
    setEditingDeck(null)
    setEditingFlashcards([])
    loadDecks() // Recarregar lista

    // Mostrar notificação de sucesso
    showSuccess(editingDeck ? "Deck atualizado com sucesso!" : "Deck criado com sucesso!")
  }

  const handleCancelCreation = () => {
    setShowCreator(false)
    setEditingDeck(null)
    setEditingFlashcards([])
  }

  useEffect(() => {
    loadDecks()
  }, [])

  // Se está mostrando o criador, renderizar apenas ele
  if (showCreator) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleCancelCreation}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h3 className="text-lg font-semibold">{editingDeck ? "Editar Deck" : "Criar Novo Deck"}</h3>
        </div>
        <CustomDeckCreator
          onDeckCreated={handleDeckCreated}
          onCancel={handleCancelCreation}
          editingDeck={editingDeck}
          editingFlashcards={editingFlashcards}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        {!hideSearch && <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!currentUserId) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <div className="text-red-500 mb-3">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Erro de Autenticação</h3>
          <p className="text-gray-600">Não foi possível verificar sua identidade. Faça login novamente.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mensagem de erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        {!hideTitle && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-studify-green">Meus Decks</h2>
              <p className="text-sm text-studify-gray">{decks.length} de 10 decks criados</p>
            </div>
            <Button onClick={handleCreateNew} disabled={decks.length >= 10} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Deck
            </Button>
          </div>
        )}

        {/* Barra de Pesquisa */}
        {!hideSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar decks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Botão de criar quando título está oculto */}
        {hideTitle && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">{decks.length} de 10 decks criados</p>
            <Button onClick={handleCreateNew} disabled={decks.length >= 10} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Deck
            </Button>
          </div>
        )}

        {/* Lista de Decks */}
        {filteredDecks.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum deck encontrado" : "Nenhum deck criado ainda"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? "Tente pesquisar com outros termos"
                  : "Crie seu primeiro deck personalizado para começar a estudar"}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateNew} disabled={decks.length >= 10}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Deck
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDecks.map((deck) => (
              <Card key={deck.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate" title={deck.name}>
                        {deck.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">{deck.description || "Sem descrição"}</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                      {deck.total_cards} cards
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Informações do Deck */}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(deck.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    {deck.updated_at !== deck.created_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Editado</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Ações */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStudyDeck(deck)}
                      disabled={deck.total_cards === 0}
                      className="flex-1 h-8 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Estudar
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleEditDeck(deck)} className="h-8 px-2">
                      <Edit className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(deck)}
                      className="text-red-600 hover:text-red-700 h-8 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Limite de Decks */}
        {decks.length >= 8 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <p className="text-xs text-amber-800">
                  {decks.length >= 10
                    ? "Você atingiu o limite máximo de 10 decks. Exclua alguns para criar novos."
                    : `Você está próximo do limite máximo (${decks.length}/10 decks).`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <DeleteDeckModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteDeck}
        deckName={deleteModal.deck?.name || ""}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Notificação de sucesso */}
      <SuccessNotification
        message={successNotification.message}
        isVisible={successNotification.isVisible}
        onClose={() => setSuccessNotification({ isVisible: false, message: "" })}
      />
    </>
  )
}
