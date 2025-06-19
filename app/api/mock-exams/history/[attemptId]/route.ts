import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

const supabase = createClient()

// Get detailed history for specific attempt
export async function GET(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const attemptId = params.attemptId

    if (!attemptId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId)) {
      return NextResponse.json({ success: false, error: "Valid attempt ID is required" }, { status: 400 })
    }

    console.log("📊 Fetching detailed history for attempt:", attemptId)

    // Get attempt details
    const { data: attempt, error: attemptError } = await supabase
      .from("mock_exam_attempts")
      .select(`
        *,
        mock_exam_templates (
          id,
          title,
          description,
          category,
          difficulty_level,
          time_limit_minutes,
          passing_score,
          instructions,
          total_questions
        )
      `)
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .eq("status", "completed") // Only allow viewing completed attempts
      .single()

    if (attemptError || !attempt) {
      console.error("❌ Error fetching attempt:", attemptError)
      return NextResponse.json({ success: false, error: "Attempt not found or not completed" }, { status: 404 })
    }

    // Get responses with questions
    const { data: responses, error: responsesError } = await supabase
      .from("mock_exam_responses")
      .select(`
        id,
        question_id,
        user_answer,
        is_correct,
        points_earned,
        time_spent_seconds,
        is_flagged,
        answered_at,
        mock_exam_questions (
          id,
          question_number,
          question_text,
          question_type,
          options,
          correct_answer,
          explanation,
          subject_area,
          difficulty_level,
          points,
          time_estimate_seconds,
          tags
        )
      `)
      .eq("attempt_id", attemptId)
      .order("mock_exam_questions(question_number)", { ascending: true })

    if (responsesError) {
      console.error("❌ Error fetching responses:", responsesError)
      return NextResponse.json({ success: false, error: "Failed to fetch responses" }, { status: 500 })
    }

    // Calculate performance by subject
    const subjectPerformance: Record<string, { total: number; correct: number; points: number; maxPoints: number }> = {}

    responses?.forEach((response) => {
      const subject = response.mock_exam_questions?.subject_area || "Geral"
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { total: 0, correct: 0, points: 0, maxPoints: 0 }
      }
      subjectPerformance[subject].total++
      subjectPerformance[subject].maxPoints += response.mock_exam_questions?.points || 1
      if (response.is_correct) {
        subjectPerformance[subject].correct++
      }
      subjectPerformance[subject].points += response.points_earned || 0
    })

    // Convert to array format
    const performanceBySubject = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject_area: subject,
      total_questions: data.total,
      correct_answers: data.correct,
      percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0,
      points_earned: data.points,
      max_points: data.maxPoints,
    }))

    console.log(`✅ Found attempt with ${responses?.length || 0} responses`)

    return NextResponse.json({
      success: true,
      data: {
        attempt,
        responses: responses || [],
        performance_by_subject: performanceBySubject,
      },
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/history/[attemptId] GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Delete specific attempt from history
export async function DELETE(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const attemptId = params.attemptId

    if (!attemptId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId)) {
      return NextResponse.json({ success: false, error: "Valid attempt ID is required" }, { status: 400 })
    }

    console.log("🗑️ Deleting attempt from history:", attemptId)

    // Verify ownership and that it's completed
    const { data: attempt, error: checkError } = await supabase
      .from("mock_exam_attempts")
      .select("id, status")
      .eq("id", attemptId)
      .eq("user_id", user.id)
      .eq("status", "completed")
      .single()

    if (checkError || !attempt) {
      return NextResponse.json({ success: false, error: "Attempt not found or cannot be deleted" }, { status: 404 })
    }

    // Delete responses first (foreign key constraint)
    const { error: responsesError } = await supabase.from("mock_exam_responses").delete().eq("attempt_id", attemptId)

    if (responsesError) {
      console.error("❌ Error deleting responses:", responsesError)
      return NextResponse.json({ success: false, error: "Failed to delete responses" }, { status: 500 })
    }

    // Delete the attempt
    const { error: attemptError } = await supabase.from("mock_exam_attempts").delete().eq("id", attemptId)

    if (attemptError) {
      console.error("❌ Error deleting attempt:", attemptError)
      return NextResponse.json({ success: false, error: "Failed to delete attempt" }, { status: 500 })
    }

    console.log("✅ Attempt deleted successfully")

    return NextResponse.json({
      success: true,
      data: { message: "Attempt deleted successfully" },
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/history/[attemptId] DELETE:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
