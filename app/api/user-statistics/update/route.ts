import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, score, totalQuestions, correctAnswers, timeSpent, subjectAreas } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get current statistics
    const { data: currentStats } = await supabase
      .from("user_exam_statistics")
      .select("*")
      .eq("user_id", userId)
      .single()

    const now = new Date().toISOString()

    if (currentStats) {
      // Update existing statistics
      const newTotalExams = currentStats.total_exams + 1
      const newTotalQuestions = currentStats.total_questions + (totalQuestions || 0)
      const newTotalCorrect = currentStats.total_correct_answers + (correctAnswers || 0)
      const newTotalTime = currentStats.total_time_spent + (timeSpent || 0)

      // Calculate new average
      const newAverageScore = (currentStats.average_score * currentStats.total_exams + (score || 0)) / newTotalExams

      // Update best score
      const newBestScore = Math.max(currentStats.best_score, score || 0)

      // Update worst score
      const newWorstScore = Math.min(currentStats.worst_score, score || 0)

      // Calculate streak (simplified - increment if score >= 60%)
      const newCurrentStreak = (score || 0) >= 60 ? currentStats.current_streak + 1 : 0
      const newMaxStreak = Math.max(currentStats.max_streak, newCurrentStreak)

      // Merge subject performance
      const currentSubjectPerf = currentStats.subject_performance || {}
      const mergedSubjectPerf = { ...currentSubjectPerf }

      if (subjectAreas) {
        Object.entries(subjectAreas).forEach(([subject, perf]: [string, any]) => {
          if (mergedSubjectPerf[subject]) {
            mergedSubjectPerf[subject].correct += perf.correct
            mergedSubjectPerf[subject].total += perf.total
          } else {
            mergedSubjectPerf[subject] = { ...perf }
          }
        })
      }

      const { error } = await supabase
        .from("user_exam_statistics")
        .update({
          total_exams: newTotalExams,
          total_questions: newTotalQuestions,
          total_correct_answers: newTotalCorrect,
          total_time_spent: newTotalTime,
          average_score: newAverageScore,
          best_score: newBestScore,
          worst_score: newWorstScore,
          current_streak: newCurrentStreak,
          max_streak: newMaxStreak,
          subject_performance: mergedSubjectPerf,
          last_updated: now,
        })
        .eq("user_id", userId)

      if (error) throw error
    } else {
      // Create new statistics record
      const { error } = await supabase.from("user_exam_statistics").insert({
        user_id: userId,
        total_exams: 1,
        total_questions: totalQuestions || 0,
        total_correct_answers: correctAnswers || 0,
        total_time_spent: timeSpent || 0,
        average_score: score || 0,
        best_score: score || 0,
        worst_score: score || 0,
        current_streak: (score || 0) >= 60 ? 1 : 0,
        max_streak: (score || 0) >= 60 ? 1 : 0,
        subject_performance: subjectAreas || {},
        last_updated: now,
      })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user statistics:", error)
    return NextResponse.json({ error: "Failed to update statistics" }, { status: 500 })
  }
}
