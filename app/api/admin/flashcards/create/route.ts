import { NextResponse, type NextRequest } from "next/server"
import { addAdminFlashcard } from "@/lib/admin-flashcard-store"
import type { Flashcard } from "@/types/flashcards"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      question,
      answer,
      explanation,
      difficulty_level,
      tags,
      subject, // Should be subject name or ID
      topic, // Should be topic name or ID
      source,
    } = body

    if (!question || !answer || !subject || !topic || !difficulty_level) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes (pergunta, resposta, matéria, tópico, dificuldade)." },
        { status: 400 },
      )
    }

    const newFlashcard: Flashcard = {
      id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      question,
      answer,
      explanation: explanation || null,
      difficulty_level: Number.parseInt(difficulty_level, 10) || 3,
      tags: Array.isArray(tags)
        ? tags
        : tags
            ?.split(",")
            .map((t: string) => t.trim())
            .filter(Boolean) || [],
      subject: subject, // Store as is, frontend will handle display
      topic: topic, // Store as is
      source: source || "Admin",
      // Outros campos podem ser adicionados conforme necessário
    }

    addAdminFlashcard(newFlashcard)

    return NextResponse.json({ success: true, flashcard: newFlashcard, message: "Flashcard criado com sucesso!" })
  } catch (error) {
    console.error("❌ Erro ao criar flashcard (admin):", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar sua solicitação."
    return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status: 500 })
  }
}
