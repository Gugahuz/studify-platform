import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Listar decks do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID é obrigatório" }, { status: 400 })
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: "User ID inválido" }, { status: 400 })
    }

    console.log("📚 Buscando decks para usuário:", userId)

    const { data: decks, error } = await supabase
      .from("user_custom_decks")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erro ao buscar decks:", error)
      return NextResponse.json({ error: "Erro ao buscar decks" }, { status: 500 })
    }

    console.log(`✅ Encontrados ${decks?.length || 0} decks`)

    return NextResponse.json({
      success: true,
      decks: decks || [],
    })
  } catch (error) {
    console.error("❌ Erro na API de decks:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar novo deck
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, description, flashcards } = body

    if (!userId || !name || !flashcards) {
      return NextResponse.json({ error: "Dados obrigatórios: userId, name, flashcards" }, { status: 400 })
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: "User ID inválido" }, { status: 400 })
    }

    if (flashcards.length > 20) {
      return NextResponse.json({ error: "Máximo de 20 flashcards por deck" }, { status: 400 })
    }

    console.log("📝 Criando deck para usuário:", userId)

    // Verificar limite de decks
    const { count: deckCount, error: countError } = await supabase
      .from("user_custom_decks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true)

    if (countError) {
      console.error("❌ Erro ao verificar limite:", countError)
      return NextResponse.json({ error: "Erro ao verificar limite de decks" }, { status: 500 })
    }

    if ((deckCount || 0) >= 10) {
      return NextResponse.json({ error: "Limite máximo de 10 decks atingido" }, { status: 400 })
    }

    // Criar o deck
    const { data: newDeck, error: deckError } = await supabase
      .from("user_custom_decks")
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        total_cards: flashcards.length,
      })
      .select()
      .single()

    if (deckError) {
      console.error("❌ Erro ao criar deck:", deckError)
      return NextResponse.json({ error: "Erro ao criar deck" }, { status: 500 })
    }

    // Criar flashcards
    const flashcardsToInsert = flashcards.map((card: any, index: number) => ({
      deck_id: newDeck.id,
      question: card.question.trim(),
      answer: card.answer.trim(),
      explanation: card.explanation?.trim() || null,
      difficulty_level: Math.max(1, Math.min(5, Number(card.difficulty_level) || 3)),
      tags: Array.isArray(card.tags) ? card.tags : [],
      order_index: index + 1,
    }))

    const { data: newFlashcards, error: flashcardsError } = await supabase
      .from("user_custom_flashcards")
      .insert(flashcardsToInsert)
      .select()

    if (flashcardsError) {
      console.error("❌ Erro ao criar flashcards:", flashcardsError)
      // Tentar excluir o deck criado
      await supabase.from("user_custom_decks").delete().eq("id", newDeck.id)
      return NextResponse.json({ error: "Erro ao criar flashcards" }, { status: 500 })
    }

    console.log("✅ Deck criado com sucesso:", newDeck.id)

    return NextResponse.json({
      success: true,
      deck: newDeck,
      flashcards: newFlashcards,
    })
  } catch (error) {
    console.error("❌ Erro na criação de deck:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
