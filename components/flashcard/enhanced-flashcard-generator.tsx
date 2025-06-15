"use client"

import type React from "react"
import { useState } from "react"

interface FlashcardGenerationParams {
  method: "database" | "ai-custom"
  subjectId?: string
  topicId?: string
  customContent?: string
  numberOfFlashcards: number
  difficulty?: string
}

const EnhancedFlashcardGenerator: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [numberOfCards, setNumberOfCards] = useState<number>(5)
  const [content, setContent] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium")

  const handleGenerateFromSubject = async () => {
    if (!selectedSubject || !selectedTopic) {
      alert("Please select a subject and topic.")
      return
    }

    const params: FlashcardGenerationParams = {
      method: "database", // Adicionar esta linha
      subjectId: selectedSubject,
      topicId: selectedTopic,
      numberOfFlashcards: numberOfCards,
    }

    // Simulate API call
    console.log("Generating flashcards from subject with params:", params)
  }

  const handleGenerateFromContent = async () => {
    if (!content) {
      alert("Please enter content.")
      return
    }

    const params: FlashcardGenerationParams = {
      method: "ai-custom", // Adicionar esta linha
      customContent: content,
      numberOfFlashcards: numberOfCards,
      difficulty: selectedDifficulty,
    }

    // Simulate API call
    console.log("Generating flashcards from content with params:", params)
  }

  return (
    <div>
      <h2>Flashcard Generator</h2>

      <div>
        <label>Subject:</label>
        <input type="text" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} />
      </div>

      <div>
        <label>Topic:</label>
        <input type="text" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} />
      </div>

      <div>
        <button onClick={handleGenerateFromSubject}>Generate from Subject</button>
      </div>

      <div>
        <label>Content:</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      <div>
        <label>Difficulty:</label>
        <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div>
        <button onClick={handleGenerateFromContent}>Generate from Content</button>
      </div>

      <div>
        <label>Number of Cards:</label>
        <input
          type="number"
          value={numberOfCards}
          onChange={(e) => setNumberOfCards(Number.parseInt(e.target.value))}
        />
      </div>
    </div>
  )
}

export default EnhancedFlashcardGenerator
