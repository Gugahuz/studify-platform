export type WeekDay = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo"

export interface ScheduleItem {
  id: string
  day: WeekDay
  subject: string
  startTime: string
  duration: number // in minutes
  color: string
}

export const WEEK_DAYS: WeekDay[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

export const SUBJECT_COLORS = [
  "bg-blue-100 border-blue-300",
  "bg-purple-100 border-purple-300",
  "bg-green-100 border-green-300",
  "bg-red-100 border-red-300",
  "bg-yellow-100 border-yellow-300",
  "bg-indigo-100 border-indigo-300",
  "bg-orange-100 border-orange-300",
  "bg-pink-100 border-pink-300",
  "bg-teal-100 border-teal-300",
  "bg-cyan-100 border-cyan-300",
]

// Função para verificar conflitos de horário
export function checkTimeConflict(
  newItem: { day: WeekDay; startTime: string; duration: number },
  existingSchedule: ScheduleItem[],
  excludeId?: string,
): boolean {
  const newStart = timeToMinutes(newItem.startTime)
  const newEnd = newStart + newItem.duration

  return existingSchedule.some((item) => {
    if (excludeId && item.id === excludeId) return false
    if (item.day !== newItem.day) return false

    const itemStart = timeToMinutes(item.startTime)
    const itemEnd = itemStart + item.duration

    // Verificar sobreposição
    return newStart < itemEnd && newEnd > itemStart
  })
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}
