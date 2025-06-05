import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import Link from "next/link"

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Falar com Studo</h1>
          <p className="text-gray-600">Converse com nosso assistente de IA</p>
        </div>
      </div>

      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Pergunte ao Studo</CardTitle>
          <CardDescription>Faça perguntas ao Studo sobre qualquer matéria e receba respostas didáticas</CardDescription>
        </CardHeader>
        <CardContent>
          <ChatInterface />
        </CardContent>
      </Card>
    </div>
  )
}
