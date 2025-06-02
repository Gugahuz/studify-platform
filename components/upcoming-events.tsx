"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Clock, Plus, Edit2, Trash2, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useEvents, type Event } from "@/hooks/use-events"

export function UpcomingEvents() {
  const { events, isLoading, error, addEvent, updateEvent, deleteEvent } = useEvents()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    type: "prova" as Event["type"],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Gerar datas para os próximos dias (apenas para UI)
  const getUpcomingDates = () => {
    const dates = []
    for (let i = 1; i <= 10; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      dates.push(`${day}/${month}`) // DD/MM format
    }
    return dates
  }

  const upcomingDates = getUpcomingDates()

  // Formatar data ISO para exibição DD/MM
  const formatDateForDisplay = (isoDate: string) => {
    const date = new Date(isoDate)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    return `${day}/${month}`
  }

  // Formatar hora ISO para exibição HH:MM
  const formatTimeForDisplay = (isoDate: string) => {
    const date = new Date(isoDate)
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${hours}:${minutes}`
  }

  const displayEvents = events.slice(0, 4)

  const getEventColor = (type: string) => {
    switch (type) {
      case "prova":
        return "bg-red-100 text-red-800"
      case "entrega":
        return "bg-blue-100 text-blue-800"
      case "simulado":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event)
      setFormData({
        title: event.title,
        date: formatDateForDisplay(event.event_date),
        time: formatTimeForDisplay(event.event_date),
        type: event.type,
      })
    } else {
      setEditingEvent(null)
      setFormData({
        title: "",
        date: "",
        time: "",
        type: "prova",
      })
    }
    setIsDialogOpen(true)
  }

  const validateDate = (dateStr: string): boolean => {
    // Check DD/MM format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})$/
    const match = dateStr.match(dateRegex)

    if (!match) return false

    const day = Number.parseInt(match[1])
    const month = Number.parseInt(match[2])

    return day >= 1 && day <= 31 && month >= 1 && month <= 12
  }

  const validateTime = (timeStr: string): boolean => {
    // Check HH:MM format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    return timeRegex.test(timeStr)
  }

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!formData.date.trim()) {
      toast({
        title: "Erro",
        description: "A data é obrigatória.",
        variant: "destructive",
      })
      return
    }

    if (!validateDate(formData.date)) {
      toast({
        title: "Data inválida",
        description: "Use o formato DD/MM (ex: 15/06).",
        variant: "destructive",
      })
      return
    }

    if (!formData.time.trim()) {
      toast({
        title: "Erro",
        description: "O horário é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!validateTime(formData.time)) {
      toast({
        title: "Horário inválido",
        description: "Use o formato HH:MM (ex: 14:30).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Converter data e hora para formato ISO
      const [day, month] = formData.date.split("/").map(Number)
      const [hours, minutes] = formData.time.split(":").map(Number)
      const year = new Date().getFullYear()
      const eventDate = new Date(year, month - 1, day, hours, minutes).toISOString()

      if (editingEvent) {
        // Atualizar evento existente
        const success = await updateEvent(editingEvent.id, {
          title: formData.title,
          event_date: eventDate,
          type: formData.type,
        })

        if (success) {
          toast({
            title: "Evento atualizado",
            description: "O evento foi atualizado com sucesso.",
          })
        }
      } else {
        // Adicionar novo evento
        const newEvent = await addEvent({
          title: formData.title,
          description: formData.title, // Usando título como descrição por padrão
          event_date: eventDate,
          type: formData.type,
        })

        if (newEvent) {
          toast({
            title: "Evento adicionado",
            description: "O evento foi adicionado com sucesso.",
          })
        }
      }

      setIsDialogOpen(false)
      setEditingEvent(null)
    } catch (err) {
      console.error("Erro ao salvar evento:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o evento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const success = await deleteEvent(eventId)
      if (success) {
        toast({
          title: "Evento excluído",
          description: "O evento foi excluído com sucesso.",
        })
      }
    } catch (err) {
      console.error("Erro ao excluir evento:", err)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o evento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Próximos eventos
            </CardTitle>
            <CardDescription>Provas e entregas agendadas</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Editar evento" : "Adicionar novo evento"}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? "Modifique as informações do evento." : "Preencha as informações do novo evento."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Prova de Matemática"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: Event["type"]) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prova">Prova</SelectItem>
                      <SelectItem value="entrega">Entrega</SelectItem>
                      <SelectItem value="simulado">Simulado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      value={formData.date}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "")
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4)
                        }
                        setFormData({ ...formData, date: value })
                      }}
                      placeholder="DD/MM"
                      maxLength={5}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      id="time"
                      value={formData.time}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d:]/g, "")
                        if (value.length === 2 && !value.includes(":")) {
                          value = value + ":"
                        }
                        setFormData({ ...formData, time: value })
                      }}
                      placeholder="HH:MM"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleSaveEvent} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : editingEvent ? (
                    "Salvar alterações"
                  ) : (
                    "Adicionar evento"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 group">
                <div className="flex items-start">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(event.type)}`}>
                    {formatDateForDisplay(event.event_date)}
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium">{event.title}</h4>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatTimeForDisplay(event.event_date)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(event)} className="h-8 w-8 p-0">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium mb-2">Organize seus próximos eventos</p>
                <p className="text-sm">
                  Aqui você deverá agendar seus próximos eventos, provas, atividades, simulados e até festinhas.
                </p>
                <p className="text-sm mt-2">Clique no botão + para adicionar seu primeiro evento</p>
              </div>
            )}
            {events.length > 4 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowAllEvents(true)}>
                  Ver todos ({events.length})
                </Button>
              </div>
            )}
          </div>
        )}

        <Dialog open={showAllEvents} onOpenChange={setShowAllEvents}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Todos os Eventos</DialogTitle>
              <DialogDescription>Lista completa de eventos agendados</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-3 p-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start justify-between p-3 rounded-lg bg-gray-50 group">
                    <div className="flex items-start">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(event.type)}`}>
                        {formatDateForDisplay(event.event_date)}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium">{event.title}</h4>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatTimeForDisplay(event.event_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowAllEvents(false)
                          handleOpenDialog(event)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowAllEvents(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
