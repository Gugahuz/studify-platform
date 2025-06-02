"use client"

import { useState, useEffect } from "react"
import { useUserData } from "@/hooks/use-user-data"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export type Event = {
  id: string
  title: string
  description?: string
  event_date: string
  type: "prova" | "entrega" | "simulado"
  user_id: string
}

// Event emitter para notificar mudanças nos eventos
class EventEmitter {
  private listeners: { [key: string]: Function[] } = {}

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
  }

  emit(event: string, data?: any) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach((callback) => callback(data))
  }
}

export const eventEmitter = new EventEmitter()

export function useEvents() {
  const { userProfile } = useUserData()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar eventos do Supabase
  useEffect(() => {
    if (!userProfile?.id) return

    const fetchEvents = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("user_id", userProfile.id)
          .order("event_date", { ascending: true })

        if (error) {
          throw error
        }

        const eventsData = data || []

        // Migrar eventos do localStorage para o Supabase (apenas na primeira vez)
        const localEvents = localStorage.getItem("upcoming_events")
        if (localEvents && eventsData.length === 0) {
          const parsedEvents = JSON.parse(localEvents)
          if (parsedEvents && Array.isArray(parsedEvents) && parsedEvents.length > 0) {
            await migrateLocalEventsToSupabase(parsedEvents)
            // Buscar novamente após migração
            const { data: updatedData } = await supabase
              .from("events")
              .select("*")
              .eq("user_id", userProfile.id)
              .order("event_date", { ascending: true })

            const finalData = updatedData || []
            setEvents(finalData)
            eventEmitter.emit("eventsUpdated", finalData)
          } else {
            setEvents(eventsData)
            eventEmitter.emit("eventsUpdated", eventsData)
          }
        } else {
          setEvents(eventsData)
          eventEmitter.emit("eventsUpdated", eventsData)
        }
      } catch (err) {
        console.error("Erro ao carregar eventos:", err)
        setError("Não foi possível carregar seus eventos. Tente novamente mais tarde.")
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [userProfile?.id])

  // Função para migrar eventos do localStorage para o Supabase
  const migrateLocalEventsToSupabase = async (localEvents: any[]) => {
    if (!userProfile?.id) return

    try {
      const eventsToInsert = localEvents.map((event) => {
        // Converter formato de data DD/MM para ISO
        const [day, month] = event.date.split("/").map(Number)
        const year = new Date().getFullYear()
        const [hours, minutes] = event.time.split(":").map(Number)

        const eventDate = new Date(year, month - 1, day, hours, minutes)

        return {
          id: uuidv4(),
          title: event.title,
          description: event.title,
          event_date: eventDate.toISOString(),
          type: event.type,
          user_id: userProfile.id,
        }
      })

      const { error } = await supabase.from("events").insert(eventsToInsert)

      if (error) {
        throw error
      }

      localStorage.removeItem("upcoming_events")
      console.log("Eventos migrados com sucesso do localStorage para o Supabase")
    } catch (err) {
      console.error("Erro ao migrar eventos:", err)
    }
  }

  // Adicionar um novo evento
  const addEvent = async (eventData: Omit<Event, "id" | "user_id">) => {
    if (!userProfile?.id) return null

    try {
      const newEvent = {
        id: uuidv4(),
        ...eventData,
        user_id: userProfile.id,
      }

      const { data, error } = await supabase.from("events").insert(newEvent).select().single()

      if (error) {
        throw error
      }

      // Atualizar o estado local imediatamente
      setEvents((prevEvents) => {
        const currentEvents = Array.isArray(prevEvents) ? prevEvents : []
        const updatedEvents = [...currentEvents, data].sort(
          (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
        )

        // Emitir eventos para outros componentes
        eventEmitter.emit("eventsUpdated", updatedEvents)
        eventEmitter.emit("eventAdded", data)

        return updatedEvents
      })

      return data
    } catch (err) {
      console.error("Erro ao adicionar evento:", err)
      setError("Não foi possível adicionar o evento. Tente novamente.")
      return null
    }
  }

  // Atualizar um evento existente
  const updateEvent = async (id: string, updates: Partial<Omit<Event, "id" | "user_id">>) => {
    if (!userProfile?.id) return false

    try {
      const { error } = await supabase.from("events").update(updates).eq("id", id).eq("user_id", userProfile.id)

      if (error) {
        throw error
      }

      setEvents((prevEvents) => {
        const currentEvents = Array.isArray(prevEvents) ? prevEvents : []
        const updatedEvents = currentEvents
          .map((event) => (event.id === id ? { ...event, ...updates } : event))
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

        eventEmitter.emit("eventsUpdated", updatedEvents)
        return updatedEvents
      })

      return true
    } catch (err) {
      console.error("Erro ao atualizar evento:", err)
      setError("Não foi possível atualizar o evento. Tente novamente.")
      return false
    }
  }

  // Excluir um evento
  const deleteEvent = async (id: string) => {
    if (!userProfile?.id) return false

    try {
      const { error } = await supabase.from("events").delete().eq("id", id).eq("user_id", userProfile.id)

      if (error) {
        throw error
      }

      setEvents((prevEvents) => {
        const currentEvents = Array.isArray(prevEvents) ? prevEvents : []
        const updatedEvents = currentEvents.filter((event) => event.id !== id)

        eventEmitter.emit("eventsUpdated", updatedEvents)
        return updatedEvents
      })

      return true
    } catch (err) {
      console.error("Erro ao excluir evento:", err)
      setError("Não foi possível excluir o evento. Tente novamente.")
      return false
    }
  }

  return {
    events: Array.isArray(events) ? events : [],
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  }
}
