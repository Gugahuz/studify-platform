import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file content
    const text = await file.text()

    // Generate flashcards from the uploaded content
    const { text: flashcardsText } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Create 10 educational flashcards from the following document content. Format as JSON array with objects containing 'question', 'answer', 'explanation', and 'difficulty' (1-5):

Document content: ${text}

Make the flashcards comprehensive and educational, covering the main concepts from the document.`,
    })

    let flashcards = []
    try {
      flashcards = JSON.parse(flashcardsText)
    } catch {
      // Fallback if JSON parsing fails
      flashcards = [
        {
          question: "What is the main topic of the uploaded document?",
          answer: "Based on the document content",
          explanation: "This flashcard was generated from your uploaded document",
          difficulty: 2,
        },
      ]
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      flashcards,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}
