"use client"

import { useState } from "react"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FlashcardGeneratorOptions from "@/components/flashcard/flashcard-generator-options"
import FlashcardViewer from "@/components/flashcard/flashcard-viewer"
import type { Flashcard, FlashcardGenerationParams } from "@/types/flashcards"
import { useToast } from "@/components/ui/use-toast"

// Mock API call
async function generateFlashcardsAPI(params: FlashcardGenerationParams): Promise<Flashcard[]> {
  console.log("Generating flashcards with params:", params)
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API delay

  // Basic mock generation logic
  const baseQuestion = params.subjectId
    ? `Qual é um conceito chave em ${params.subjectId}?`
    : params.customContent
      ? `O que é importante sobre "${params.customContent.substring(0, 30)}..."?`
      : "Qual é a questão?"
  const baseAnswer = params.subjectId
    ? `Resposta sobre ${params.subjectId}.`
    : params.customContent
      ? `Detalhes sobre "${params.customContent.substring(0, 30)}...".`
      : "Esta é a resposta."

  const numToGenerate = params.numberOfFlashcards || 5

  if (params.customContent && params.customContent.toLowerCase().includes("erro")) {
    throw new Error("Simulação de erro ao processar conteúdo personalizado.")
  }

  return Array.from({ length: numToGenerate }, (_, i) => ({
    id: `mock-${Date.now()}-${i}`,
    question: `${baseQuestion} (Card ${i + 1})`,
    answer: `${baseAnswer} (Card ${i + 1})`,
    subject: params.subjectId || "Personalizado",
    topic: params.topicId || (params.customContent ? "Conteúdo do Usuário" : "Geral"),
  }))
}

export default function FlashcardsPage() {
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const { toast } = useToast()

  const handleGenerateFlashcards = async (params: FlashcardGenerationParams) => {
    setIsGenerating(true)
    setGeneratedFlashcards([])
    setShowViewer(false)
    try {
      const cards = await generateFlashcardsAPI(params)
      setGeneratedFlashcards(cards)
      setShowViewer(true)
      toast({
        title: "Flashcards Gerados!",
        description: `${cards.length} flashcards foram criados com sucesso.`,
      })
    } catch (error) {
      console.error("Failed to generate flashcards:", error)
      toast({
        title: "Erro ao Gerar Flashcards",
        description: error instanceof Error ? error.message : "Não foi possível gerar os flashcards. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBackToGenerator = () => {
    setShowViewer(false)
    setGeneratedFlashcards([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {showViewer ? (
          <Button variant="outline" size="sm" onClick={handleBackToGenerator}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Gerar Novos Flashcards
          </Button>
        ) : (
          <Link href="/dashboard/assistente">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Assistente
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerador de Flashcards</h1>
          <p className="text-gray-600">
            {showViewer ? "Revise seus flashcards gerados." : "Crie flashcards para otimizar seus estudos."}
          </p>
        </div>
      </div>

      <Card className="border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-600" />
            {showViewer ? "Seu Deck de Flashcards" : "Configurar Geração"}
          </CardTitle>
          <CardDescription>
            {showViewer
              ? "Use os botões abaixo para navegar e avaliar seu conhecimento."
              : "Selecione uma matéria, tópico ou envie seu próprio conteúdo para gerar flashcards personalizados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 text-purple-600">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-lg font-medium">Gerando seus flashcards, aguarde...</p>
            </div>
          )}

          {!isGenerating && showViewer && generatedFlashcards.length > 0 && (
            <FlashcardViewer flashcards={generatedFlashcards} onComplete={() => console.log("Deck completed!")} />
          )}

          {!isGenerating && !showViewer && (
            <FlashcardGeneratorOptions onGenerate={handleGenerateFlashcards} isGenerating={isGenerating} />
          )}

          {!isGenerating && showViewer && generatedFlashcards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Nenhum flashcard foi gerado ou ocorreu um problema.</p>
              <Button onClick={handleBackToGenerator}>Tentar Gerar Novamente</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
