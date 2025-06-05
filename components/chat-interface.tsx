"use client"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SendHorizontal, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useUserData } from "@/hooks/use-user-data"

export function ChatInterface() {
  const { userProfile } = useUserData()
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: [],
  })

  // Salvar mensagens no sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("chat-messages", JSON.stringify(messages))
    }
  }, [messages])

  // Carregar mensagens do sessionStorage ao inicializar
  useEffect(() => {
    const savedMessages = sessionStorage.getItem("chat-messages")
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages)
        }
      } catch (error) {
        console.error("Erro ao carregar mensagens salvas:", error)
      }
    }
  }, [setMessages])

  // Se não há mensagens, mostra a tela de apresentação
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Área de apresentação */}
        <div className="flex-1 flex flex-col">
          {/* Seção Pergunte ao Studo */}
          <div className="p-6 bg-white border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Pergunte ao Studo</h2>
            <p className="text-gray-600 text-sm">
              Faça perguntas ao Studo sobre qualquer matéria e receba respostas didáticas
            </p>
          </div>

          {/* Área central com mascote e apresentação */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            {/* Avatar do Studo */}
            <div className="mb-8">
              <div className="w-24 h-24 rounded-full bg-studify-primary flex items-center justify-center shadow-lg">
                <img
                  src="/images/studo-mascot.png"
                  alt="Studo Mascot"
                  className="w-16 h-16 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    target.parentElement!.innerHTML = '<span class="text-white font-bold text-2xl">S</span>'
                  }}
                />
              </div>
            </div>

            {/* Mensagem de boas-vindas */}
            <div className="max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Olá! Eu sou o Studo</h3>
              <p className="text-gray-600 leading-relaxed">
                Seu assistente de estudos pessoal. Faça qualquer pergunta sobre suas matérias e eu vou te ajudar!
              </p>
            </div>
          </div>
        </div>

        {/* Campo de input fixo na parte inferior */}
        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Digite sua pergunta aqui..."
              className="flex-1 h-12"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-studify-primary hover:bg-studify-primary/90 h-12 px-4"
            >
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Interface de chat normal quando há mensagens
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              {message.role === "assistant" ? (
                <div className="h-10 w-10 rounded-full overflow-hidden bg-studify-primary flex items-center justify-center flex-shrink-0">
                  <img
                    src="/images/studo-mascot.png"
                    alt="Studo"
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                      target.parentElement!.innerHTML = '<span class="text-white font-bold text-sm">S</span>'
                    }}
                  />
                </div>
              ) : (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={userProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {userProfile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-sm"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-studify-primary flex items-center justify-center flex-shrink-0">
                <img src="/images/studo-mascot.png" alt="Studo" className="h-8 w-8 object-contain" />
              </div>
              <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-studify-primary" />
                  <span className="text-sm text-gray-600">Studo está pensando...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Digite sua pergunta aqui..."
            className="flex-1 h-12"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-studify-primary hover:bg-studify-primary/90 h-12 px-4"
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

// Export as default for compatibility
export default ChatInterface
