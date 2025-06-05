"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MessageSquare, Camera, CreditCard, FileText, RefreshCw, Quote, PenTool, FileQuestion } from "lucide-react"

export default function AssistentePage() {
  const router = useRouter()

  const features = [
    {
      id: "falar-com-studo",
      title: "Falar com Studo",
      description: "Converse com nosso assistente de IA",
      icon: MessageSquare,
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      iconColor: "text-green-600",
      route: "/dashboard/assistente/chat",
    },
    {
      id: "resolver-questoes",
      title: "Resolver Questões por fotos",
      description: "Tire foto de questões e receba soluções",
      icon: Camera,
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconColor: "text-blue-600",
      route: "/dashboard/assistente/resolver-questoes",
    },
    {
      id: "gerar-flashcards",
      title: "Gerar Flashcards",
      description: "Crie flashcards automaticamente",
      icon: CreditCard,
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      iconColor: "text-purple-600",
      route: "/dashboard/assistente/flashcards",
    },
    {
      id: "gerador-referencias",
      title: "Gerador de referências",
      description: "Gere referências bibliográficas",
      icon: FileText,
      color: "bg-orange-50 hover:bg-orange-100 border-orange-200",
      iconColor: "text-orange-600",
      route: "/dashboard/assistente/referencias",
    },
    {
      id: "parafraseador",
      title: "Parafraseador",
      description: "Reescreva textos de forma inteligente",
      icon: RefreshCw,
      color: "bg-teal-50 hover:bg-teal-100 border-teal-200",
      iconColor: "text-teal-600",
      route: "/dashboard/assistente/parafraseador",
    },
    {
      id: "extrator-citacoes",
      title: "Extrator de citações",
      description: "Extraia citações importantes",
      icon: Quote,
      color: "bg-pink-50 hover:bg-pink-100 border-pink-200",
      iconColor: "text-pink-600",
      route: "/dashboard/assistente/citacoes",
    },
    {
      id: "professor-redacao",
      title: "Professor de redação",
      description: "Melhore suas habilidades de escrita",
      icon: PenTool,
      color: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
      iconColor: "text-indigo-600",
      route: "/dashboard/assistente/redacao",
    },
    {
      id: "simulados",
      title: "Simulados",
      description: "Pratique com simulados personalizados",
      icon: FileQuestion,
      color: "bg-red-50 hover:bg-red-100 border-red-200",
      iconColor: "text-red-600",
      route: "/dashboard/assistente/simulados",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assistente de Estudos</h1>
        <p className="text-gray-600">Tire suas dúvidas e receba explicações personalizadas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const IconComponent = feature.icon
          return (
            <Card
              key={feature.id}
              className={`${feature.color} border-2 transition-all duration-200 hover:shadow-lg cursor-pointer group`}
              onClick={() => router.push(feature.route)}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <IconComponent className={`h-8 w-8 ${feature.iconColor}`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-white/80 hover:bg-white border-gray-200 text-gray-700 hover:text-gray-900"
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
