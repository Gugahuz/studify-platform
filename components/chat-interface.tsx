"use client"

import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AvatarWithProfile } from "@/components/ui/avatar"
import { SendHorizontal, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useUserData } from "@/hooks/use-user-data"

export function ChatInterface() {
  const { userProfile } = useUserData()
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content: "Olá, sou Studo, o assistente de estudos do Studify. O que vamos estudar hoje?",
      },
    ],
  })

  // Salvar mensagens no sessionStorage
  useEffect(() => {
    if (messages.length > 1) {
      sessionStorage.setItem("chat-messages", JSON.stringify(messages))
    }
  }, [messages])

  // Carregar mensagens do sessionStorage ao inicializar
  useEffect(() => {
    const savedMessages = sessionStorage.getItem("chat-messages")
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages)
      } catch (error) {
        console.error("Erro ao carregar mensagens salvas:", error)
      }
    }
  }, [setMessages])

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              {message.role === "assistant" ? (
                <div className="h-12 w-12 rounded-full overflow-hidden bg-studify-primary flex items-center justify-center flex-shrink-0">
                  <img src="/images/studo-mascot.png" alt="Studo" className="h-10 w-10 object-contain" />
                </div>
              ) : (
                <AvatarWithProfile userProfile={userProfile} size="md" className="flex-shrink-0" />
              )}
              <div
                className={`rounded-lg p-3 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-studify-primary flex items-center justify-center flex-shrink-0">
                <img src="/images/studo-mascot.png" alt="Studo" className="h-10 w-10 object-contain" />
              </div>
              <div className="rounded-lg p-4 bg-gray-100">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Digite sua pergunta..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} className="bg-blue-700 hover:bg-blue-800">
            <SendHorizontal className="h-5 w-5" />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-2">Pressione Enter para enviar, Shift + Enter para nova linha</p>
      </div>
    </div>
  )
}

// Also export as default for compatibility
export default ChatInterface
