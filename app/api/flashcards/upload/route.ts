import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return NextResponse.json({ error: "File and userId are required" }, { status: 400 })
    }

    console.log("📁 Processing file upload:", file.name, file.type, file.size)

    // Read file content
    const fileContent = await file.text()

    // Save to database
    const { data: uploadRecord, error } = await supabase
      .from("uploaded_documents")
      .insert({
        user_id: userId,
        filename: `${Date.now()}-${file.name}`,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        processed_text: fileContent,
        processing_status: "completed",
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error saving upload:", error)
      return NextResponse.json({ error: "Failed to save file" }, { status: 500 })
    }

    console.log("✅ File uploaded successfully:", uploadRecord.id)

    return NextResponse.json({
      success: true,
      documentId: uploadRecord.id,
      content: fileContent.substring(0, 500) + (fileContent.length > 500 ? "..." : ""),
      message: "File uploaded and processed successfully",
    })
  } catch (error) {
    console.error("❌ Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
  }
}
