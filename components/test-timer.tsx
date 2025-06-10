"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface TestTimerProps {
  initialTime: number // in seconds
  onTimeUp: () => void
  onTimeUpdate: (timeRemaining: number) => void
}

export function TestTimer({ initialTime, onTimeUp, onTimeUpdate }: TestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1
        onTimeUpdate(newTime)

        if (newTime <= 0) {
          onTimeUp()
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onTimeUp, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getTimerColor = () => {
    const percentage = (timeRemaining / initialTime) * 100
    if (percentage <= 10) return "text-red-600"
    if (percentage <= 25) return "text-orange-600"
    return "text-gray-700"
  }

  return (
    <div className={`flex items-center gap-2 font-mono text-lg ${getTimerColor()}`}>
      <Clock className="h-5 w-5" />
      <span>{formatTime(timeRemaining)}</span>
    </div>
  )
}
