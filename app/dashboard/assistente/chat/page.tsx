import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/assistente">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-studify-primary flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Falar com Studo</h1>
            <p className="text-gray-600">Converse com nosso assistente de IA especializado em vestibular</p>
          </div>
        </div>
      </div>

      <Card className="border-studify-primary/20 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-studify-primary/5 to-studify-primary/10">
          <CardTitle className="flex items-center gap-2 text-studify-primary">
            <span className="h-6 w-6 rounded-full bg-studify-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </span>
            Chat com Studo
          </CardTitle>
          <CardDescription>
            Faça perguntas sobre qualquer matéria do vestibular, ENEM ou ensino médio. O Studo está aqui para te ajudar
            com explicações claras e didáticas!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ChatInterface />
        </CardContent>
      </Card>
    </div>
  )
}
