"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Star, BookOpen, Search, Filter, AlertCircle } from "lucide-react"
import type { MockExamTemplate } from "@/types/mock-exams"

interface MockExamGalleryProps {
  onStartExam: (template: MockExamTemplate) => void
}

export function MockExamGallery({ onStartExam }: MockExamGalleryProps) {
  const [templates, setTemplates] = useState<MockExamTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")

  useEffect(() => {
    fetchTemplates()
  }, [selectedCategory, selectedDifficulty])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (selectedDifficulty !== "all") params.append("difficulty", selectedDifficulty)
      params.append("featured", "true")

      console.log("🔍 Fetching templates with params:", params.toString())

      const response = await fetch(`/api/mock-exams/templates?${params}`)

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ API Error:", response.status, errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      // Check content type
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("❌ Non-JSON response:", responseText)
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()
      console.log("📊 API Response:", data)

      // Handle different response formats
      let templatesArray: MockExamTemplate[] = []

      if (data.success === true) {
        // New API format
        if (Array.isArray(data.templates)) {
          templatesArray = data.templates
        } else if (Array.isArray(data.data)) {
          templatesArray = data.data
        }
      } else if (data.success === false) {
        // API returned error
        console.error("❌ API returned error:", data.error, data.details)
        throw new Error(data.error || "Failed to fetch templates")
      } else if (Array.isArray(data)) {
        // Direct array response
        templatesArray = data
      }

      console.log(`✅ Templates processed: ${templatesArray.length}`)
      setTemplates(templatesArray)
    } catch (error: any) {
      console.error("❌ Error fetching templates:", error)
      setError(error.message || "Failed to fetch templates")
      setTemplates([]) // Ensure templates is always an array
    } finally {
      setLoading(false)
    }
  }

  // Safe filtering with null checks
  const filteredTemplates = templates.filter((template) => {
    if (!template) return false

    const matchesSearch =
      !searchTerm ||
      (template.title && template.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

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
    switch (level) {
      case 1:
        return "Muito Fácil"
      case 2:
        return "Fácil"
      case 3:
        return "Médio"
      case 4:
        return "Difícil"
      case 5:
        return "Muito Difícil"
      default:
        return "Médio"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "enem":
        return "🎯"
      case "vestibular":
        return "🎓"
      case "concurso":
        return "📋"
      case "fundamental":
        return "📚"
      case "medio":
        return "📖"
      case "superior":
        return "🏛️"
      default:
        return "📝"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar simulados</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchTemplates} variant="outline">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar simulados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="enem">ENEM</SelectItem>
              <SelectItem value="vestibular">Vestibular</SelectItem>
              <SelectItem value="concurso">Concurso</SelectItem>
              <SelectItem value="fundamental">Fundamental</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="superior">Superior</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="1">Muito Fácil</SelectItem>
              <SelectItem value="2">Fácil</SelectItem>
              <SelectItem value="3">Médio</SelectItem>
              <SelectItem value="4">Difícil</SelectItem>
              <SelectItem value="5">Muito Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Debug Info */}
      <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
        📊 Templates carregados: {templates.length} | Filtrados: {filteredTemplates.length}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? "Nenhum simulado encontrado" : "Nenhum simulado disponível"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Tente ajustar os filtros ou termo de busca"
                : "Execute os scripts SQL para criar templates de exemplo"}
            </p>
            {templates.length === 0 && (
              <Button onClick={fetchTemplates} variant="outline" className="mt-4">
                Recarregar
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(template.category || "general")}</span>
                    <Badge variant="outline" className="text-xs">
                      {(template.category || "GERAL").toUpperCase()}
                    </Badge>
                  </div>
                  {template.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                </div>
                <CardTitle className="text-lg leading-tight">{template.title || "Sem título"}</CardTitle>
                {template.description && <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>{template.total_questions || 0} questões</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{template.time_limit_minutes || 60}min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={getDifficultyColor(template.difficulty_level || 3)}>
                    {getDifficultyLabel(template.difficulty_level || 3)}
                  </Badge>
                  <div className="text-sm text-gray-600">Meta: {template.passing_score || 60}%</div>
                </div>

                {template.flashcard_subjects && (
                  <div className="text-xs text-gray-500">📚 {template.flashcard_subjects.name}</div>
                )}

                <Button onClick={() => onStartExam(template)} className="w-full" size="sm">
                  Iniciar Simulado
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
