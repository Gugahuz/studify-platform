"use client"

import { useState } from "react"
import { SimpleMockExamDashboard } from "@/components/mock-exams/simple-mock-exam-dashboard"
import { SimpleMockExamInterface } from "@/components/mock-exams/simple-mock-exam-interface"
import { MockExamResultsWrapper } from "@/components/mock-exams/mock-exam-results-wrapper"
import { SimpleMockExamHistory } from "@/components/mock-exams/simple-mock-exam-history"
import { QuestionReview } from "@/components/mock-exams/question-review"
import type { MockExamTemplate, MockExamAttempt } from "@/lib/mock-exam-data"

type ViewMode = "dashboard" | "exam" | "results" | "history" | "review"

export default function SimuladoPage() {
  const [currentView, setCurrentView] = useState<ViewMode>("dashboard")
  const [selectedTemplate, setSelectedTemplate] = useState<MockExamTemplate | null>(null)
  const [examResults, setExamResults] = useState<MockExamAttempt | null>(null)
  const [reviewingAttempt, setReviewingAttempt] = useState<MockExamAttempt | null>(null)

  const handleSelectTemplate = (template: MockExamTemplate) => {
    setSelectedTemplate(template)
    setCurrentView("exam")
  }

  const handleExamComplete = (attempt: MockExamAttempt) => {
    setExamResults(attempt)
    setCurrentView("results")
  }

  const handleViewHistory = () => {
    setCurrentView("history")
  }

  const handleReviewQuestions = (attempt: MockExamAttempt) => {
    setReviewingAttempt(attempt)
    setCurrentView("review")
  }

  const handleBackToDashboard = () => {
    setCurrentView("dashboard")
    setSelectedTemplate(null)
    setExamResults(null)
    setReviewingAttempt(null)
  }

  const handleBackToHistory = () => {
    setCurrentView("history")
    setReviewingAttempt(null)
  }

  const handleRetakeExam = () => {
    if (selectedTemplate) {
      setExamResults(null)
      setCurrentView("exam")
    }
  }

  // Render based on current view
  switch (currentView) {
    case "exam":
      return selectedTemplate ? (
        <SimpleMockExamInterface
          template={selectedTemplate}
          onComplete={handleExamComplete}
          onExit={handleBackToDashboard}
        />
      ) : null

    case "results":
      return examResults ? (
        <MockExamResultsWrapper
          attempt={examResults}
          onRetake={handleRetakeExam}
          onViewHistory={handleViewHistory}
          onBackToDashboard={handleBackToDashboard}
        />
      ) : null

    case "history":
      return <SimpleMockExamHistory onBack={handleBackToDashboard} onReviewQuestions={handleReviewQuestions} />

    case "review":
      return reviewingAttempt ? <QuestionReview attempt={reviewingAttempt} onBack={handleBackToHistory} /> : null

    default:
      return <SimpleMockExamDashboard onSelectTemplate={handleSelectTemplate} onViewHistory={handleViewHistory} />
  }
}
