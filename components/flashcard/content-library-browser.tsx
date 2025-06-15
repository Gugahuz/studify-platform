"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  BookOpen,
  FileText,
  Lightbulb,
  Calculator,
  GraduationCap,
  CheckCircle2,
  Plus,
  Filter,
} from "lucide-react"
import type { Subject } from "@/types/flashcards"
import { useToast } from "@/components/ui/use-toast"

interface ContentItem {
  id: string
  title: string
  content: string
  content_type: string
  subject_id: string
  difficulty_level: number
  keywords: string[]
  tags: string[]
  source: string
  author: string
  usage_count: number
  flashcard_subjects: {
    name: string
    color: string
  }
  flashcard_topics?: {
    name: string
  }
}

interface ContentLibraryBrowserProps {
  onSelectContent: (content: ContentItem[]) => void
  selectedContent: ContentItem[]
}

// Mock data para quando a API não retorna dados
const mockSubjects: Subject[] = [
  {
    id: "1",
    name: "Matemática",
    category: "Exatas",
    description: "Matemática básica e avançada",
    icon: "calculator",
    color: "#3B82F6",
    flashcard_topics: [
      { id: "1", name: "Álgebra", description: "Equações e funções", difficulty_level: 2 },
      { id: "2", name: "Geometria", description: "Formas e medidas", difficulty_level: 3 },
    ],
  },
  {
    id: "2",
    name: "Física",
    category: "Exatas",
    description: "Física clássica e moderna",
    icon: "zap",
    color: "#10B981",
    flashcard_topics: [
      { id: "3", name: "Mecânica", description: "Movimento e forças", difficulty_level: 3 },
      { id: "4", name: "Termodinâmica", description: "Calor e energia", difficulty_level: 4 },
    ],
  },
]

const mockContent: ContentItem[] = [
  {
    id: "1",
    title: "Teorema de Pitágoras",
    content: "Em um triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos.",
    content_type: "theorem",
    subject_id: "1",
    difficulty_level: 2,
    keywords: ["pitágoras", "triângulo", "hipotenusa"],
    tags: ["geometria", "teorema"],
    source: "Livro de Matemática",
    author: "Euclides",
    usage_count: 150,
    flashcard_subjects: {
      name: "Matemática",
      color: "#3B82F6",
    },
    flashcard_topics: {
      name: "Geometria",
    },
  },
  {
    id: "2",
    title: "Lei de Newton",
    content: "A força resultante sobre um objeto é igual ao produto de sua massa pela aceleração.",
    content_type: "formula",
    subject_id: "2",
    difficulty_level: 3,
    keywords: ["newton", "força", "massa", "aceleração"],
    tags: ["mecânica", "lei"],
    source: "Princípios Matemáticos",
    author: "Isaac Newton",
    usage_count: 200,
    flashcard_subjects: {
      name: "Física",
      color: "#10B981",
    },
    flashcard_topics: {
      name: "Mecânica",
    },
  },
]

export default function ContentLibraryBrowser({ onSelectContent, selectedContent }: ContentLibraryBrowserProps) {
  const [content, setContent] = useState<ContentItem[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedContentType, setSelectedContentType] = useState("all")
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchContent()
  }, [selectedSubject, selectedContentType, searchQuery])

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchContent = async (offset = 0) => {
    try {
      setIsLoading(offset === 0)
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
      })

      if (selectedSubject !== "all") params.append("subjectId", selectedSubject)
      if (selectedContentType !== "all") params.append("contentType", selectedContentType)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/flashcards/content-library?${params}`)

      if (!response.ok) {
        throw new Error("Falha ao carregar conteúdo")
      }

      const data = await response.json()

      if (data.content && Array.isArray(data.content)) {
        if (offset === 0) {
          setContent(data.content)
        } else {
          setContent((prev) => [...prev, ...data.content])
        }
        setPagination(
          data.pagination || {
            total: data.content.length,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        )
      } else {
        // Fallback para dados mock
        console.log("📚 Usando dados mock para conteúdo")
        setContent(mockContent)
        setPagination({
          total: mockContent.length,
          limit: 20,
          offset: 0,
          hasMore: false,
        })
      }
    } catch (error) {
      console.error("Erro ao buscar conteúdo:", error)
      // Usar dados mock em caso de erro
      setContent(mockContent)
      setPagination({
        total: mockContent.length,
        limit: 20,
        offset: 0,
        hasMore: false,
      })
      toast({
        title: "Usando dados de exemplo",
        description: "Conecte o banco de dados para acessar o conteúdo completo.",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/flashcards/subjects")

      if (!response.ok) {
        throw new Error("Falha ao carregar matérias")
      }

      const data = await response.json()

      if (data.subjects) {
        // Converter objeto organizado por categoria em array plano
        let flatSubjects: Subject[] = []

        if (typeof data.subjects === "object" && !Array.isArray(data.subjects)) {
          // Se subjects é um objeto organizado por categoria
          Object.values(data.subjects).forEach((categorySubjects: any) => {
            if (Array.isArray(categorySubjects)) {
              flatSubjects = [...flatSubjects, ...categorySubjects]
            }
          })
        } else if (Array.isArray(data.subjects)) {
          // Se subjects já é um array
          flatSubjects = data.subjects
        }

        if (flatSubjects.length > 0) {
          setSubjects(flatSubjects)
        } else {
          throw new Error("Nenhuma matéria encontrada")
        }
      } else {
        throw new Error("Formato de dados inválido")
      }
    } catch (error) {
      console.error("Erro ao buscar matérias:", error)
      // Usar dados mock em caso de erro
      console.log("📚 Usando dados mock para matérias")
      setSubjects(mockSubjects)
    }
  }

  const handleContentToggle = (item: ContentItem) => {
    const isSelected = selectedContent.some((c) => c.id === item.id)
    if (isSelected) {
      onSelectContent(selectedContent.filter((c) => c.id !== item.id))
    } else {
      onSelectContent([...selectedContent, item])
    }
  }

  const loadMore = () => {
    fetchContent(pagination.offset + pagination.limit)
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "concept":
        return <Lightbulb className="h-4 w-4" />
      case "formula":
        return <Calculator className="h-4 w-4" />
      case "definition":
        return <BookOpen className="h-4 w-4" />
      case "theorem":
        return <GraduationCap className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      concept: "Conceito",
      formula: "Fórmula",
      definition: "Definição",
      theorem: "Teorema",
      example: "Exemplo",
    }
    return labels[type] || type
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar conteúdo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
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
        <Select value={selectedContentType} onValueChange={setSelectedContentType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="concept">Conceito</SelectItem>
            <SelectItem value="formula">Fórmula</SelectItem>
            <SelectItem value="definition">Definição</SelectItem>
            <SelectItem value="theorem">Teorema</SelectItem>
            <SelectItem value="example">Exemplo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Content Summary */}
      {selectedContent.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">
                  {selectedContent.length} item{selectedContent.length !== 1 ? "s" : ""} selecionado
                  {selectedContent.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                onClick={() => onSelectContent([])}
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-700"
              >
                Limpar Seleção
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.map((item) => {
            const isSelected = selectedContent.some((c) => c.id === item.id)
            return (
              <Card
                key={item.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-purple-500 bg-purple-50" : ""
                }`}
                onClick={() => handleContentToggle(item)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getContentTypeIcon(item.content_type)}
                      <Badge variant="outline" className="text-xs">
                        {getContentTypeLabel(item.content_type)}
                      </Badge>
                    </div>
                    <Checkbox checked={isSelected} onChange={() => handleContentToggle(item)} />
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.content}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.flashcard_subjects.color }} />
                    <span className="text-sm font-medium">{item.flashcard_subjects.name}</span>
                    {item.flashcard_topics && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{item.flashcard_topics.name}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getDifficultyColor(item.difficulty_level)}>Nível {item.difficulty_level}</Badge>
                    {item.keywords.slice(0, 3).map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {item.keywords.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.keywords.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>por {item.author}</span>
                    <span>{item.usage_count} usos</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Load More */}
      {pagination.hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Carregar Mais
          </Button>
        </div>
      )}

      {!isLoading && content.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum conteúdo encontrado</h3>
          <p className="text-gray-600">Tente ajustar os filtros ou buscar por outros termos.</p>
        </div>
      )}
    </div>
  )
}
