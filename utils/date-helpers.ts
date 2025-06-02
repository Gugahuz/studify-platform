export function getCurrentDate(): string {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return now.toLocaleDateString("pt-BR", options)
}

export function getCurrentDateShort(): string {
  const now = new Date()
  return now.toLocaleDateString("pt-BR")
}

export function getCurrentWeekDates(): { start: string; end: string } {
  const now = new Date()
  const currentDay = now.getDay()
  const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1) // Adjust when day is Sunday

  const monday = new Date(now.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: monday.toLocaleDateString("pt-BR"),
    end: sunday.toLocaleDateString("pt-BR"),
  }
}

export function formatDateToBR(date: Date): string {
  return date.toLocaleDateString("pt-BR")
}

export function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) {
    return "Bom dia"
  } else if (hour < 18) {
    return "Boa tarde"
  } else {
    return "Boa noite"
  }
}
