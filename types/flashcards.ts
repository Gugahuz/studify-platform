export interface Flashcard {
  id: string
  question: string
  answer: string
  topic?: string
  subject?: string
}

export interface Topic {
  id: string
  name: string
  subjectId: string
}

export interface Subject {
  id: string
  name: string
  category: "Vestibular" | "Ensino Superior" | "Personalizado"
}

export interface FlashcardGenerationParams {
  subjectId?: string
  topicId?: string
  customContent?: string
  numberOfFlashcards?: number
}
