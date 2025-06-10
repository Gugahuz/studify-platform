"use client"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useUserData } from "@/hooks/use-user-data"

export function ChatInterface() {
  const { userProfile } = useUserData()
  const [imageError, setImageError] = useState(false)
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
          {/* Área central com mascote e apresentação */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            {/* Avatar do Studo */}
            <div className="mb-8">
              <div className="w-24 h-24 rounded-full bg-studify-primary flex items-center justify-center shadow-lg">
                {!imageError ? (
                  <img
                    src="/images/studo-mascot.png"
                    alt="Studo Mascot"
                    className="w-16 h-16 object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">S</span>
                )}
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
              <svg className="h-5 w-5 text-studify-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // Tela de loading durante o envio da primeira mensagem
  if (messages.length === 0 && isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full bg-studify-primary flex items-center justify-center shadow-lg">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
          <div className="max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Studo está pensando...</h3>
            <p className="text-gray-600 leading-relaxed">Preparando uma resposta personalizada para você!</p>
          </div>
        </div>
      </div>
    )
  }

  // Interface de chat normal quando há mensagens
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header do chat */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-studify-primary flex items-center justify-center">
            {!imageError ? (
              <img
                src="/images/studo-mascot.png"
                alt="Studo"
                className="w-6 h-6 object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-white font-bold text-sm">S</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Studo</h3>
            <p className="text-sm text-gray-500">Assistente de estudos</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              {message.role === "assistant" ? (
                <div className="h-10 w-10 rounded-full overflow-hidden bg-studify-primary flex items-center justify-center flex-shrink-0">
                  {!imageError ? (
                    <img
                      src="/images/studo-mascot.png"
                      alt="Studo"
                      className="h-6 w-6 object-contain"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">S</span>
                  )}
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
                {!imageError ? (
                  <img
                    src="/images/studo-mascot.png"
                    alt="Studo"
                    className="h-6 w-6 object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-white font-bold text-sm">S</span>
                )}
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
            <svg className="h-5 w-5 text-studify-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ChatInterface
