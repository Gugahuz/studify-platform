import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const subjectId = searchParams.get("subjectId")
    const contentType = searchParams.get("contentType")
    const search = searchParams.get("search")

    let query = supabase
      .from("content_library")
      .select(`
        *,
        flashcard_subjects(name, color),
        flashcard_topics(name)
      `)
      .range(offset, offset + limit - 1)

    if (subjectId && subjectId !== "all") {
      query = query.eq("subject_id", subjectId)
    }

    if (contentType && contentType !== "all") {
      query = query.eq("content_type", contentType)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,keywords.cs.{${search}}`)
    }

    const { data: content, error, count } = await query

    if (error) {
      console.error("Erro ao buscar conteúdo da biblioteca:", error)
      return NextResponse.json({ error: "Falha ao buscar conteúdo" }, { status: 500 })
    }

    const pagination = {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    }

    return NextResponse.json({ content: content || [], pagination })
  } catch (error) {
    console.error("Erro na API de biblioteca de conteúdo:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
