import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Buscar deck específico com flashcards
export async function GET(request: NextRequest, { params }: { params: { deckId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const { deckId } = params

    if (!userId || !deckId) {
      return NextResponse.json({ error: "User ID e Deck ID são obrigatórios" }, { status: 400 })
    }

    // Validar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId) || !uuidRegex.test(deckId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 })
    }

    console.log("🔍 Buscando deck:", deckId, "para usuário:", userId)

    // Buscar deck
    const { data: deck, error: deckError } = await supabase
      .from("user_custom_decks")
      .select("*")
      .eq("id", deckId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (deckError || !deck) {
      console.error("❌ Deck não encontrado:", deckError)
      return NextResponse.json({ error: "Deck não encontrado" }, { status: 404 })
    }

    // Buscar flashcards (removido filtro is_active)
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("user_custom_flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .order("order_index", { ascending: true })

    if (flashcardsError) {
      console.error("❌ Erro ao buscar flashcards:", flashcardsError)
      return NextResponse.json({ error: "Erro ao buscar flashcards" }, { status: 500 })
    }

    console.log(`✅ Deck encontrado com ${flashcards?.length || 0} flashcards`)

    return NextResponse.json({
      success: true,
      deck,
      flashcards: flashcards || [],
    })
  } catch (error) {
    console.error("❌ Erro na API de deck:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar deck existente
export async function PUT(request: NextRequest, { params }: { params: { deckId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const { deckId } = params
    const body = await request.json()
    const { name, description, flashcards } = body

    if (!userId || !deckId || !name || !flashcards) {
      return NextResponse.json({ error: "Dados obrigatórios: userId, name, flashcards" }, { status: 400 })
    }

    // Validar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId) || !uuidRegex.test(deckId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 })
    }

    if (flashcards.length > 20) {
      return NextResponse.json({ error: "Máximo de 20 flashcards por deck" }, { status: 400 })
    }

    console.log("📝 Atualizando deck:", deckId, "para usuário:", userId)

    // Verificar se o deck pertence ao usuário
    const { data: existingDeck, error: checkError } = await supabase
      .from("user_custom_decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (checkError || !existingDeck) {
      return NextResponse.json({ error: "Deck não encontrado" }, { status: 404 })
    }

    // Atualizar o deck
    const { data: updatedDeck, error: deckError } = await supabase
      .from("user_custom_decks")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        total_cards: flashcards.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deckId)
      .eq("user_id", userId)
      .select()
      .single()

    if (deckError) {
      console.error("❌ Erro ao atualizar deck:", deckError)
      return NextResponse.json({ error: "Erro ao atualizar deck" }, { status: 500 })
    }

    // Excluir flashcards existentes (hard delete já que não temos is_active)
    const { error: deleteError } = await supabase.from("user_custom_flashcards").delete().eq("deck_id", deckId)

    if (deleteError) {
      console.error("❌ Erro ao excluir flashcards antigos:", deleteError)
    }

    // Criar novos flashcards
    const flashcardsToInsert = flashcards.map((card: any, index: number) => ({
      deck_id: deckId,
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
      console.error("❌ Erro ao criar novos flashcards:", flashcardsError)
      return NextResponse.json({ error: "Erro ao atualizar flashcards" }, { status: 500 })
    }

    console.log("✅ Deck atualizado com sucesso:", deckId)

    return NextResponse.json({
      success: true,
      deck: updatedDeck,
      flashcards: newFlashcards,
    })
  } catch (error) {
    console.error("❌ Erro na atualização de deck:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Excluir deck
export async function DELETE(request: NextRequest, { params }: { params: { deckId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const { deckId } = params

    if (!userId || !deckId) {
      return NextResponse.json({ error: "User ID e Deck ID são obrigatórios" }, { status: 400 })
    }

    // Validar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId) || !uuidRegex.test(deckId)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 })
    }

    console.log("🗑️ Excluindo deck:", deckId, "do usuário:", userId)

    // Verificar se o deck pertence ao usuário
    const { data: deck, error: checkError } = await supabase
      .from("user_custom_decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (checkError || !deck) {
      return NextResponse.json({ error: "Deck não encontrado" }, { status: 404 })
    }

    // Soft delete do deck (marca como inativo)
    const { error: deleteError } = await supabase
      .from("user_custom_decks")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", deckId)
      .eq("user_id", userId)

    if (deleteError) {
      console.error("❌ Erro ao excluir deck:", deleteError)
      return NextResponse.json({ error: "Erro ao excluir deck" }, { status: 500 })
    }

    // Hard delete dos flashcards (já que não temos is_active)
    const { error: flashcardsDeleteError } = await supabase
      .from("user_custom_flashcards")
      .delete()
      .eq("deck_id", deckId)

    if (flashcardsDeleteError) {
      console.error("❌ Erro ao excluir flashcards:", flashcardsDeleteError)
      // Não falha a operação, apenas loga o erro
    }

    console.log("✅ Deck excluído com sucesso")

    return NextResponse.json({
      success: true,
      message: "Deck excluído com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro na exclusão de deck:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
