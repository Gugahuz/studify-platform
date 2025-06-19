"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Save, Eye, EyeOff, AlertCircle, CheckCircle, X } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Flashcard {
  id: string
  question: string
  answer: string
  explanation?: string
  difficulty_level: number
  tags: string[]
}

interface CustomDeckCreatorProps {
  onDeckCreated?: (deck: any) => void
  onCancel?: () => void
  editingDeck?: any
  editingFlashcards?: Flashcard[]
}

export function CustomDeckCreator({ onDeckCreated, onCancel, editingDeck, editingFlashcards }: CustomDeckCreatorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" })

  // Estado do deck
  const [deckName, setDeckName] = useState(editingDeck?.name || "")
  const [deckDescription, setDeckDescription] = useState(editingDeck?.description || "")

  // Estado dos flashcards
  const [flashcards, setFlashcards] = useState<Flashcard[]>(
    editingFlashcards && editingFlashcards.length > 0
      ? editingFlashcards.map((card) => ({
          id: card.id || Date.now().toString(),
          question: card.question || "",
          answer: card.answer || "",
          explanation: card.explanation || "",
          difficulty_level: card.difficulty_level || 3,
          tags: Array.isArray(card.tags) ? card.tags : [],
        }))
      : [
          {
            id: "1",
            question: "",
            answer: "",
            explanation: "",
            difficulty_level: 3,
            tags: [],
          },
        ],
  )

  // Estado da interface
  const [previewMode, setPreviewMode] = useState<{ [key: string]: boolean }>({})
  const [newTag, setNewTag] = useState("")

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: null, text: "" }), 5000)
  }

  const addFlashcard = () => {
    if (flashcards.length >= 20) {
      showMessage("error", "Máximo de 20 flashcards por deck")
      return
    }

    const newCard: Flashcard = {
      id: Date.now().toString(),
      question: "",
      answer: "",
      explanation: "",
      difficulty_level: 3,
      tags: [],
    }

    setFlashcards([...flashcards, newCard])
  }

  const removeFlashcard = (id: string) => {
    if (flashcards.length <= 1) {
      showMessage("error", "Deve haver pelo menos 1 flashcard")
      return
    }

    setFlashcards(flashcards.filter((card) => card.id !== id))
  }

  const updateFlashcard = (id: string, field: keyof Flashcard, value: any) => {
    setFlashcards(flashcards.map((card) => (card.id === id ? { ...card, [field]: value } : card)))
  }

  const addTag = (cardId: string, tag: string) => {
    if (!tag.trim()) return

    const card = flashcards.find((c) => c.id === cardId)
    if (card && !card.tags.includes(tag.trim())) {
      updateFlashcard(cardId, "tags", [...card.tags, tag.trim()])
    }
    setNewTag("")
  }

  const removeTag = (cardId: string, tagToRemove: string) => {
    const card = flashcards.find((c) => c.id === cardId)
    if (card) {
      updateFlashcard(
        cardId,
        "tags",
        card.tags.filter((tag) => tag !== tagToRemove),
      )
    }
  }

  const togglePreview = (cardId: string) => {
    setPreviewMode((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  const validateDeck = () => {
    if (!deckName.trim()) {
      showMessage("error", "Nome do deck é obrigatório")
      return false
    }

    const validCards = flashcards.filter((card) => card.question.trim() && card.answer.trim())

    if (validCards.length === 0) {
      showMessage("error", "Pelo menos 1 flashcard deve ter pergunta e resposta")
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateDeck()) return

    setIsLoading(true)
    setMessage({ type: null, text: "" })

    try {
      // Obter usuário atual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        showMessage("error", "Usuário não autenticado")
        setIsLoading(false)
        return
      }

      // Filtrar apenas cards válidos
      const validCards = flashcards.filter((card) => card.question.trim() && card.answer.trim())

      const deckData = {
        userId: user.id,
        name: deckName.trim(),
        description: deckDescription.trim() || null,
        flashcards: validCards.map((card) => ({
          question: card.question.trim(),
          answer: card.answer.trim(),
          explanation: card.explanation?.trim() || null,
          difficulty_level: card.difficulty_level,
          tags: card.tags,
        })),
      }

      const url = editingDeck ? `/api/custom-decks/${editingDeck.id}?userId=${user.id}` : "/api/custom-decks"
      const method = editingDeck ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deckData),
      })

      const result = await response.json()

      if (result.success) {
        showMessage("success", editingDeck ? "Deck atualizado com sucesso!" : "Deck criado com sucesso!")
        setTimeout(() => {
          onDeckCreated?.(result.deck)
        }, 1500)
      } else {
        showMessage("error", result.error || "Erro ao salvar deck")
      }
    } catch (error) {
      console.error("Erro ao salvar deck:", error)
      showMessage("error", "Erro ao salvar deck")
    } finally {
      setIsLoading(false)
    }
  }

  const validCardsCount = flashcards.filter((card) => card.question.trim() && card.answer.trim()).length

  return (
    <div className="space-y-6">
      {/* Mensagem de feedback */}
      {message.type && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className="relative">
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-700" : ""}>
              {message.text}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-6 w-6 p-0"
            onClick={() => setMessage({ type: null, text: "" })}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Header do Criador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingDeck ? "Editar Deck Personalizado" : "Criar Deck Personalizado"}
          </CardTitle>
          <CardDescription>
            {editingDeck ? "Modifique seu deck personalizado" : "Crie seu próprio deck de flashcards (máximo 20 cards)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deck-name">Nome do Deck *</Label>
              <Input
                id="deck-name"
                placeholder="Ex: Matemática - Álgebra Linear"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant={validCardsCount > 0 ? "default" : "secondary"}>
                  {validCardsCount} / 20 cards válidos
                </Badge>
                {flashcards.length >= 20 && (
                  <Badge variant="outline" className="text-orange-600">
                    Limite máximo
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deck-description">Descrição (opcional)</Label>
            <Textarea
              id="deck-description"
              placeholder="Descreva o conteúdo do seu deck..."
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Flashcards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Flashcards</h3>
          <Button onClick={addFlashcard} disabled={flashcards.length >= 20} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Card
          </Button>
        </div>

        {flashcards.map((card, index) => (
          <Card key={card.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Flashcard #{index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => togglePreview(card.id)}>
                    {previewMode[card.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFlashcard(card.id)}
                    disabled={flashcards.length <= 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {previewMode[card.id] ? (
                // Modo Preview
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Pergunta:</Label>
                    <p className="mt-1 text-sm">{card.question || "Pergunta não definida"}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-green-600">Resposta:</Label>
                    <p className="mt-1 text-sm">{card.answer || "Resposta não definida"}</p>
                  </div>
                  {card.explanation && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium text-purple-600">Explicação:</Label>
                        <p className="mt-1 text-sm text-gray-600">{card.explanation}</p>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Dificuldade: {card.difficulty_level}/5</Badge>
                    {card.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                // Modo Edição
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pergunta *</Label>
                      <Textarea
                        placeholder="Digite a pergunta..."
                        value={card.question}
                        onChange={(e) => updateFlashcard(card.id, "question", e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Resposta *</Label>
                      <Textarea
                        placeholder="Digite a resposta..."
                        value={card.answer}
                        onChange={(e) => updateFlashcard(card.id, "answer", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Explicação (opcional)</Label>
                    <Textarea
                      placeholder="Adicione uma explicação detalhada..."
                      value={card.explanation}
                      onChange={(e) => updateFlashcard(card.id, "explanation", e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nível de Dificuldade</Label>
                      <Select
                        value={card.difficulty_level.toString()}
                        onValueChange={(value) => updateFlashcard(card.id, "difficulty_level", Number.parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Muito Fácil</SelectItem>
                          <SelectItem value="2">2 - Fácil</SelectItem>
                          <SelectItem value="3">3 - Médio</SelectItem>
                          <SelectItem value="4">4 - Difícil</SelectItem>
                          <SelectItem value="5">5 - Muito Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Adicionar tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addTag(card.id, newTag)
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => addTag(card.id, newTag)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {card.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-red-100"
                              onClick={() => removeTag(card.id, tag)}
                            >
                              {tag} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Indicador de validação */}
              {(!card.question.trim() || !card.answer.trim()) && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Pergunta e resposta são obrigatórias
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-600">
          {validCardsCount} de {flashcards.length} flashcards válidos
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave} disabled={isLoading || validCardsCount === 0} className="min-w-[120px]">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {editingDeck ? "Atualizar" : "Criar"} Deck
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
