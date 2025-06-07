"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Clock, Plus, Edit2, AlertCircle } from "lucide-react"
import { getCurrentWeekDates } from "@/utils/date-helpers"
import { useSchedule } from "@/hooks/use-schedule"
import { ScheduleEditor } from "@/components/schedule-editor"
import { WEEK_DAYS, type ScheduleItem, type WeekDay } from "@/types/schedule"
import { ComingSoonHover } from "@/components/coming-soon-hover"
import { useIsMobile } from "@/hooks/use-mobile"

export default function CronogramaPage() {
  const { schedule, isLoading, error, getScheduleForDay, version } = useSchedule()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
  const [selectedDay, setSelectedDay] = useState<WeekDay>("Segunda")
  const [selectedTime, setSelectedTime] = useState<string>("08:00")
  const [activeTab, setActiveTab] = useState("semanal")
  const isMobile = useIsMobile()

  // Date information
  const { start, end } = getCurrentWeekDates()
  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  // Time slots for the schedule
  const timeSlots = useMemo(
    () =>
      Array.from({ length: 13 }, (_, i) => {
        const hour = 8 + i
        const nextHour = hour + 1
        return {
          time: `${hour.toString().padStart(2, "0")}:00`,
          range: `${hour.toString().padStart(2, "0")}:00 - ${nextHour.toString().padStart(2, "0")}:00`,
        }
      }),
    [],
  )

  // Handle adding a class
  const handleAddClass = useCallback((day: WeekDay, time: string) => {
    setSelectedDay(day)
    setSelectedTime(time)
    setEditingItem(null)
    setIsEditorOpen(true)
  }, [])

  // Handle editing a class
  const handleEditClass = useCallback((item: ScheduleItem) => {
    setEditingItem(item)
    setIsEditorOpen(true)
  }, [])

  // Calculate subject statistics
  const subjectStats = useMemo(() => {
    const stats: Record<string, { hours: number; nextSession: string }> = {}

    schedule.forEach((item) => {
      if (!stats[item.subject]) {
        stats[item.subject] = { hours: 0, nextSession: "" }
      }
      stats[item.subject].hours += item.duration / 60

      // Find next session (simplified - just use the first occurrence)
      if (!stats[item.subject].nextSession) {
        stats[item.subject].nextSession = `${item.day}, ${item.startTime}`
      }
    })

    return stats
  }, [schedule])

  // Format time range
  const formatTimeRange = useCallback((startTime: string, duration: number) => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = startTotalMinutes + duration
    const endHour = Math.floor(endTotalMinutes / 60)
    const endMinute = endTotalMinutes % 60

    const endTimeString = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`
    return `${startTime} - ${endTimeString}`
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" key={version}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cronograma de Estudos</h1>
          <p className="text-gray-600">Organize seu tempo e maximize seu aprendizado</p>
          {schedule.length > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              {schedule.length} aula{schedule.length !== 1 ? "s" : ""} agendada{schedule.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {currentMonth}
          </Button>
          <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => handleAddClass("Segunda", "08:00")}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar aula
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Houve um problema ao carregar seu cronograma</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="semanal" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="semanal">Visão Semanal</TabsTrigger>
          <TabsTrigger value="materias">Por Matérias</TabsTrigger>
        </TabsList>

        <TabsContent value="semanal" className="mt-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Semana atual</CardTitle>
              <CardDescription>
                {start} a {end}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile-optimized layout */}
              {isMobile ? (
                <div className="space-y-4">
                  {/* Day selector for mobile */}
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {WEEK_DAYS.map((day) => {
                      const daySchedule = getScheduleForDay(day)
                      const hasClasses = daySchedule.length > 0
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedDay === day
                              ? "bg-blue-600 text-white"
                              : hasClasses
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {day}
                          {hasClasses && <span className="ml-1 w-2 h-2 bg-current rounded-full inline-block"></span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Selected day schedule */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{selectedDay}</h3>
                      <Button
                        size="sm"
                        onClick={() => handleAddClass(selectedDay, "08:00")}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    {/* Time slots for selected day */}
                    <div className="space-y-2">
                      {timeSlots.map((slot) => {
                        const daySchedule = getScheduleForDay(selectedDay)
                        const currentHour = Number.parseInt(slot.time.split(":")[0])

                        // Find class at this time
                        const classAtThisTime = daySchedule.find((item) => {
                          const itemStartHour = Number.parseInt(item.startTime.split(":")[0])
                          const itemStartMinute = Number.parseInt(item.startTime.split(":")[1])
                          return itemStartHour === currentHour && itemStartMinute === 0
                        })

                        // Check if this slot is part of an ongoing class
                        const ongoingClass = daySchedule.find((item) => {
                          const itemStartHour = Number.parseInt(item.startTime.split(":")[0])
                          const itemDurationHours = Math.ceil(item.duration / 60)
                          const itemEndHour = itemStartHour + itemDurationHours
                          return currentHour >= itemStartHour && currentHour < itemEndHour
                        })

                        // Don't render if it's part of an ongoing class but not the start
                        if (ongoingClass && !classAtThisTime) {
                          return null
                        }

                        return (
                          <div
                            key={slot.time}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              classAtThisTime
                                ? `${classAtThisTime.color} border-gray-200 shadow-sm`
                                : "border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                            }`}
                            onClick={() =>
                              classAtThisTime
                                ? handleEditClass(classAtThisTime)
                                : handleAddClass(selectedDay, slot.time)
                            }
                          >
                            {classAtThisTime ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-600">{slot.time}</span>
                                  <Edit2 className="h-4 w-4 text-gray-400" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{classAtThisTime.subject}</h4>
                                  <p className="text-sm text-gray-600 flex items-center mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTimeRange(classAtThisTime.startTime, classAtThisTime.duration)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-2">
                                <div className="text-sm font-medium text-gray-500 mb-1">{slot.time}</div>
                                <div className="flex items-center justify-center text-gray-400">
                                  <Plus className="h-4 w-4 mr-1" />
                                  <span className="text-xs">Adicionar aula</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {getScheduleForDay(selectedDay).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhuma aula agendada para {selectedDay}</p>
                        <p className="text-sm">Toque em um horário para adicionar</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Desktop table layout (existing code)
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="w-32 p-2 border border-gray-200 bg-gray-50 text-sm font-medium">Horário</th>
                        {WEEK_DAYS.map((day) => (
                          <th
                            key={day}
                            className="p-2 border border-gray-200 bg-gray-50 text-sm font-medium min-w-[120px]"
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((slot) => (
                        <tr key={slot.time} className="h-12">
                          <td className="p-2 border border-gray-200 bg-gray-50 text-xs text-center font-medium">
                            {isMobile ? slot.time : slot.range}
                          </td>
                          {WEEK_DAYS.map((day) => {
                            const daySchedule = getScheduleForDay(day)
                            const currentHour = Number.parseInt(slot.time.split(":")[0])

                            const classAtThisTime = daySchedule.find((item) => {
                              const itemStartHour = Number.parseInt(item.startTime.split(":")[0])
                              const itemStartMinute = Number.parseInt(item.startTime.split(":")[1])
                              return itemStartHour === currentHour && itemStartMinute === 0
                            })

                            const ongoingClass = daySchedule.find((item) => {
                              const itemStartHour = Number.parseInt(item.startTime.split(":")[0])
                              const itemStartMinute = Number.parseInt(item.startTime.split(":")[1])
                              const itemDurationHours = Math.ceil(item.duration / 60)
                              const itemEndHour = itemStartHour + itemDurationHours

                              return currentHour >= itemStartHour && currentHour < itemEndHour && itemStartMinute === 0
                            })

                            if (classAtThisTime) {
                              const durationHours = Math.ceil(classAtThisTime.duration / 60)
                              return (
                                <td
                                  key={`${day}-${slot.time}-${classAtThisTime.id}`}
                                  rowSpan={durationHours}
                                  className={`p-2 border border-gray-200 cursor-pointer hover:shadow-md transition-all ${classAtThisTime.color} relative group`}
                                  onClick={() => handleEditClass(classAtThisTime)}
                                >
                                  <div className="text-xs font-medium text-center line-clamp-2">
                                    {classAtThisTime.subject}
                                  </div>
                                  <div className="text-xs text-center mt-1 flex items-center justify-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTimeRange(classAtThisTime.startTime, classAtThisTime.duration)}
                                  </div>
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 className="h-3 w-3" />
                                  </div>
                                </td>
                              )
                            }

                            if (ongoingClass && ongoingClass !== classAtThisTime) {
                              return null
                            }

                            return (
                              <td
                                key={`${day}-${slot.time}-empty`}
                                className="p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => handleAddClass(day, slot.time)}
                              >
                                <div className="h-8 flex items-center justify-center">
                                  <Plus className="h-4 w-4 text-gray-300 opacity-0 hover:opacity-100 transition-opacity" />
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500 text-center">
                {isMobile
                  ? "Toque em um horário para adicionar uma aula ou toque em uma aula existente para editá-la"
                  : "Clique em um horário vazio para adicionar uma aula ou clique em uma aula existente para editá-la"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materias" className="mt-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Organização por matérias</CardTitle>
              <CardDescription>Visualize seu tempo dedicado a cada disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(subjectStats).map(([subject, stats]) => (
                  <div key={subject} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-blue-100 mr-3"></div>
                        <h3 className="font-medium">{subject}</h3>
                      </div>
                      <ComingSoonHover>
                        <Button variant="ghost" size="sm" disabled>
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </ComingSoonHover>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Horas semanais</div>
                        <div className="text-xl font-bold">{stats.hours.toFixed(1)}h</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Próxima sessão</div>
                        <div className="text-lg font-medium">{stats.nextSession}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Progresso</div>
                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(stats.hours * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {Object.keys(subjectStats).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma aula agendada</p>
                    <p className="text-sm">Clique em "Adicionar aula" para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ScheduleEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        editingItem={editingItem}
        defaultDay={selectedDay}
        defaultTime={selectedTime}
      />
    </div>
  )
}
