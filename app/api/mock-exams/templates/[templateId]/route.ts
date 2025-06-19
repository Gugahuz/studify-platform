import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

const supabase = createClient()

// Get specific mock exam template with questions
export async function GET(request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const templateId = params.templateId

    if (!templateId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId)) {
      return NextResponse.json({ success: false, error: "Valid template ID is required" }, { status: 400 })
    }

    console.log("📚 Fetching mock exam template:", templateId)

    // Get template details
    const { data: template, error: templateError } = await supabase
      .from("mock_exam_templates")
      .select(`
        *,
        flashcard_subjects (
          id,
          name,
          category,
          color
        )
      `)
      .eq("id", templateId)
      .eq("is_active", true)
      .single()

    if (templateError) {
      console.error("❌ Error fetching template:", templateError)
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    // Get template questions
    const { data: questions, error: questionsError } = await supabase
      .from("mock_exam_questions")
      .select("*")
      .eq("template_id", templateId)
      .order("question_number", { ascending: true })

    if (questionsError) {
      console.error("❌ Error fetching questions:", questionsError)
      return NextResponse.json({ success: false, error: "Failed to fetch questions" }, { status: 500 })
    }

    console.log(`✅ Found template with ${questions?.length || 0} questions`)

    return NextResponse.json({
      success: true,
      data: {
        template,
        questions: questions || [],
      },
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/templates/[templateId] GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Update mock exam template
export async function PUT(request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const templateId = params.templateId
    const body = await request.json()

    if (!templateId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId)) {
      return NextResponse.json({ success: false, error: "Valid template ID is required" }, { status: 400 })
    }

    console.log("📝 Updating mock exam template:", templateId)

    const { data: template, error } = await supabase
      .from("mock_exam_templates")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .eq("created_by", user.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error updating template:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ Mock exam template updated")

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/templates/[templateId] PUT:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Delete mock exam template
export async function DELETE(request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const templateId = params.templateId

    if (!templateId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(templateId)) {
      return NextResponse.json({ success: false, error: "Valid template ID is required" }, { status: 400 })
    }

    console.log("🗑️ Deleting mock exam template:", templateId)

    // Soft delete - mark as inactive
    const { data: template, error } = await supabase
      .from("mock_exam_templates")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .eq("created_by", user.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error deleting template:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ Mock exam template deleted")

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    })
  } catch (error: any) {
    console.error("❌ Error in mock-exams/templates/[templateId] DELETE:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
