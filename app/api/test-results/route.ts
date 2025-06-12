import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Save test results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📥 [API] Received test results data for user:", body.user_id)

    const {
      user_id,
      test_id,
      test_title,
      subject: test_subject,
      score,
      total_questions,
      correct_answers,
      incorrect_answers,
      unanswered_questions,
      time_spent,
      time_allowed,
      answers: detailed_answers,
      user_rating,
      description,
      test_duration_minutes,
    } = body

    // Validate required fields
    if (!user_id || test_id === undefined || score === undefined) {
      console.error("❌ [API] Missing required fields:", { user_id, test_id, score })
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // 1. First, let's check what columns exist in the tests table
    const { data: testTableInfo, error: testTableError } = await supabase
      .rpc("get_table_columns", {
        table_name: "tests",
      })
      .catch(() => ({ data: null, error: null }))

    // Prepare test data based on available columns
    const testDataForTable: any = {
      id: Number(test_id),
      title: test_title || `Test ${test_id}`,
      subject: test_subject || "Geral",
    }

    // Add optional columns only if they exist
    if (description) {
      testDataForTable.description = description
    }
    if (test_duration_minutes) {
      testDataForTable.duration_minutes = test_duration_minutes
    }

    console.log("📝 [API] Upserting test definition:", testDataForTable)

    // Try to upsert the test, but don't fail if columns don't exist
    const { data: upsertedTest, error: testUpsertError } = await supabase
      .from("tests")
      .upsert(testDataForTable, { onConflict: "id" })
      .select()
      .single()

    if (testUpsertError) {
      console.warn("⚠️ [API] Warning upserting test definition:", testUpsertError.message)
      // Continue anyway - we can still save the attempt
    } else {
      console.log("✅ [API] Test definition upserted/confirmed:", upsertedTest)
    }

    // 2. Check what columns exist in test_attempts table and prepare data accordingly
    const attemptToInsert: any = {
      user_id,
      test_id: Number(test_id),
      score: Number(score),
      total_questions: Number(total_questions),
      correct_answers: Number(correct_answers),
      incorrect_answers: Number(incorrect_answers),
      unanswered_questions: Number(unanswered_questions) || 0,
      user_rating: user_rating ? Number(user_rating) : null,
    }

    // Add time fields with fallback column names
    if (time_spent !== undefined) {
      attemptToInsert.time_spent_seconds = Number(time_spent)
      // Also try the old column name as fallback
      attemptToInsert.time_spent = Number(time_spent)
    }

    if (time_allowed !== undefined) {
      attemptToInsert.time_allowed_seconds = Number(time_allowed)
      // Also try the old column name as fallback
      attemptToInsert.time_allowed = Number(time_allowed)
    }

    // Add subject as fallback if tests relationship doesn't work
    if (test_subject) {
      attemptToInsert.test_subject = test_subject
    }

    console.log("📝 [API] Inserting test attempt:", attemptToInsert)

    // Try to insert with all possible column names, let Supabase ignore the ones that don't exist
    const { data: savedAttempt, error: attemptInsertError } = await supabase
      .from("test_attempts")
      .insert(attemptToInsert)
      .select()
      .single()

    if (attemptInsertError) {
      console.error("❌ [API] Error inserting test attempt:", attemptInsertError)

      // Try with minimal required fields only
      const minimalAttempt = {
        user_id,
        test_id: Number(test_id),
        score: Number(score),
        total_questions: Number(total_questions),
        correct_answers: Number(correct_answers),
        incorrect_answers: Number(incorrect_answers),
      }

      console.log("🔄 [API] Retrying with minimal data:", minimalAttempt)

      const { data: savedAttemptRetry, error: attemptRetryError } = await supabase
        .from("test_attempts")
        .insert(minimalAttempt)
        .select()
        .single()

      if (attemptRetryError) {
        console.error("❌ [API] Error on retry:", attemptRetryError)
        return NextResponse.json(
          { success: false, error: `Failed to save test attempt: ${attemptRetryError.message}` },
          { status: 500 },
        )
      }

      console.log("✅ [API] Test attempt saved on retry:", savedAttemptRetry.id)

      return NextResponse.json({
        success: true,
        data: { attempt_id: savedAttemptRetry.id },
        message: "Resultados salvos com sucesso!",
        note: "Saved with basic information only",
      })
    }

    console.log("✅ [API] Test attempt saved successfully:", savedAttempt.id)

    // 3. Insert detailed answers if provided and table exists
    if (detailed_answers && Array.isArray(detailed_answers) && detailed_answers.length > 0) {
      const answersToInsert = detailed_answers.map((ans: any) => ({
        attempt_id: savedAttempt.id,
        question_id: ans.question_id,
        question_text: ans.question_text,
        user_answer: ans.user_answer,
        correct_answer: ans.correct_answer,
        is_correct: ans.is_correct,
        time_spent_on_question_seconds: ans.time_spent || 0,
        subject_area: ans.subject_area,
        difficulty: ans.difficulty,
      }))

      console.log(`📝 [API] Inserting ${answersToInsert.length} detailed answers...`)
      const { error: answersInsertError } = await supabase.from("test_answers").insert(answersToInsert)

      if (answersInsertError) {
        console.warn("⚠️ [API] Warning inserting detailed answers:", answersInsertError.message)
        // Not a fatal error for the attempt itself
      } else {
        console.log("✅ [API] Detailed answers saved successfully.")
      }
    }

    return NextResponse.json({
      success: true,
      data: { attempt_id: savedAttempt.id },
      message: "Resultados salvos com sucesso!",
    })
  } catch (error: any) {
    console.error("❌ [API] Unexpected error in test-results POST:", error)
    return NextResponse.json({ success: false, error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}

// Get user test history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const limitParam = searchParams.get("limit")
    const offsetParam = searchParams.get("offset")

    const limit = limitParam ? Number.parseInt(limitParam) : 20
    const offset = offsetParam ? Number.parseInt(offsetParam) : 0

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    console.log(`📊 [API] Fetching test history for user: ${userId}, limit: ${limit}, offset: ${offset}`)

    // First, try to fetch with the full relationship
    let attemptsData: any[] = []
    let count = 0
    let attemptsError: any = null

    try {
      const result = await supabase
        .from("test_attempts")
        .select(
          `
            id,
            test_id,
            score,
            total_questions,
            correct_answers,
            incorrect_answers,
            unanswered_questions,
            time_spent_seconds,
            time_spent,
            time_allowed_seconds,
            time_allowed,
            completed_at,
            created_at,
            user_rating,
            test_subject,
            tests (
              id,
              title,
              subject
            )
          `,
          { count: "exact" },
        )
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .range(offset, offset + limit - 1)

      attemptsData = result.data || []
      count = result.count || 0
      attemptsError = result.error
    } catch (relationshipError) {
      console.warn("⚠️ [API] Relationship query failed, trying simple query:", relationshipError)
      attemptsError = relationshipError
    }

    // If the relationship query failed, try without the tests relationship
    if (attemptsError || attemptsData.length === 0) {
      console.log("🔄 [API] Trying simple query without relationship...")

      const simpleResult = await supabase
        .from("test_attempts")
        .select(
          `
            id,
            test_id,
            score,
            total_questions,
            correct_answers,
            incorrect_answers,
            unanswered_questions,
            time_spent_seconds,
            time_spent,
            time_allowed_seconds,
            time_allowed,
            completed_at,
            created_at,
            user_rating,
            test_subject
          `,
          { count: "exact" },
        )
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (simpleResult.error) {
        console.error("❌ [API] Error fetching test attempts (simple query):", simpleResult.error)
        return NextResponse.json(
          { success: false, error: `Failed to fetch test history: ${simpleResult.error.message}` },
          { status: 500 },
        )
      }

      attemptsData = simpleResult.data || []
      count = simpleResult.count || 0
      console.log(`✅ [API] Found ${attemptsData.length} attempts using simple query`)
    } else {
      console.log(`✅ [API] Found ${attemptsData.length} attempts using relationship query`)
    }

    const processedAttempts = attemptsData.map((attempt: any) => ({
      id: attempt.id,
      user_id: userId,
      test_id: attempt.test_id,
      test_title: attempt.tests?.title || attempt.test_title || `Simulado ${attempt.test_id}`,
      subject: attempt.tests?.subject || attempt.test_subject || "Geral",
      score: attempt.score,
      total_questions: attempt.total_questions,
      correct_answers: attempt.correct_answers,
      incorrect_answers: attempt.incorrect_answers,
      unanswered_questions: attempt.unanswered_questions,
      time_spent: attempt.time_spent_seconds || attempt.time_spent || 0,
      completed_at: attempt.completed_at,
      created_at: attempt.created_at,
      user_rating: attempt.user_rating,
    }))

    // Calculate statistics from all user attempts (not just the paginated ones)
    const { data: allAttemptsForStats, error: allAttemptsError } = await supabase
      .from("test_attempts")
      .select("score, correct_answers, incorrect_answers, time_spent_seconds, time_spent, test_id, test_subject")
      .eq("user_id", userId)

    const statsSource = allAttemptsForStats || processedAttempts

    const statistics = {
      totalAttempts: count,
      averageScore:
        statsSource.length > 0
          ? statsSource.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / statsSource.length
          : 0,
      totalCorrect: statsSource.reduce((sum, attempt) => sum + (attempt.correct_answers || 0), 0),
      totalIncorrect: statsSource.reduce((sum, attempt) => sum + (attempt.incorrect_answers || 0), 0),
      averageTime:
        statsSource.length > 0
          ? statsSource.reduce((sum, attempt) => sum + (attempt.time_spent_seconds || attempt.time_spent || 0), 0) /
            statsSource.length
          : 0,
      subjectPerformance: [] as Array<{
        subject: string
        attempts: number
        averageScore: number
        totalCorrect: number
        totalIncorrect: number
      }>,
    }

    if (statsSource.length > 0) {
      const subjectMap = new Map<
        string,
        {
          attempts: number
          totalScore: number
          totalCorrect: number
          totalIncorrect: number
        }
      >()

      statsSource.forEach((attempt: any) => {
        const subjectName = attempt.test_subject || "Geral"
        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, {
            attempts: 0,
            totalScore: 0,
            totalCorrect: 0,
            totalIncorrect: 0,
          })
        }
        const current = subjectMap.get(subjectName)!
        current.attempts += 1
        current.totalScore += attempt.score || 0
        current.totalCorrect += attempt.correct_answers || 0
        current.totalIncorrect += attempt.incorrect_answers || 0
      })

      subjectMap.forEach((value, key) => {
        statistics.subjectPerformance.push({
          subject: key,
          attempts: value.attempts,
          averageScore: value.attempts > 0 ? value.totalScore / value.attempts : 0,
          totalCorrect: value.totalCorrect,
          totalIncorrect: value.totalIncorrect,
        })
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        attempts: processedAttempts,
        statistics,
        totalCount: count,
      },
    })
  } catch (error: any) {
    console.error("❌ [API] Error in test-results GET:", error)
    return NextResponse.json({ success: false, error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}
