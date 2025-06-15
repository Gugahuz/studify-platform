import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, deckName, flashcards } = body

    console.log("✏️ Creating manual flashcards:", {
      userId,
      deckName,
      flashcardsCount: flashcards?.length,
    })

    if (!userId || !deckName || !flashcards || flashcards.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create user deck
    const { data: deck, error: deckError } = await supabase
      .from("user_flashcard_decks")
      .insert({
        user_id: userId,
        name: deckName,
        description: `Deck personalizado com ${flashcards.length} flashcards`,
        total_cards: flashcards.length,
        is_custom: true,
      })
      .select()
      .single()

    if (deckError) {
      console.error("❌ Error creating deck:", deckError)
      return NextResponse.json({ error: "Failed to create deck" }, { status: 500 })
    }

    // Create flashcards
    const flashcardsToInsert = flashcards.map((card: any, index: number) => ({
      question: card.question,
      answer: card.answer,
      explanation: card.explanation || null,
      difficulty_level: card.difficulty || 3,
      tags: card.tags || [],
      source: "Manual Input",
      topic_id: null, // Manual cards don't need to be linked to topics
    }))

    const { data: createdFlashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select()

    if (flashcardsError) {
      console.error("❌ Error creating flashcards:", flashcardsError)
      return NextResponse.json({ error: "Failed to create flashcards" }, { status: 500 })
    }

    // Link flashcards to deck
    const deckFlashcards = createdFlashcards.map((card, index) => ({
      deck_id: deck.id,
      flashcard_id: card.id,
      order_index: index + 1,
    }))

    const { error: linkError } = await supabase.from("user_deck_flashcards").insert(deckFlashcards)

    if (linkError) {
      console.error("❌ Error linking flashcards to deck:", linkError)
      return NextResponse.json({ error: "Failed to link flashcards" }, { status: 500 })
    }

    console.log("✅ Manual deck created successfully:", deck.id)

    return NextResponse.json({
      success: true,
      deck: {
        id: deck.id,
        name: deck.name,
        totalCards: flashcards.length,
      },
      flashcards: createdFlashcards.map((card, index) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        explanation: card.explanation,
        difficulty_level: card.difficulty_level,
        tags: card.tags,
        subject: "Personalizado",
        topic: "Manual",
        source: "Manual Input",
      })),
    })
  } catch (error) {
    console.error("❌ Exception creating manual flashcards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
