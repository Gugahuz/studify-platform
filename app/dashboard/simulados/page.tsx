"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MaintenanceMessage } from "@/components/maintenance-message"

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
      <MaintenanceMessage
        title="Simulados em Manutenção"
        message="Estamos trabalhando para melhorar a experiência dos simulados com novas funcionalidades e conteúdos. Esta seção está temporariamente indisponível enquanto implementamos estas melhorias."
        showBackButton={true}
        backUrl="/dashboard"
        backText="Voltar ao Dashboard"
      />
    </div>
  )
}
