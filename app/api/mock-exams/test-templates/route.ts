import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("🧪 Testing mock exam templates access...")

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: "Missing Supabase configuration",
        step: "environment_check",
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Step 1: Check if table exists
    console.log("Step 1: Checking if mock_exam_templates table exists...")
    const { data: tableCheck, error: tableError } = await supabase
      .from("mock_exam_templates")
      .select("count", { count: "exact", head: true })

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: "Table does not exist or is not accessible",
        details: tableError.message,
        step: "table_check",
        suggestion: "Execute scripts 014-create-mock-exams-schema-safe.sql",
      })
    }

    console.log("✅ Table exists")

    // Step 2: Try to fetch all templates
    console.log("Step 2: Fetching all templates...")
    const { data: allTemplates, error: fetchError } = await supabase
      .from("mock_exam_templates")
      .select(`
        id,
        title,
        description,
        category,
        difficulty_level,
        time_limit_minutes,
        total_questions,
        passing_score,
        is_featured,
        is_active,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch templates",
        details: fetchError.message,
        step: "fetch_all",
      })
    }

    console.log(`✅ Found ${allTemplates?.length || 0} total templates`)

    // Step 3: Try to fetch only active templates
    console.log("Step 3: Fetching active templates...")
    const { data: activeTemplates, error: activeError } = await supabase
      .from("mock_exam_templates")
      .select("*")
      .eq("is_active", true)

    if (activeError) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch active templates",
        details: activeError.message,
        step: "fetch_active",
      })
    }

    console.log(`✅ Found ${activeTemplates?.length || 0} active templates`)

    // Step 4: Try to fetch featured templates
    console.log("Step 4: Fetching featured templates...")
    const { data: featuredTemplates, error: featuredError } = await supabase
      .from("mock_exam_templates")
      .select("*")
      .eq("is_featured", true)
      .eq("is_active", true)

    if (featuredError) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch featured templates",
        details: featuredError.message,
        step: "fetch_featured",
      })
    }

    console.log(`✅ Found ${featuredTemplates?.length || 0} featured templates`)

    // Step 5: Check if we have questions for templates
    console.log("Step 5: Checking questions...")
    let questionsCheck = null
    if (allTemplates && allTemplates.length > 0) {
      const { data: questions, error: questionsError } = await supabase
        .from("mock_exam_questions")
        .select("template_id, count(*)")
        .in(
          "template_id",
          allTemplates.map((t) => t.id),
        )

      if (!questionsError && questions) {
        questionsCheck = questions
      }
    }

    // Step 6: Sample template data
    const sampleTemplate = activeTemplates?.[0] || null

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          total: allTemplates?.length || 0,
          active: activeTemplates?.length || 0,
          featured: featuredTemplates?.length || 0,
        },
        templates: {
          all: allTemplates || [],
          active: activeTemplates || [],
          featured: featuredTemplates || [],
        },
        questionsCheck,
        sampleTemplate,
      },
      message: "All template access tests passed successfully!",
    })
  } catch (error: any) {
    console.error("❌ Test failed:", error)
    return NextResponse.json({
      success: false,
      error: "Test execution failed",
      details: error.message,
      step: "execution",
    })
  }
}
