"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users, BookOpen, Search, Star, TrendingUp, History } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Mock data for practice tests
const practiceTests = [
  {
    id: 1,
    title: "ENEM 2023 - Simulado Completo",
    subject: "Multidisciplinar",
    category: "enem",
    questions: 180,
    duration: 330,
    difficulty: "Avançado",
    participants: 15420,
    rating: 4.8,
    description: "Simulado completo baseado no ENEM 2023 com questões de todas as áreas do conhecimento.",
    popular: true,
  },
  {
    id: 2,
    title: "Português - Interpretação de Texto",
    subject: "Português",
    category: "portugues",
    questions: 25,
    duration: 45,
    difficulty: "Intermediário",
    participants: 8930,
    rating: 4.6,
    description: "Foque na interpretação de textos com questões do ENEM e vestibulares.",
  },
  {
    id: 3,
    title: "Matemática - Funções e Geometria",
    subject: "Matemática",
    category: "matematica",
    questions: 30,
    duration: 60,
    difficulty: "Avançado",
    participants: 12150,
    rating: 4.7,
    description: "Questões avançadas de funções, geometria plana e espacial.",
  },
  {
    id: 4,
    title: "Física - Mecânica Clássica",
    subject: "Física",
    category: "fisica",
    questions: 20,
    duration: 50,
    difficulty: "Intermediário",
    participants: 6780,
    rating: 4.5,
    description: "Conceitos fundamentais de cinemática, dinâmica e estática.",
  },
  {
    id: 5,
    title: "Química - Química Orgânica",
    subject: "Química",
    category: "quimica",
    questions: 25,
    duration: 55,
    difficulty: "Avançado",
    participants: 5420,
    rating: 4.4,
    description: "Estruturas orgânicas, reações e nomenclatura.",
  },
  {
    id: 6,
    title: "História do Brasil - República",
    subject: "História",
    category: "historia",
    questions: 20,
    duration: 40,
    difficulty: "Intermediário",
    participants: 7890,
    rating: 4.6,
    description: "Período republicano brasileiro: da Proclamação aos dias atuais.",
  },
  {
    id: 7,
    title: "Geografia - Geopolítica Mundial",
    subject: "Geografia",
    category: "geografia",
    questions: 22,
    duration: 45,
    difficulty: "Intermediário",
    participants: 6540,
    rating: 4.3,
    description: "Relações internacionais, blocos econômicos e conflitos mundiais.",
  },
  {
    id: 8,
    title: "Biologia - Genética e Evolução",
    subject: "Biologia",
    category: "biologia",
    questions: 28,
    duration: 50,
    difficulty: "Avançado",
    participants: 9870,
    rating: 4.7,
    description: "Leis de Mendel, evolução das espécies e biotecnologia.",
  },
]

const subjects = [
  { id: "todos", name: "Todos", count: practiceTests.length },
  { id: "enem", name: "ENEM", count: practiceTests.filter((t) => t.category === "enem").length },
  { id: "portugues", name: "Português", count: practiceTests.filter((t) => t.category === "portugues").length },
  { id: "matematica", name: "Matemática", count: practiceTests.filter((t) => t.category === "matematica").length },
  { id: "fisica", name: "Física", count: practiceTests.filter((t) => t.category === "fisica").length },
  { id: "quimica", name: "Química", count: practiceTests.filter((t) => t.category === "quimica").length },
  { id: "historia", name: "História", count: practiceTests.filter((t) => t.category === "historia").length },
  { id: "geografia", name: "Geografia", count: practiceTests.filter((t) => t.category === "geografia").length },
  { id: "biologia", name: "Biologia", count: practiceTests.filter((t) => t.category === "biologia").length },
]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Básico":
      return "bg-green-100 text-green-800"
    case "Intermediário":
      return "bg-yellow-100 text-yellow-800"
    case "Avançado":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getSubjectIcon = (subject: string) => {
  switch (subject.toLowerCase()) {
    case "multidisciplinar":
      return "🎯"
    case "português":
      return "📚"
    case "matemática":
      return "🔢"
    case "física":
      return "⚛️"
    case "química":
      return "🧪"
    case "história":
      return "🏛️"
    case "geografia":
      return "🌍"
    case "biologia":
      return "🧬"
    default:
      return "📖"
  }
}

export default function SimuladosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("todos")
  const [sortBy, setSortBy] = useState("popular")
  const router = useRouter()

  const filteredTests = practiceTests
    .filter((test) => {
      const matchesSearch =
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = selectedSubject === "todos" || test.category === selectedSubject
      return matchesSearch && matchesSubject
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.participants - a.participants
        case "rating":
          return b.rating - a.rating
        case "recent":
          return b.id - a.id
        default:
          return 0
      }
    })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Simulados</h1>
              <p className="text-gray-600">Pratique com simulados reais e melhore seu desempenho</p>
            </div>
          </div>
          <Link href="/dashboard/simulados/historico">
            <Button variant="outline" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Ver Histórico
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Simulados Disponíveis</p>
                  <p className="text-2xl font-bold text-gray-900">{practiceTests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participantes Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">67K+</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avaliação Média</p>
                  <p className="text-2xl font-bold text-gray-900">4.6</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar simulados por título ou matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">Mais Popular</option>
              <option value="rating">Melhor Avaliado</option>
              <option value="recent">Mais Recente</option>
            </select>
          </div>
        </div>

        {/* Subject Tabs */}
        <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9 h-auto p-1">
            {subjects.map((subject) => (
              <TabsTrigger
                key={subject.id}
                value={subject.id}
                className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                {subject.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {subject.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Practice Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow duration-200 relative">
            {test.popular && (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-orange-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getSubjectIcon(test.subject)}</div>
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight mb-2">{test.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {test.subject}
                    </Badge>
                    <Badge className={`text-xs ${getDifficultyColor(test.difficulty)}`}>{test.difficulty}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-4 line-clamp-2">{test.description}</CardDescription>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{test.questions} questões</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{test.duration} min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{test.participants.toLocaleString()} participantes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{test.rating}</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  size="sm"
                  onClick={() => router.push(`/dashboard/simulados/${test.id}`)}
                >
                  Iniciar Simulado
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum simulado encontrado</h3>
          <p className="text-gray-600 mb-4">Tente ajustar seus filtros ou termo de busca para encontrar simulados.</p>
          <Button
            onClick={() => {
              setSearchTerm("")
              setSelectedSubject("todos")
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  )
}
