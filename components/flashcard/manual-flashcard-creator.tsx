"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Save, Eye, EyeOff, Wand2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ManualFlashcard {
  id: string
  question: string
  answer: string
  explanation?: string
  difficulty: number
  tags: string[]
}

interface ManualFlashcardCreatorProps {
  onSave: (deckName: string, flashcards: ManualFlashcard[]) => void
  isSaving: boolean
}

export default function ManualFlashcardCreator({ onSave, isSaving }: ManualFlashcardCreatorProps) {
  const [deckName, setDeckName] = useState("")
  const [flashcards, setFlashcards] = useState<ManualFlashcard[]>([
    {
      id: "1",
      question: "",
      answer: "",
      explanation: "",
      difficulty: 3,
      tags: [],
    },
  ])
  const [previewMode, setPreviewMode] = useState(false)
  const [newTag, setNewTag] = useState("")
  const { toast } = useToast()

  const addFlashcard = () => {
    const newCard: ManualFlashcard = {
      id: Date.now().toString(),
      question: "",
      answer: "",
      explanation: "",
      difficulty: 3,
      tags: [],
    }
    setFlashcards([...flashcards, newCard])
  }

  const removeFlashcard = (id: string) => {
    if (flashcards.length === 1) {
      toast({
        title: "Não é possível remover",
        description: "Você precisa ter pelo menos um flashcard.",
        variant: "destructive",
      })
      return
    }
    setFlashcards(flashcards.filter((card) => card.id !== id))
  }

  const updateFlashcard = (id: string, field: keyof ManualFlashcard, value: any) => {
    setFlashcards(
      flashcards.map((card) =>
        card.id === id
          ? {
              ...card,
              [field]: value,
            }
          : card,
      ),
    )
  }

  const addTag = (cardId: string, tag: string) => {
    if (!tag.trim()) return

    const card = flashcards.find((c) => c.id === cardId)
    if (card && !card.tags.includes(tag.trim().toLowerCase())) {
      updateFlashcard(cardId, "tags", [...card.tags, tag.trim().toLowerCase()])
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

  const handleSave = () => {
    if (!deckName.trim()) {
      toast({
        title: "Nome do deck necessário",
        description: "Por favor, insira um nome para o deck.",
        variant: "destructive",
      })
      return
    }

    const validFlashcards = flashcards.filter((card) => card.question.trim() && card.answer.trim())

    if (validFlashcards.length === 0) {
      toast({
        title: "Flashcards inválidos",
        description: "Pelo menos um flashcard deve ter pergunta e resposta preenchidas.",
        variant: "destructive",
      })
      return
    }

    onSave(deckName, validFlashcards)
  }

  const getDifficultyLabel = (level: number) => {
    const labels = ["", "Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"]
    return labels[level] || "Indefinido"
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

  return (
    <div className="space-y-6">
      {/* Deck Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Configurações do Deck
          </CardTitle>
          <CardDescription>Configure o nome e as propriedades do seu deck personalizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="deck-name">Nome do Deck *</Label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Ex: Meu Deck de Matemática"
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{flashcards.length} flashcard(s)</span>
              <span className="text-sm text-gray-600">
                {flashcards.filter((c) => c.question.trim() && c.answer.trim()).length} válido(s)
              </span>
            </div>
            <Button onClick={() => setPreviewMode(!previewMode)} variant="outline" size="sm">
              {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? "Editar" : "Visualizar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flashcards */}
      <div className="space-y-4">
        {flashcards.map((card, index) => (
          <Card key={card.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Flashcard {index + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(card.difficulty)}>{getDifficultyLabel(card.difficulty)}</Badge>
                  <Button
                    onClick={() => removeFlashcard(card.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {previewMode ? (
                // Preview Mode
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-blue-800">Pergunta:</Label>
                    <p className="mt-1 text-blue-900">{card.question || "Pergunta não preenchida"}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-green-800">Resposta:</Label>
                    <p className="mt-1 text-green-900">{card.answer || "Resposta não preenchida"}</p>
                  </div>
                  {card.explanation && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <Label className="text-sm font-medium text-gray-800">Explicação:</Label>
                      <p className="mt-1 text-gray-900">{card.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`question-${card.id}`}>Pergunta *</Label>
                    <Textarea
                      id={`question-${card.id}`}
                      value={card.question}
                      onChange={(e) => updateFlashcard(card.id, "question", e.target.value)}
                      placeholder="Digite a pergunta do flashcard..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`answer-${card.id}`}>Resposta *</Label>
                    <Textarea
                      id={`answer-${card.id}`}
                      value={card.answer}
                      onChange={(e) => updateFlashcard(card.id, "answer", e.target.value)}
                      placeholder="Digite a resposta do flashcard..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`explanation-${card.id}`}>Explicação (Opcional)</Label>
                    <Textarea
                      id={`explanation-${card.id}`}
                      value={card.explanation || ""}
                      onChange={(e) => updateFlashcard(card.id, "explanation", e.target.value)}
                      placeholder="Adicione uma explicação adicional..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor={`difficulty-${card.id}`}>Dificuldade</Label>
                      <Select
                        value={card.difficulty.toString()}
                        onValueChange={(value) => updateFlashcard(card.id, "difficulty", Number.parseInt(value))}
                      >
                        <SelectTrigger id={`difficulty-${card.id}`} className="mt-1">
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
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2 mb-2">
                      {card.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            onClick={() => removeTag(card.id, tag)}
                            className="ml-1 hover:text-red-500"
                            type="button"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Adicionar tag..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addTag(card.id, newTag)
                          }
                        }}
                      />
                      <Button
                        onClick={() => addTag(card.id, newTag)}
                        variant="outline"
                        size="sm"
                        disabled={!newTag.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button onClick={addFlashcard} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Flashcard
        </Button>

        <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Deck
            </>
          )}
        </Button>
      </div>

      <Separator />

      <div className="text-center text-sm text-gray-600">
        <p>💡 Dica: Use tags para organizar seus flashcards e facilitar a busca posterior.</p>
      </div>
    </div>
  )
}
