export interface MockExamTemplate {
  id: string
  title: string
  description?: string
  subject_id?: string
  category: "enem" | "vestibular" | "concurso" | "fundamental" | "medio" | "superior" | "general"
  difficulty_level: number
  time_limit_minutes: number
  total_questions: number
  passing_score: number
  instructions?: string
  is_active: boolean
  is_featured: boolean
  created_by?: string
  created_at: string
  updated_at: string
  flashcard_subjects?: {
    id: string
    name: string
    category: string
    color: string
  }
}

export interface MockExamQuestion {
  id: string
  template_id: string
  question_number: number
  question_text: string
  question_type: "multiple_choice" | "true_false" | "essay" | "fill_blank"
  options?: string[]
  correct_answer: string
  explanation?: string
  subject_area?: string
  difficulty_level: number
  points: number
  time_estimate_seconds: number
  tags?: string[]
  created_at: string
}

export interface MockExamAttempt {
  id: string
  user_id: string
  template_id: string
  attempt_number: number
  status: "started" | "in_progress" | "paused" | "completed" | "abandoned"
  score: number
  percentage: number
  total_questions: number
  answered_questions: number
  correct_answers: number
  incorrect_answers: number
  skipped_questions: number
  total_points: number
  max_points: number
  time_spent_seconds: number
  time_limit_seconds: number
  started_at: string
  completed_at?: string
  paused_at?: string
  user_rating?: number
  feedback?: string
  created_at: string
  updated_at: string
  mock_exam_templates?: MockExamTemplate
}

export interface MockExamResponse {
  id: string
  attempt_id: string
  question_id: string
  user_answer?: string
  is_correct?: boolean
  points_earned: number
  time_spent_seconds: number
  is_flagged: boolean
  answered_at?: string
  created_at: string
  mock_exam_questions?: MockExamQuestion
}

export interface MockExamAnalytics {
  id: string
  user_id: string
  template_id: string
  subject_area?: string
  total_attempts: number
  best_score: number
  average_score: number
  total_time_spent: number
  improvement_trend: number
  weak_areas?: string[]
  strong_areas?: string[]
  last_attempt_at?: string
  created_at: string
  updated_at: string
}

export interface MockExamSession {
  attempt: MockExamAttempt
  questions: MockExamQuestion[]
  responses: MockExamResponse[]
  currentQuestionIndex: number
  timeRemaining: number
  isComplete: boolean
  isPaused: boolean
}

export interface MockExamResult {
  attempt: MockExamAttempt
  responses: MockExamResponse[]
  analytics?: MockExamAnalytics
  performance_by_subject: Array<{
    subject_area: string
    total_questions: number
    correct_answers: number
    percentage: number
  }>
}
