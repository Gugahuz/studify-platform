"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Clock, ArrowRight } from "lucide-react"
import { useEvents, eventEmitter, type Event } from "@/hooks/use-events"

type DailySuggestion = {
  date: string
  suggestion: {
    title: string
    description: string
    time: string
    materials: string[]
  }
}

export function StudySuggestion() {
  const { events } = useEvents()
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [dailySuggestion, setDailySuggestion] = useState<DailySuggestion | null>(null)

  // Carregar histórico do chat
  useEffect(() => {
    const loadChatHistory = () => {
      const savedMessages = sessionStorage.getItem("chat-messages")
      if (savedMessages) {
        try {
          const parsedHistory = JSON.parse(savedMessages)
          setChatHistory(Array.isArray(parsedHistory) ? parsedHistory : [])
          return Array.isArray(parsedHistory) ? parsedHistory : []
        } catch (error) {
          console.error("Error loading chat history:", error)
          return []
        }
      }
      return []
    }

    loadChatHistory()
  }, [])

  // Escutar mudanças nos eventos em tempo real
  useEffect(() => {
    const handleEventsUpdate = (updatedEvents: any) => {
      console.log("📅 Eventos atualizados, regenerando sugestão:", updatedEvents)

      // Garantir que updatedEvents seja um array
      const eventsArray = Array.isArray(updatedEvents) ? updatedEvents : []
      generateAndSetSuggestion(eventsArray, chatHistory)
    }

    eventEmitter.on("eventsUpdated", handleEventsUpdate)
    eventEmitter.on("eventAdded", handleEventsUpdate)

    return () => {
      eventEmitter.off("eventsUpdated", handleEventsUpdate)
      eventEmitter.off("eventAdded", handleEventsUpdate)
    }
  }, [chatHistory])

  // Gerar sugestão quando eventos ou chat mudam
  useEffect(() => {
    const eventsArray = Array.isArray(events) ? events : []
    const chatArray = Array.isArray(chatHistory) ? chatHistory : []
    generateAndSetSuggestion(eventsArray, chatArray)
  }, [events, chatHistory])

  const generateAndSetSuggestion = (currentEvents: Event[], currentChatHistory: any[]) => {
    // Garantir que os parâmetros sejam arrays
    const safeEvents = Array.isArray(currentEvents) ? currentEvents : []
    const safeChatHistory = Array.isArray(currentChatHistory) ? currentChatHistory : []

    const today = new Date().toDateString()
    const newSuggestion = generateSuggestion(safeEvents, safeChatHistory)

    const dailySuggestionData: DailySuggestion = {
      date: today,
      suggestion: newSuggestion,
    }

    setDailySuggestion(dailySuggestionData)
    localStorage.setItem("daily_suggestion", JSON.stringify(dailySuggestionData))
  }

  const getDaysUntilEvent = (eventDateStr: string) => {
    const eventDate = new Date(eventDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)

    const diffTime = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUpcomingExam = (currentEvents: Event[]) => {
    // Garantir que currentEvents seja um array
    if (!Array.isArray(currentEvents) || currentEvents.length === 0) return null

    const exams = currentEvents.filter((event) => event.type === "prova")
    if (exams.length === 0) return null

    // Ordenar por data e pegar o mais próximo
    const sortedExams = exams.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

    for (const exam of sortedExams) {
      const daysUntil = getDaysUntilEvent(exam.event_date)
      if (daysUntil >= 0 && daysUntil <= 7) {
        return { ...exam, daysUntil }
      }
    }
    return null
  }

  const getUpcomingDelivery = (currentEvents: Event[]) => {
    // Garantir que currentEvents seja um array
    if (!Array.isArray(currentEvents) || currentEvents.length === 0) return null

    const deliveries = currentEvents.filter((event) => event.type === "entrega")
    if (deliveries.length === 0) return null

    // Ordenar por data e pegar o mais próximo
    const sortedDeliveries = deliveries.sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
    )

    for (const delivery of sortedDeliveries) {
      const daysUntil = getDaysUntilEvent(delivery.event_date)
      if (daysUntil >= 0 && daysUntil <= 5) {
        return { ...delivery, daysUntil }
      }
    }
    return null
  }

  const extractSubjectFromTitle = (title: string) => {
    if (!title || typeof title !== "string") return null

    const titleLower = title.toLowerCase()

    // Detecção mais abrangente de matérias
    if (titleLower.includes("matemática") || titleLower.includes("matematica") || titleLower.includes("math"))
      return "Matemática"
    if (titleLower.includes("física") || titleLower.includes("fisica") || titleLower.includes("physics"))
      return "Física"
    if (titleLower.includes("química") || titleLower.includes("quimica") || titleLower.includes("chemistry"))
      return "Química"
    if (titleLower.includes("biologia") || titleLower.includes("biology")) return "Biologia"
    if (titleLower.includes("história") || titleLower.includes("historia") || titleLower.includes("history"))
      return "História"
    if (titleLower.includes("geografia") || titleLower.includes("geography")) return "Geografia"
    if (
      titleLower.includes("português") ||
      titleLower.includes("portugues") ||
      titleLower.includes("redação") ||
      titleLower.includes("redacao")
    )
      return "Português"
    if (titleLower.includes("inglês") || titleLower.includes("ingles") || titleLower.includes("english"))
      return "Inglês"
    if (titleLower.includes("espanhol") || titleLower.includes("spanish")) return "Espanhol"
    if (titleLower.includes("literatura")) return "Literatura"
    if (titleLower.includes("filosofia")) return "Filosofia"
    if (titleLower.includes("sociologia")) return "Sociologia"

    return null
  }

  const getSubjectFromChatHistory = (currentChatHistory: any[]) => {
    // Garantir que currentChatHistory seja um array
    if (!Array.isArray(currentChatHistory) || currentChatHistory.length === 0) return null

    // Procurar por mensagens recentes do usuário que possam conter nomes de matérias
    const userMessages = currentChatHistory.filter((msg) => msg && msg.role === "user")
    const recentMessages = userMessages.slice(-5) // Últimas 5 mensagens do usuário

    for (const message of recentMessages.reverse()) {
      if (message && message.content) {
        const subject = extractSubjectFromTitle(message.content)
        if (subject) return subject
      }
    }
    return null
  }

  const generateSuggestion = (currentEvents: Event[], currentChatHistory: any[]) => {
    console.log("🎯 Gerando sugestão com eventos:", currentEvents)

    // Garantir que os parâmetros sejam arrays
    const safeEvents = Array.isArray(currentEvents) ? currentEvents : []
    const safeChatHistory = Array.isArray(currentChatHistory) ? currentChatHistory : []

    // Prioridade 1: Próximas provas
    const upcomingExam = getUpcomingExam(safeEvents)
    if (upcomingExam) {
      const subject = extractSubjectFromTitle(upcomingExam.title) || "a matéria"

      const dayText =
        upcomingExam.daysUntil === 0
          ? "hoje"
          : upcomingExam.daysUntil === 1
            ? "amanhã"
            : `em ${upcomingExam.daysUntil} dias`

      return {
        title: `${subject}: Preparação para ${upcomingExam.title}`,
        description: `Você tem uma prova ${dayText}. Recomendamos revisar este conteúdo hoje.`,
        time: "45 minutos",
        materials: [
          `Revisar anotações de ${subject}`,
          `Resolver exercícios práticos de ${subject}`,
          `Fazer simulados de ${subject}`,
          "Revisar pontos principais da matéria",
        ],
      }
    }

    // Prioridade 2: Próximas entregas
    const upcomingDelivery = getUpcomingDelivery(safeEvents)
    if (upcomingDelivery) {
      const subject = extractSubjectFromTitle(upcomingDelivery.title) || "o trabalho"

      const dayText =
        upcomingDelivery.daysUntil === 0
          ? "hoje"
          : upcomingDelivery.daysUntil === 1
            ? "amanhã"
            : `em ${upcomingDelivery.daysUntil} dias`

      return {
        title: `Trabalho: ${upcomingDelivery.title}`,
        description: `Você tem uma entrega ${dayText}. Organize seu tempo para finalizar.`,
        time: "60 minutos",
        materials: [
          `Revisar requisitos de ${subject}`,
          "Organizar material necessário",
          "Planejar etapas de execução",
          "Revisar e finalizar o trabalho",
        ],
      }
    }

    // Prioridade 3: Baseado no histórico do chat
    const chatSubject = getSubjectFromChatHistory(safeChatHistory)
    if (chatSubject) {
      return {
        title: `${chatSubject}: Aprofunde seus conhecimentos`,
        description: "Baseado nas suas perguntas recentes, recomendamos estudar mais sobre este tópico.",
        time: "30 minutos",
        materials: [
          `Ler capítulo sobre ${chatSubject}`,
          `Fazer exercícios de ${chatSubject}`,
          `Assistir vídeo-aula de ${chatSubject}`,
          "Fazer anotações dos pontos principais",
        ],
      }
    }

    // Prioridade 4: Sugestões padrão quando não há dados específicos
    const defaultSuggestions = [
      {
        title: "Leitura: Desenvolva o hábito da leitura",
        description: "A leitura regular melhora vocabulário, interpretação de texto e conhecimento geral.",
        time: "30 minutos",
        materials: [
          "Escolher um livro de interesse",
          "Ler pelo menos 10 páginas por dia",
          "Fazer anotações sobre pontos importantes",
          "Discutir o conteúdo com colegas",
        ],
      },
      {
        title: "Revisão: Organize seus estudos",
        description: "Uma boa revisão consolida o aprendizado e identifica lacunas no conhecimento.",
        time: "40 minutos",
        materials: [
          "Revisar anotações da semana",
          "Criar mapas mentais",
          "Listar dúvidas para esclarecer",
          "Fazer resumos dos tópicos estudados",
        ],
      },
      {
        title: "Exercícios: Pratique o que aprendeu",
        description: "A prática regular é fundamental para fixar conceitos e desenvolver habilidades.",
        time: "35 minutos",
        materials: [
          "Resolver exercícios variados",
          "Cronometrar o tempo de resolução",
          "Revisar erros cometidos",
          "Buscar exercícios similares para praticar",
        ],
      },
    ]

    // Usar data como seed para sugestão diária consistente
    const today = new Date()
    const seed = today.getDate() + today.getMonth() * 31
    return defaultSuggestions[seed % defaultSuggestions.length]
  }

  if (!dailySuggestion) {
    return (
      <Card className="border-studify-lightgreen/20 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-studify-green to-studify-green text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Sugestão de estudo para hoje
          </CardTitle>
          <CardDescription className="text-studify-white/90">Carregando sugestão...</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const suggestion = dailySuggestion.suggestion

  return (
    <Card className="border-studify-lightgreen/20 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-studify-green to-studify-green text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Sugestão de estudo para hoje
        </CardTitle>
        <CardDescription className="text-studify-white/90">Baseado no seu cronograma e atividades</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{suggestion.title}</h3>
            <p className="text-gray-600 mt-1">{suggestion.description}</p>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="mr-2 h-4 w-4" />
            <span>Tempo estimado: {suggestion.time}</span>
          </div>

          <div className="bg-studify-lightgreen/10 p-4 rounded-lg">
            <h4 className="font-medium text-studify-green mb-2">Materiais recomendados:</h4>
            <ul className="space-y-2 text-sm">
              {suggestion.materials.map((material, index) => (
                <li key={index} className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-studify-green mr-2"></div>
                  <span>{material}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-studify-green hover:bg-studify-green/90">
          Começar agora
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
