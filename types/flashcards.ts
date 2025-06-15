export interface Flashcard {
  id: string
  question: string
  answer: string
  explanation?: string
  difficulty_level: number
  tags: string[]
  subject: string
  topic: string
  source?: string
  created_at?: string
}

export interface Subject {
  id: string
  name: string
  category: string
  description?: string
  icon?: string
  color: string
  flashcard_topics?: Topic[]
}

export interface Topic {
  id: string
  name: string
  description?: string
  difficulty_level: number
  subject_id?: string
}

export interface FlashcardGenerationParams {
  method: "ai-custom" | "database" | "prebuilt"
  numberOfFlashcards?: number
  subjectId?: string
  topicId?: string
  customContent?: string
  difficulty?: string
  deckId?: string
}

export interface PrebuiltDeck {
  id: string
  name: string
  description: string
  subject_id: string
  category: string
  difficulty_level: number
  total_cards: number
  estimated_time_minutes: number
  tags: string[]
  author_name: string
  is_featured: boolean
  download_count: number
  rating_average: number
  rating_count: number
  created_at: string
  flashcard_subjects: {
    id: string
    name: string
    category: string
    color: string
  }
}

export interface StudySession {
  currentIndex: number
  totalCards: number
  correctAnswers: number
  showAnswer: boolean
  isComplete: boolean
}
