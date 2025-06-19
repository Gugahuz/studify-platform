"use client"

import { Search, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CustomDeckListProps {
  onStudyDeck?: (deck: any) => void
  onCreateNew?: () => void
  hideSearch?: boolean
  hideTitle?: boolean
}

const decks = [
  { id: 1, name: "Matemática Básica" },
  { id: 2, name: "História do Brasil" },
  { id: 3, name: "Inglês para Viagem" },
]

export function CustomDeckList({
  onStudyDeck,
  onCreateNew,
  hideSearch = false,
  hideTitle = false,
}: CustomDeckListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div>
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-studify-green">Meus Decks</h2>
            <p className="text-sm text-studify-gray">{decks.length} de 10 decks criados</p>
          </div>
          <Button onClick={onCreateNew} className="bg-studify-green hover:bg-studify-lightgreen text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Deck
          </Button>
        </div>
      )}

      {!hideSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar decks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-studify-green focus:ring-studify-green"
          />
        </div>
      )}

      <ul>
        {decks
          .filter((deck) => deck.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((deck) => (
            <li key={deck.id} className="mb-2">
              <Button onClick={() => onStudyDeck?.(deck)} className="w-full text-left">
                {deck.name}
              </Button>
            </li>
          ))}
      </ul>
    </div>
  )
}
