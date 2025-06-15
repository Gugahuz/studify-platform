"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Clock, Download, Star, Search, Filter, Sparkles, TrendingUp, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PrebuiltDeck {
  id: string
  name: string
  description: string
  subject_id: string
  category: string
  difficulty_level: number
  total_cards: number
  estimated_time_minutes: number
  tags: string[]
  author_name: string
  is_featured: boolean
  download_count: number
  rating_average: number
  rating_count: number
  created_at: string
  flashcard_subjects: {
    id: string
    name: string
    category: string
    color: string
  }
}

interface Subject {
  id: string
  name: string
  category: string
  color: string
  topics?: any[]
}

interface PrebuiltDeckGalleryProps {
  onSelectDeck: (deck: PrebuiltDeck) => void
}

export default function PrebuiltDeckGallery({ onSelectDeck }: PrebuiltDeckGalleryProps) {
  const [decks, setDecks] = useState<PrebuiltDeck[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchDecks()
    fetchSubjects()
  }, [selectedCategory, selectedSubject])

  const fetchDecks = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (selectedSubject !== "all") params.append("subjectId", selectedSubject)

      const response = await fetch(`/api/flashcards/prebuilt-decks?${params}`)
      const data = await response.json()

      if (data.decks) {
        setDecks(data.decks)
      } else {
        // Se não há decks, criar alguns dados de exemplo
        setDecks(createMockDecks())
      }
    } catch (error) {
      console.error("Error fetching decks:", error)
      // Usar dados mock em caso de erro
      setDecks(createMockDecks())
      toast({
        title: "Aviso",
        description: "Carregando decks de exemplo. Execute o script SQL para dados completos.",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/flashcards/subjects")
      const data = await response.json()

      if (data.subjects) {
        // Converter objeto organizado por categoria em array plano
        const flatSubjects: Subject[] = []
        Object.values(data.subjects).forEach((categorySubjects: any) => {
          if (Array.isArray(categorySubjects)) {
            flatSubjects.push(...categorySubjects)
          }
        })
        setSubjects(flatSubjects)
      } else {
        // Usar subjects mock se não houver dados
        setSubjects(createMockSubjects())
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
      setSubjects(createMockSubjects())
    }
  }

  const createMockSubjects = (): Subject[] => [
    { id: "math", name: "Matemática", category: "Exatas", color: "#3B82F6" },
    { id: "physics", name: "Física", category: "Exatas", color: "#10B981" },
    { id: "chemistry", name: "Química", category: "Exatas", color: "#F59E0B" },
    { id: "biology", name: "Biologia", category: "Biológicas", color: "#EF4444" },
    { id: "history", name: "História", category: "Humanas", color: "#8B5CF6" },
    { id: "geography", name: "Geografia", category: "Humanas", color: "#06B6D4" },
  ]

  const createMockDecks = (): PrebuiltDeck[] => [
    {
      id: "deck-1",
      name: "Matemática Básica - ENEM",
      description: "Conceitos fundamentais de matemática para o ENEM, incluindo álgebra, geometria e estatística.",
      subject_id: "math",
      category: "featured",
      difficulty_level: 3,
      total_cards: 50,
      estimated_time_minutes: 45,
      tags: ["ENEM", "Matemática", "Básico"],
      author_name: "Prof. Silva",
      is_featured: true,
      download_count: 1250,
      rating_average: 4.8,
      rating_count: 89,
      created_at: "2024-01-15",
      flashcard_subjects: {
        id: "math",
        name: "Matemática",
        category: "Exatas",
        color: "#3B82F6",
      },
    },
    {
      id: "deck-2",
      name: "Física - Mecânica",
      description: "Leis de Newton, cinemática, dinâmica e energia mecânica com exercícios práticos.",
      subject_id: "physics",
      category: "popular",
      difficulty_level: 4,
      total_cards: 35,
      estimated_time_minutes: 30,
      tags: ["Física", "Mecânica", "Newton"],
      author_name: "Prof. Santos",
      is_featured: false,
      download_count: 890,
      rating_average: 4.6,
      rating_count: 67,
      created_at: "2024-01-10",
      flashcard_subjects: {
        id: "physics",
        name: "Física",
        category: "Exatas",
        color: "#10B981",
      },
    },
    {
      id: "deck-3",
      name: "Química Orgânica",
      description: "Funções orgânicas, nomenclatura, isomeria e reações químicas fundamentais.",
      subject_id: "chemistry",
      category: "new",
      difficulty_level: 5,
      total_cards: 40,
      estimated_time_minutes: 35,
      tags: ["Química", "Orgânica", "Reações"],
      author_name: "Prof. Costa",
      is_featured: false,
      download_count: 456,
      rating_average: 4.4,
      rating_count: 23,
      created_at: "2024-01-20",
      flashcard_subjects: {
        id: "chemistry",
        name: "Química",
        category: "Exatas",
        color: "#F59E0B",
      },
    },
  ]

  const filteredDecks = decks.filter(
    (deck) =>
      searchQuery === "" ||
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

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
    const labels = ["", "Muito Fácil", "Fácil", "Médio", "Difícil", "Muito Difícil"]
    return labels[level] || "Indefinido"
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "featured":
        return <Sparkles className="h-4 w-4" />
      case "popular":
        return <TrendingUp className="h-4 w-4" />
      case "new":
        return <Calendar className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "featured":
        return "Destaque"
      case "popular":
        return "Popular"
      case "new":
        return "Novo"
      case "community":
        return "Comunidade"
      default:
        return category
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            <SelectItem value="featured">Destaque</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="new">Novo</SelectItem>
            <SelectItem value="community">Comunidade</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full sm:w-48">
            <BookOpen className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Matéria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Matérias</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  {subject.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deck Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-80">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <Card
              key={deck.id}
              className="h-80 hover:shadow-lg transition-shadow cursor-pointer group relative overflow-hidden"
              onClick={() => onSelectDeck(deck)}
            >
              {deck.is_featured && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Destaque
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {getCategoryIcon(deck.category)}
                    <span>{getCategoryLabel(deck.category)}</span>
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-purple-600 transition-colors line-clamp-2">
                  {deck.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">{deck.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: deck.flashcard_subjects.color }} />
                  <span className="text-sm font-medium">{deck.flashcard_subjects.name}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={getDifficultyColor(deck.difficulty_level)}>
                    {getDifficultyLabel(deck.difficulty_level)}
                  </Badge>
                  {deck.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {deck.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{deck.tags.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{deck.total_cards} cards</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{deck.estimated_time_minutes}min</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{deck.download_count}</span>
                    </div>
                    {deck.rating_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{deck.rating_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">por {deck.author_name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredDecks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum deck encontrado</h3>
          <p className="text-gray-600">Tente ajustar os filtros ou buscar por outros termos.</p>
        </div>
      )}
    </div>
  )
}
