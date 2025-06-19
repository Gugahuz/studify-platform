export interface CustomDeck {
  id: string
  name: string
  description?: string
  difficulty: "easy" | "medium" | "hard"
  tags: string[]
  flashcards: CustomFlashcard[]
  created_at: string
  updated_at: string
  user_id: string
  total_cards: number
  last_studied_at?: string
  study_sessions_count: number
  average_score?: number
}

export interface CustomFlashcard {
  id: string
  deck_id: string
  question: string
  answer: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  deck_id: string
  user_id: string
  score: number
  total_cards: number
  correct_answers: number
  time_spent_seconds: number
  completed_at: string
}
