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

    console.log("📊 Fetching test result for attempt:", attemptId)

    // Get test attempt
    const { data: attempt, error: attemptError } = await supabase
      .from("test_attempts")
      .select("*")
      .eq("id", attemptId)
      .single()

    if (attemptError) {
      console.error("❌ Error fetching test attempt:", attemptError)
      return NextResponse.json({ success: false, error: "Failed to fetch test result" }, { status: 500 })
    }

    if (!attempt) {
      return NextResponse.json({ success: false, error: "Test result not found" }, { status: 404 })
    }

    // Get test answers
    const { data: answers, error: answersError } = await supabase
      .from("test_answers")
      .select("*")
      .eq("attempt_id", attemptId)
      .order("question_id", { ascending: true })

    if (answersError) {
      console.error("❌ Error fetching test answers:", answersError)
      return NextResponse.json({ success: false, error: "Failed to fetch test answers" }, { status: 500 })
    }

    console.log("✅ Test result fetched successfully")

    return NextResponse.json({
      success: true,
      data: {
        attempt,
        answers: answers || [],
      },
    })
  } catch (error: any) {
    console.error("❌ Error in test-results/[attemptId] GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
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

    if (user_rating === undefined) {
      return NextResponse.json({ success: false, error: "User rating is required" }, { status: 400 })
    }

    console.log("📝 Updating test rating for attempt:", attemptId)

    // Update test attempt
    const { data, error } = await supabase
      .from("test_attempts")
      .update({ user_rating })
      .eq("id", attemptId)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating test rating:", error)
      return NextResponse.json({ success: false, error: "Failed to update test rating" }, { status: 500 })
    }

    console.log("✅ Test rating updated successfully")

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error("❌ Error in test-results/[attemptId] PATCH:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
