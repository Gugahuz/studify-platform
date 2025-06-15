"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FlashcardViewer } from "@/components/flashcard/flashcard-viewer"
import { DatabaseSetupWizard } from "@/components/database-setup-wizard"
import {
  BookOpen,
  Brain,
  Library,
  PlusCircle,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Settings2,
  FileText,
  ListChecks,
  Clock,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import type {
  Flashcard,
  Subject as SubjectType,
  Topic as TopicType,
  PrebuiltDeck as PrebuiltDeckType,
} from "@/types/flashcards"
import { cn } from "@/lib/utils"
import ComprehensiveSubjectSelector from "@/components/flashcard/comprehensive-subject-selector"

interface StudySession {
  currentIndex: number
  totalCards: number
  correctAnswers: number
  isComplete: boolean
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [prebuiltDecks, setPrebuiltDecks] = useState<PrebuiltDeckType[]>([])
  const [subjects, setSubjects] = useState<SubjectType[]>([])
  const [topics, setTopics] = useState<TopicType[]>([])

  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingDecks, setIsLoadingDecks] = useState(true)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [showViewer, setShowViewer] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [needsSetup, setNeedsSetup] = useState(false)
  const [activeTab, setActiveTab] = useState("prebuilt")
  const [currentDeckName, setCurrentDeckName] = useState("Deck de Estudo")

  const [customContent, setCustomContent] = useState("")
  const [numberOfCards, setNumberOfCards] = useState(10)
  const [difficulty, setDifficulty] = useState("medium")
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>()
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>()

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  useEffect(() => {
    if (!needsSetup) {
      loadPrebuiltDecks()
      loadSubjectsAndTopics()
    }
  }, [needsSetup])

  useEffect(() => {
    if (selectedSubjectId) {
      const selectedSub = subjects.find((s) => s.id === selectedSubjectId)
      setTopics(selectedSub?.flashcard_topics || [])
      setSelectedTopicId(undefined)
    } else {
      setTopics([])
    }
  }, [selectedSubjectId, subjects])

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/database/check-status")
      const data = await response.json()
      setNeedsSetup(!data.success || data.needsSetup)
    } catch (err) {
      console.error("Erro ao verificar status do banco:", err)
      setNeedsSetup(true)
      setError("Não foi possível conectar ao banco de dados. Verifique a configuração.")
    }
  }

  const loadPrebuiltDecks = async () => {
    setIsLoadingDecks(true)
    try {
      const response = await fetch("/api/flashcards/prebuilt-decks")
      const data = await response.json()
      if (data.decks) setPrebuiltDecks(data.decks)
      else setError("Não foi possível carregar decks pré-construídos.")
    } catch (err) {
      console.error("Erro ao carregar decks:", err)
      setError("Falha ao buscar decks pré-construídos.")
    } finally {
      setIsLoadingDecks(false)
    }
  }

  const loadSubjectsAndTopics = async () => {
    setIsLoadingSubjects(true)
    try {
      const response = await fetch("/api/flashcards/subjects")

      if (!response.ok) {
        const responseText = await response.text() // Tenta ler a resposta como texto
        console.error("Erro da API - Status:", response.status)
        console.error("Erro da API - Resposta Bruta (HTML/Texto):", responseText) // Loga o HTML/texto
        setError(
          `Falha ao buscar matérias. Status: ${response.status}. Início da Resposta: ${responseText.substring(0, 200)}...`, // Mostra os primeiros 200 chars
        )
        setSubjects([])
        setIsLoadingSubjects(false) // Garante que o estado de loading seja resetado
        return // Interrompe a execução aqui
      }

      const data = await response.json()
      const allSubjects: SubjectType[] = []
      if (data && typeof data === "object") {
        Object.values(data).forEach((categorySubjects: any) => {
          if (Array.isArray(categorySubjects)) {
            allSubjects.push(...categorySubjects)
          }
        })
      }
      setSubjects(allSubjects)
    } catch (err) {
      console.error("Erro ao carregar matérias e tópicos:", err)
      setError("Falha ao buscar matérias e tópicos.")
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  const generateFlashcardsAPI = async (method: string, options: any = {}) => {
    setIsGenerating(true)
    setError("")
    setSuccess("")
    setFlashcards([])

    try {
      const requestBody = {
        method,
        numberOfFlashcards: options.numberOfFlashcards || numberOfCards,
        difficulty: options.difficulty || difficulty,
        ...options,
      }

      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success && data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards)
        setSuccess(`${data.flashcards.length} flashcards gerados!`)
        setShowViewer(true)

        // Determine deck name based on method
        let deckName = "Flashcards Personalizados"
        if (options.deckId) {
          const deck = prebuiltDecks.find((d) => d.id === options.deckId)
          deckName = deck?.name || "Deck Pré-construído"
        } else if (options.subjectId && options.topicIds) {
          // For comprehensive subjects, create a descriptive name
          deckName = `Flashcards - ${options.topicIds.length} tópicos`
        } else if (options.subjectId) {
          const subject = subjects.find((s) => s.id === options.subjectId)
          deckName = subject?.name || "Matéria Selecionada"
        }

        setCurrentDeckName(deckName)
      } else {
        setError(data.error || "Nenhum flashcard gerado. Tente ajustar os parâmetros.")
        if (data.flashcards && data.flashcards.length > 0) {
          setFlashcards(data.flashcards)
          setShowViewer(true)
          setCurrentDeckName("Flashcards de Exemplo")
        }
      }
    } catch (err) {
      console.error("Erro na API de geração:", err)
      setError("Erro de conexão ao gerar flashcards. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAIGeneration = () => {
    if (!customContent.trim()) {
      setError("Por favor, insira algum conteúdo para gerar flashcards.")
      return
    }
    generateFlashcardsAPI("ai-custom", { customContent })
  }

  const handleDatabaseGeneration = () => {
    if (!selectedSubjectId) {
      setError("Por favor, selecione uma matéria.")
      return
    }
    generateFlashcardsAPI("database", {
      subjectId: selectedSubjectId,
      topicId: selectedTopicId,
    })
  }

  const handlePrebuiltDeck = (deck: PrebuiltDeckType) => {
    generateFlashcardsAPI("prebuilt", { deckId: deck.id, numberOfFlashcards: deck.total_cards })
  }

  const handleManualCreation = () => {
    setError("Criação manual ainda em desenvolvimento.")
  }

  const handleStudyComplete = (session: StudySession) => {
    setSuccess(
      `Sessão Concluída! Você acertou ${session.correctAnswers} de ${session.totalCards} (${Math.round(
        (session.correctAnswers / session.totalCards) * 100,
      )}%).`,
    )
  }

  const handleCloseViewer = () => {
    setShowViewer(false)
    setFlashcards([])
  }

  const getDifficultyStyling = (level: number) => {
    if (level <= 1) return { badge: "bg-green-100 text-studify-green", text: "Muito Fácil" }
    if (level === 2) return { badge: "bg-blue-100 text-blue-700", text: "Fácil" } // Keep some variety
    if (level === 3) return { badge: "bg-yellow-100 text-yellow-700", text: "Médio" }
    if (level === 4) return { badge: "bg-orange-100 text-orange-700", text: "Difícil" }
    return { badge: "bg-red-100 text-red-700", text: "Muito Difícil" }
  }

  if (needsSetup) {
    return (
      <DatabaseSetupWizard
        onSetupComplete={() => {
          setNeedsSetup(false)
          checkDatabaseStatus() // Re-check status and load data
        }}
      />
    )
  }

  if (showViewer) {
    return (
      <FlashcardViewer
        flashcards={flashcards}
        onComplete={handleStudyComplete}
        onClose={handleCloseViewer}
        initialDeckName={currentDeckName}
      />
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 bg-studify-white min-h-screen">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/assistente" className="hidden sm:block">
            <Button variant="outline" size="icon" className="border-studify-gray hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-studify-gray" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-studify-green">Flashcards</h1>
            <p className="text-studify-gray">Crie, estude e domine qualquer assunto.</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setNeedsSetup(true)}
          size="sm"
          className="self-start sm:self-center border-studify-gray text-studify-gray hover:bg-gray-100"
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Verificar Configuração
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && !showViewer && (
        <Alert variant="default" className="bg-green-50 border-studify-green text-studify-green">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { value: "prebuilt", label: "Decks Prontos", Icon: BookOpen },
            { value: "ai-generator", label: "Gerador IA", Icon: Brain },
            { value: "database", label: "Por Matéria", Icon: Library },
            { value: "manual", label: "Manual", Icon: PlusCircle },
          ].map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 rounded-md transition-all",
                "data-[state=active]:bg-studify-green data-[state=active]:text-studify-white data-[state=active]:shadow-lg",
                "hover:bg-studify-lightgreen hover:text-studify-green",
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="prebuilt" className="mt-6">
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-studify-green">
                <BookOpen className="h-6 w-6" /> Decks Pré-Construídos
              </CardTitle>
              <CardDescription className="text-studify-gray">
                Explore nossa seleção de decks prontos para estudo imediato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDecks ? (
                <div className="flex items-center justify-center py-10 text-studify-gray">
                  <Loader2 className="h-8 w-8 animate-spin mr-3 text-studify-green" /> Carregando decks...
                </div>
              ) : prebuiltDecks.length === 0 ? (
                <div className="text-center py-10 text-studify-gray">
                  <ListChecks className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">Nenhum deck pré-construído encontrado.</p>
                  <p className="text-sm">Verifique a configuração do banco ou adicione decks.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prebuiltDecks.map((deck) => {
                    const difficultyStyle = getDifficultyStyling(deck.difficulty_level)
                    return (
                      <Card
                        key={deck.id}
                        className="hover:shadow-xl transition-shadow duration-300 border border-gray-200 flex flex-col justify-between bg-white"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-semibold text-studify-green line-clamp-2">
                              {deck.name}
                            </CardTitle>
                            {deck.flashcard_subjects && (
                              <span
                                className="w-4 h-4 rounded-full shrink-0 ml-2 border border-gray-300"
                                style={{ backgroundColor: deck.flashcard_subjects.color || "#ccc" }}
                                title={deck.flashcard_subjects.name}
                              ></span>
                            )}
                          </div>
                          <CardDescription className="text-xs text-studify-gray line-clamp-3 h-[45px]">
                            {deck.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs text-studify-gray pt-1">
                          <div className="flex justify-between items-center">
                            <span>
                              <FileText className="inline h-3.5 w-3.5 mr-1" />
                              {deck.total_cards} cards
                            </span>
                            <span>
                              <Clock className="inline h-3.5 w-3.5 mr-1" />
                              {deck.estimated_time_minutes} min
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs px-1.5 py-0.5", difficultyStyle.badge)}>
                              {difficultyStyle.text}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0.5 border-studify-gray text-studify-gray"
                            >
                              ⭐ {deck.rating_average.toFixed(1)} ({deck.download_count})
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {deck.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5 bg-gray-100 text-studify-gray"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <div className="p-4 pt-2">
                          <Button
                            onClick={() => handlePrebuiltDeck(deck)}
                            disabled={isGenerating}
                            className="w-full bg-studify-green hover:bg-studify-lightgreen text-studify-white hover:text-studify-green"
                          >
                            {isGenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            Estudar Agora
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-generator" className="mt-6">
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-studify-green">
                <Brain className="h-6 w-6" /> Gerador com IA
              </CardTitle>
              <CardDescription className="text-studify-gray">
                Transforme qualquer texto em flashcards inteligentes com nossa IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="custom-content" className="font-medium text-studify-gray">
                  Seu Conteúdo de Estudo:
                </label>
                <Textarea
                  id="custom-content"
                  placeholder="Cole aqui o texto, anotações, ou um resumo do material que deseja transformar em flashcards..."
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  rows={8}
                  className="mt-1 border-gray-300 focus:border-studify-green focus:ring-studify-green"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="num-cards-ai" className="font-medium text-studify-gray">
                    Número de Flashcards (5-30)
                  </label>
                  <Input
                    id="num-cards-ai"
                    type="number"
                    min="5"
                    max="30"
                    value={numberOfCards}
                    onChange={(e) => setNumberOfCards(Math.max(5, Math.min(30, Number.parseInt(e.target.value) || 10)))}
                    className="mt-1 border-gray-300 focus:border-studify-green focus:ring-studify-green"
                  />
                </div>
                <div>
                  <label htmlFor="difficulty-ai" className="font-medium text-studify-gray">
                    Nível de Dificuldade
                  </label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger
                      id="difficulty-ai"
                      className="mt-1 border-gray-300 focus:border-studify-green focus:ring-studify-green"
                    >
                      <SelectValue /> <ChevronDown className="h-4 w-4 opacity-50" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleAIGeneration}
                  disabled={isGenerating || !customContent.trim()}
                  className="bg-studify-green hover:bg-studify-lightgreen text-studify-white hover:text-studify-green"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Gerar Flashcards
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-studify-green">
                <Library className="h-6 w-6" /> Por Matéria (Avançado)
              </CardTitle>
              <CardDescription className="text-studify-gray">
                Selecione matérias e tópicos específicos para criar decks personalizados com distribuição proporcional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ComprehensiveSubjectSelector
                onGenerate={(params) => {
                  generateFlashcardsAPI("database", {
                    subjectId: params.subjectId,
                    topicIds: params.topicIds,
                    topicEstimatedCards: params.topicEstimatedCards,
                    numberOfFlashcards: params.numberOfFlashcards,
                    difficulty: params.difficulty,
                  })
                }}
                isGenerating={isGenerating}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-studify-green">
                <PlusCircle className="h-6 w-6" /> Criação Manual
              </CardTitle>
              <CardDescription className="text-studify-gray">
                Crie seus próprios flashcards com total controle.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-10 text-studify-gray">
              <ListChecks className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">Em Desenvolvimento</p>
              <p className="text-sm">Esta funcionalidade estará disponível em breve!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
