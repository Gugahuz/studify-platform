import { NextResponse } from "next/server"
import { comprehensiveSubjectsData } from "@/lib/comprehensive-subjects-data"

export async function GET() {
  try {
    // Use the updated comprehensive subjects data
    const subjects: { [category: string]: any[] } = {}
    const categories = Object.keys(comprehensiveSubjectsData)

    categories.forEach((category) => {
      subjects[category] = comprehensiveSubjectsData[category].map((subject) => ({
        ...subject,
        topicCount: subject.topics.length,
        totalEstimatedCards: subject.topics.reduce((sum, topic) => sum + topic.estimated_cards, 0),
      }))
    })

    return NextResponse.json({
      success: true,
      subjects,
      categories,
      totalSubjects: Object.values(comprehensiveSubjectsData).flat().length,
      totalTopics: Object.values(comprehensiveSubjectsData)
        .flat()
        .reduce((sum, subject) => sum + subject.topics.length, 0),
    })
  } catch (error) {
    console.error("Error loading comprehensive subjects:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load comprehensive subjects",
        subjects: {},
        categories: [],
      },
      { status: 500 },
    )
  }
}
