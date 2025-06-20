export async function updateUserStatsAfterExam(examData: {
  userId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeMinutes?: number
}) {
  try {
    const response = await fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(examData),
    })

    if (response.ok) {
      console.log("✅ User stats updated successfully")
      return true
    } else {
      console.error("❌ Failed to update user stats")
      return false
    }
  } catch (error) {
    console.error("❌ Error updating user stats:", error)
    return false
  }
}
