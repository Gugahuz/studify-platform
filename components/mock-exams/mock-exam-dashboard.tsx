"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Users, Star, Search, History, TrendingUp, Target, Award } from "lucide-react"
import type { MockExamTemplate } from "@/types/mock-exams"

interface MockExamDashboardProps {
  onSelectTemplate: (template: MockExamTemplate) => void
  onViewHistory: () => void
}

interface DashboardStats {
  availableExams: number
  activeParticipants: string
  averageRating: number
}

const subjectFilters = [
  { id: "todos", name: "Todos", count: 8 },
  { id: "enem", name: "ENEM", count: 1 },
  { id: "portugues", name: "Português", count: 1 },
  { id: "matematica", name: "Matemática", count: 1 },
  { id: "fisica", name: "Física", count: 1 },
  { id: "quimica", name: "Química", count: 1 },
  { id: "historia", name: "História", count: 1 },
  { id: "geografia", name: "Geografia", count: 1 },
  { id: "biologia", name: "Biologia", count: 1 },
]

export function MockExamDashboard({ onSelectTemplate, onViewHistory }: MockExamDashboardProps) {
  const [templates, setTemplates] = useState<MockExamTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("todos")
  const [sortBy, setSortBy] = useState("popular")
  const [stats, setStats] = useState<DashboardStats>({
    availableExams: 8,
    activeParticipants: "67K+",
    averageRating: 4.6,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/mock-exams/templates")
      const result = await response.json()

      if (result.success) {
        setTemplates(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates
    .filter((template) => {
      const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = selectedSubject === "todos" || template.category === selectedSubject
      return matchesSearch && matchesSubject
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.is_featured ? 1 : -1
        case "rating":
          return 0 // Would sort by rating if available
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  const getDifficultyLabel = (level: number) => {
    if (level <= 2) return "Básico"
    if (level <= 3) return "Intermediário"
    return "Avançado"
  }

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return "bg-green-100 text-green-800"
    if (level <= 3) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getSubjectIcon = (category: string) => {
    switch (category) {
      case "enem":
        return "🎯"
      case "portugues":
        return "📚"
      case "matematica":
        return "🔢"
      case "fisica":
        return "⚛️"
      case "quimica":
        return "🧪"
      case "historia":
        return "🏛️"
      case "geografia":
        return "🌍"
      case "biologia":
        return "🧬"
      default:
        return "📖"
    }
  }

  const formatParticipants = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Templates Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Simulados</h1>
              <p className="text-gray-600">Pratique com simulados reais e melhore seu desempenho</p>
            </div>
          </div>
          <Button variant="outline" onClick={onViewHistory} className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Ver Histórico
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-700">Simulados Disponíveis</p>
                  <p className="text-3xl font-bold text-green-900">{stats.availableExams}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700">Participantes Ativos</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.activeParticipants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-700">Avaliação Média</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.averageRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar simulados por título ou matéria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Mais Popular</SelectItem>
                <SelectItem value="rating">Melhor Avaliado</SelectItem>
                <SelectItem value="recent">Mais Recente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {subjectFilters.map((subject) => (
              <Button
                key={subject.id}
                variant={selectedSubject === subject.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubject(subject.id)}
                className="flex items-center gap-2"
              >
                {subject.name}
                <Badge variant="secondary" className="ml-1">
                  {subject.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Mock Exam Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSubjectIcon(template.category)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {template.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                        </Badge>
                        <Badge className={getDifficultyColor(template.difficulty_level)}>
                          {getDifficultyLabel(template.difficulty_level)}
                        </Badge>
                        {template.is_featured && <Badge className="bg-orange-100 text-orange-800">Popular</Badge>}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span>{template.total_questions} questões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span>{template.time_limit_minutes} min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{formatParticipants(Math.floor(Math.random() * 20000) + 5000)} participantes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{(4.0 + Math.random() * 1).toFixed(1)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => onSelectTemplate(template)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Iniciar Simulado
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum simulado encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou termos de busca.</p>
          </div>
        )}
      </div>
    </div>
  )
}
