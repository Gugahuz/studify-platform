"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronDown,
  ChevronRight,
  Search,
  BookOpen,
  Users,
  Calculator,
  Atom,
  Scale,
  Code,
  Database,
  Smile,
  Activity,
  AlertTriangle,
  Scan,
  TrendingUp,
  Layers,
  Shield,
  User,
  AlertCircle,
  Loader2,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ComprehensiveTopic {
  id: string
  name: string
  description: string
  estimated_cards: number
}

interface ComprehensiveSubject {
  id: string
  name: string
  category: string
  description: string
  icon: string
  color: string
  topicCount: number
  totalEstimatedCards: number
  topics: ComprehensiveTopic[]
}

interface ComprehensiveSubjectSelectorProps {
  onGenerate: (params: {
    subjectId: string
    subjectName: string
    topicIds: string[]
    topicEstimatedCards: { [key: string]: number }
    numberOfFlashcards: number
    difficulty: string
  }) => void
  isGenerating: boolean
}

const iconMap: { [key: string]: any } = {
  Calculator,
  BookOpen,
  Users,
  Atom,
  Scale,
  Code,
  Database,
  Smile,
  Activity,
  AlertTriangle,
  Scan,
  TrendingUp,
  Layers,
  Shield,
  User,
  AlertCircle,
}

export default function ComprehensiveSubjectSelector({ onGenerate, isGenerating }: ComprehensiveSubjectSelectorProps) {
  const [subjects, setSubjects] = useState<{ [category: string]: ComprehensiveSubject[] }>({})
  const [categories, setCategories] = useState<string[]>([])
  const [selectedSubject, setSelectedSubject] = useState<ComprehensiveSubject | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [numberOfFlashcards, setNumberOfFlashcards] = useState(20)
  const [difficulty, setDifficulty] = useState("medium")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/flashcards/comprehensive-subjects")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSubjects(data.subjects)
        setCategories(data.categories)
        // Expand first category by default
        if (data.categories.length > 0) {
          setExpandedCategories(new Set([data.categories[0]]))
        }
      } else {
        console.error("API returned error:", data.error)
      }
    } catch (error) {
      console.error("Error loading subjects:", error)
      // You could add a toast notification here or set an error state
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const selectSubject = (subject: ComprehensiveSubject) => {
    setSelectedSubject(subject)
    setSelectedTopics(new Set())
  }

  const toggleTopic = (topicId: string) => {
    const newSelected = new Set(selectedTopics)
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId)
    } else {
      newSelected.add(topicId)
    }
    setSelectedTopics(newSelected)
  }

  const selectAllTopics = () => {
    if (!selectedSubject) return
    setSelectedTopics(new Set(selectedSubject.topics.map((t) => t.id)))
  }

  const clearAllTopics = () => {
    setSelectedTopics(new Set())
  }

  const handleGenerate = () => {
    if (!selectedSubject || selectedTopics.size === 0) return

    const topicEstimatedCards: { [key: string]: number } = {}
    selectedSubject.topics.forEach((topic) => {
      if (selectedTopics.has(topic.id)) {
        topicEstimatedCards[topic.id] = topic.estimated_cards
      }
    })

    onGenerate({
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name, // Add this line
      topicIds: Array.from(selectedTopics),
      topicEstimatedCards,
      numberOfFlashcards,
      difficulty,
    })
  }

  const getEstimatedDistribution = () => {
    if (!selectedSubject || selectedTopics.size === 0) return []

    const selectedTopicData = selectedSubject.topics.filter((t) => selectedTopics.has(t.id))
    const totalEstimated = selectedTopicData.reduce((sum, topic) => sum + topic.estimated_cards, 0)

    return selectedTopicData.map((topic) => {
      const proportion = topic.estimated_cards / totalEstimated
      const estimatedCards = Math.max(1, Math.round(numberOfFlashcards * proportion))
      return { ...topic, estimatedCards }
    })
  }

  const filteredSubjects = Object.entries(subjects).reduce(
    (acc, [category, categorySubjects]) => {
      const filtered = categorySubjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      if (filtered.length > 0) {
        acc[category] = filtered
      }
      return acc
    },
    {} as { [category: string]: ComprehensiveSubject[] },
  )

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mr-3 text-studify-green" />
          <span>Carregando matérias...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Subject Selection */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Selecionar Matéria
          </CardTitle>
          <CardDescription>Escolha uma matéria para ver os tópicos disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar matérias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {Object.entries(filteredSubjects).map(([category, categorySubjects]) => (
                  <div key={category}>
                    <Button
                      variant="ghost"
                      onClick={() => toggleCategory(category)}
                      className="w-full justify-between p-2 h-auto"
                    >
                      <span className="font-medium">{category}</span>
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {expandedCategories.has(category) && (
                      <div className="ml-4 space-y-1">
                        {categorySubjects.map((subject) => {
                          const IconComponent = iconMap[subject.icon] || BookOpen
                          return (
                            <Button
                              key={subject.id}
                              variant={selectedSubject?.id === subject.id ? "default" : "ghost"}
                              onClick={() => selectSubject(subject)}
                              className={cn(
                                "w-full justify-start p-3 h-auto text-left",
                                selectedSubject?.id === subject.id && "bg-studify-green text-white",
                              )}
                            >
                              <div className="flex items-start gap-3 w-full">
                                <div
                                  className="p-1.5 rounded-md shrink-0"
                                  style={{ backgroundColor: subject.color + "20" }}
                                >
                                  <IconComponent className="h-4 w-4" style={{ color: subject.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{subject.name}</div>
                                  <div className="text-xs opacity-70 line-clamp-2">{subject.description}</div>
                                  <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {subject.topicCount} tópicos
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </Button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Topic Selection and Configuration */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {selectedSubject ? `Tópicos - ${selectedSubject.name}` : "Selecione uma Matéria"}
          </CardTitle>
          {selectedSubject && <CardDescription>Escolha os tópicos que deseja incluir no seu deck</CardDescription>}
        </CardHeader>
        <CardContent>
          {selectedSubject ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllTopics}
                    disabled={selectedTopics.size === selectedSubject.topics.length}
                  >
                    Selecionar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllTopics} disabled={selectedTopics.size === 0}>
                    Limpar Seleção
                  </Button>
                </div>
                <Badge variant="secondary">
                  {selectedTopics.size} de {selectedSubject.topics.length} selecionados
                </Badge>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {selectedSubject.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                        selectedTopics.has(topic.id)
                          ? "border-studify-green bg-studify-green/5"
                          : "border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <Checkbox
                        checked={selectedTopics.has(topic.id)}
                        onCheckedChange={() => toggleTopic(topic.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTopic(topic.id)}>
                        <div className="font-medium text-sm">{topic.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{topic.description}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            ~{topic.estimated_cards} cards
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="num-cards">Número de Flashcards (5-40)</Label>
                  <Input
                    id="num-cards"
                    type="number"
                    min="5"
                    max="40"
                    value={numberOfFlashcards}
                    onChange={(e) =>
                      setNumberOfFlashcards(Math.max(5, Math.min(40, Number.parseInt(e.target.value) || 20)))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                      <SelectItem value="random">Aleatório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTopics.size > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium mb-2">Distribuição Estimada:</div>
                  <div className="space-y-1">
                    {getEstimatedDistribution().map((topic) => (
                      <div key={topic.id} className="flex justify-between text-xs">
                        <span>{topic.name}</span>
                        <span className="font-medium">~{topic.estimatedCards} cards</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedTopics.size === 0}
                className="w-full bg-studify-green hover:bg-studify-lightgreen text-white"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Gerar Flashcards ({selectedTopics.size} tópicos)
              </Button>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecione uma matéria para ver os tópicos disponíveis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
