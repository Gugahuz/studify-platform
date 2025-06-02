import type { ScheduleItem, WeekDay } from "@/types/schedule"

// Converter horário (HH:MM) para minutos desde meia-noite
export function timeToMinutes(time: string): number {
  if (!time || !time.includes(":")) {
    console.warn("Horário inválido:", time)
    return 0
  }

  const [hours, minutes] = time.split(":").map(Number)

  if (isNaN(hours) || isNaN(minutes)) {
    console.warn("Horário com formato inválido:", time)
    return 0
  }

  return hours * 60 + minutes
}

// Converter minutos para horário (HH:MM)
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

// Verificar se há conflito de horário entre aulas
export function checkTimeConflict(
  newItem: { day: WeekDay; startTime: string; duration: number },
  existingSchedule: ScheduleItem[],
  excludeId?: string,
): boolean {
  try {
    const newStart = timeToMinutes(newItem.startTime)
    const newEnd = newStart + newItem.duration

    return existingSchedule.some((item) => {
      // Pular o item que está sendo editado
      if (excludeId && item.id === excludeId) return false

      // Verificar apenas o mesmo dia
      if (item.day !== newItem.day) return false

      const itemStart = timeToMinutes(item.startTime)
      const itemEnd = itemStart + item.duration

      // Verificar sobreposição de horários
      const hasOverlap = newStart < itemEnd && newEnd > itemStart

      if (hasOverlap) {
        console.log("Conflito detectado:", {
          novo: `${newItem.day} ${newItem.startTime}-${minutesToTime(newEnd)}`,
          existente: `${item.day} ${item.startTime}-${minutesToTime(itemEnd)}`,
          item: item.subject,
        })
      }

      return hasOverlap
    })
  } catch (error) {
    console.error("Erro ao verificar conflito de horário:", error)
    return false
  }
}

// Obter próxima aula do dia
export function getNextClass(schedule: ScheduleItem[], day: WeekDay): ScheduleItem | null {
  const daySchedule = schedule.filter((item) => item.day === day)

  if (daySchedule.length === 0) return null

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Encontrar a próxima aula do dia
  const nextClass = daySchedule
    .filter((item) => timeToMinutes(item.startTime) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0]

  return nextClass || null
}

// Calcular total de horas de estudo por semana
export function calculateWeeklyHours(schedule: ScheduleItem[]): number {
  return schedule.reduce((total, item) => total + item.duration / 60, 0)
}

// Obter estatísticas por matéria
export function getSubjectStats(schedule: ScheduleItem[]) {
  const stats: Record<string, { hours: number; sessions: number; nextSession?: string }> = {}

  schedule.forEach((item) => {
    if (!stats[item.subject]) {
      stats[item.subject] = { hours: 0, sessions: 0 }
    }

    stats[item.subject].hours += item.duration / 60
    stats[item.subject].sessions += 1

    // Encontrar próxima sessão (simplificado)
    if (!stats[item.subject].nextSession) {
      stats[item.subject].nextSession = `${item.day}, ${item.startTime}`
    }
  })

  return stats
}
