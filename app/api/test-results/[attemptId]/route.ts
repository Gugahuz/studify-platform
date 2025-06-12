import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Get specific test result
export async function GET(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const attemptId = params.attemptId

    if (!attemptId) {
      return NextResponse.json({ success: false, error: "Attempt ID is required" }, { status: 400 })
    }

    console.log(`📊 [API] Fetching test result for attempt: ${attemptId}`)

    // Get test attempt and join with tests table for test details
    const { data: attempt, error: attemptError } = await supabase
      .from("test_attempts")
      .select(
        `
          *,
          tests (
            id,
            title,
            subject,
            description,
            duration_minutes
          )
        `,
      )
      .eq("id", attemptId)
      .single()

    if (attemptError) {
      console.error("❌ [API] Error fetching test attempt:", attemptError)
      return NextResponse.json(
        { success: false, error: `Failed to fetch test result: ${attemptError.message}` },
        { status: 500 },
      )
    }

    if (!attempt) {
      return NextResponse.json({ success: false, error: "Test result not found" }, { status: 404 })
    }

    // Get test answers
    const { data: answers, error: answersError } = await supabase
      .from("test_answers")
      .select("*")
      .eq("attempt_id", attemptId)
      .order("question_id", { ascending: true }) // Assuming question_id helps in ordering

    if (answersError) {
      console.error("❌ [API] Error fetching test answers:", answersError)
      // Non-fatal, can return attempt without answers
    }

    console.log("✅ [API] Test result fetched successfully for attempt:", attemptId)

    return NextResponse.json({
      success: true,
      data: {
        attempt, // This now includes test details via the 'tests' object
        answers: answers || [],
      },
    })
  } catch (error: any) {
    console.error("❌ [API] Error in test-results/[attemptId] GET:", error)
    return NextResponse.json({ success: false, error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}

// Update test rating
export async function PATCH(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    const attemptId = params.attemptId
    const body = await request.json()
    const { user_rating } = body

    if (!attemptId) {
      return NextResponse.json({ success: false, error: "Attempt ID is required" }, { status: 400 })
    }

    if (user_rating === undefined || user_rating === null) {
      return NextResponse.json({ success: false, error: "User rating is required" }, { status: 400 })
    }

    const rating = Number(user_rating)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Invalid user rating. Must be between 1 and 5." },
        { status: 400 },
      )
    }

    console.log(`📝 [API] Updating test rating for attempt: ${attemptId} to ${rating}`)

    const { data, error } = await supabase
      .from("test_attempts")
      .update({ user_rating: rating })
      .eq("id", attemptId)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error updating test rating:", error)
      return NextResponse.json(
        { success: false, error: `Failed to update test rating: ${error.message}` },
        { status: 500 },
      )
    }

    console.log("✅ [API] Test rating updated successfully for attempt:", attemptId)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("❌ [API] Error in test-results/[attemptId] PATCH:", error)
    return NextResponse.json({ success: false, error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}
