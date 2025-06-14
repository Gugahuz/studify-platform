import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("📚 Fetching flashcard subjects...")

    const { data: subjects, error } = await supabase
      .from("flashcard_subjects")
      .select(`
        *,
        flashcard_topics(
          id,
          name,
          description,
          difficulty_level
        )
      `)
      .order("category")
      .order("name")

    if (error) {
      console.error("❌ Error fetching subjects:", error)
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
    }

    console.log(`✅ Fetched ${subjects?.length || 0} subjects`)

    return NextResponse.json({ subjects: subjects || [] })
  } catch (error) {
    console.error("❌ Exception fetching subjects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
