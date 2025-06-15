import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    // Fetch subjects with their topics
    const { data: subjects, error: subjectsError } = await supabase
      .from("flashcard_subjects")
      .select(`
        id,
        name,
        description,
        category,
        color,
        flashcard_topics (
          id,
          name,
          description
        )
      `)
      .order("name")

    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError)
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
    }

    // Group subjects by category
    const subjectsByCategory: { [key: string]: any[] } = {}

    subjects?.forEach((subject) => {
      const category = subject.category || "Outros"
      if (!subjectsByCategory[category]) {
        subjectsByCategory[category] = []
      }

      subjectsByCategory[category].push({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        category: subject.category,
        color: subject.color,
        icon: getIconForSubject(subject.name),
        topicCount: subject.flashcard_topics?.length || 0,
        totalEstimatedCards:
          subject.flashcard_topics?.reduce(
            (sum: number, topic: any) => sum + getEstimatedCardsForTopic(topic.name),
            0,
          ) || 0,
        topics:
          subject.flashcard_topics?.map((topic: any) => ({
            id: topic.id,
            name: topic.name,
            description: topic.description,
            estimated_cards: getEstimatedCardsForTopic(topic.name), // Use function to estimate
          })) || [],
      })
    })

    return NextResponse.json(subjectsByCategory)
  } catch (error) {
    console.error("Error in subjects API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getIconForSubject(subjectName: string): string {
  const iconMap: { [key: string]: string } = {
    Medicina: "User",
    Direito: "Scale",
    Odontologia: "Smile",
    Engenharia: "Code",
    Administração: "TrendingUp",
    Psicologia: "User",
    Matemática: "Calculator",
    Física: "Atom",
    Química: "Activity",
    Biologia: "Smile",
    História: "BookOpen",
    Geografia: "TrendingUp",
    Português: "Users",
  }

  return iconMap[subjectName] || "BookOpen"
}

function getEstimatedCardsForTopic(topicName: string): number {
  // Estimate cards based on topic complexity
  const complexTopics = ["Cardiologia", "Neurologia", "Cirurgia", "Direito Civil", "Direito Penal"]
  const mediumTopics = ["Anatomia", "Fisiologia", "Farmacologia", "Direito Administrativo"]

  if (complexTopics.some((topic) => topicName.includes(topic))) return 25
  if (mediumTopics.some((topic) => topicName.includes(topic))) return 20
  return 15 // Default for simpler topics
}
