"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { Send } from "lucide-react"
import Image from "next/image"

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState("")
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  })

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      handleSubmit(e)
      setInputValue("")
    }
  }

  // Override the input from useChat with our controlled input
  const handleChange = (e) => {
    setInputValue(e.target.value)
    handleInputChange(e)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Image src="/images/studo-mascot.png" alt="Studo Mascot" width={150} height={150} className="mb-4" />
            <h3 className="text-xl font-semibold mb-2">Olá! Eu sou o Studo!</h3>
            <p className="max-w-md">Seu assistente de estudos pessoal. Como posso te ajudar hoje?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-3/4 p-3 rounded-lg ${
                  message.role === "user" ? "bg-studify-green text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="border-t p-4">
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="Digite sua mensagem..."
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-studify-green"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-studify-green text-white p-2 rounded-r-lg hover:bg-opacity-90 disabled:opacity-50"
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}
