"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, BookOpen, History, Play } from "lucide-react"
import { MOCK_EXAM_TEMPLATES, type MockExamTemplate } from "@/lib/mock-exam-data"

interface SimpleMockExamDashboardProps {
  onSelectTemplate: (template: MockExamTemplate) => void
  onViewHistory: () => void
}

export function SimpleMockExamDashboard({ onSelectTemplate, onViewHistory }: SimpleMockExamDashboardProps) {
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "bg-green-100 text-green-800"
    if (difficulty <= 3) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return "Fácil"
    if (difficulty <= 3) return "Médio"
    return "Difícil"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "enem":
        return "bg-blue-100 text-blue-800"
      case "vestibular":
        return "bg-purple-100 text-purple-800"
      case "concurso":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Simulados</h1>
            <p className="text-gray-600">Teste seus conhecimentos com nossos simulados</p>
          </div>
          <Button variant="outline" onClick={onViewHistory}>
            <History className="h-4 w-4 mr-2" />
            Ver Histórico
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_EXAM_TEMPLATES.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{template.title}</CardTitle>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryColor(template.category)}>{template.category.toUpperCase()}</Badge>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {getDifficultyLabel(template.difficulty)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>{template.totalQuestions} questões</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{template.timeLimit} minutos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>Nota mínima: {template.passingScore}%</span>
                  </div>
                </div>

                <Button className="w-full" onClick={() => onSelectTemplate(template)}>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Simulado
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Como funciona?</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Escolha um simulado, responda as questões dentro do tempo limite e receba um feedback detalhado com
                  explicações para cada questão. Acompanhe seu progresso no histórico.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
