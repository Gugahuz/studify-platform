"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ScheduleItem, WeekDay } from "@/types/schedule"
import { useUserData } from "@/hooks/use-user-data"
import { useToast } from "@/hooks/use-toast"
import {
  getScheduleItems,
  addScheduleItem as addScheduleItemSupabase,
  updateScheduleItem as updateScheduleItemSupabase,
  deleteScheduleItem as deleteScheduleItemSupabase,
  migrateLocalScheduleToSupabase,
} from "@/utils/schedule-supabase"

export function useSchedule() {
  const { userProfile } = useUserData()
  const { toast } = useToast()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  // Reference to store the latest schedule data for optimistic updates
  const scheduleRef = useRef<ScheduleItem[]>([])

  // Update ref whenever schedule changes
  useEffect(() => {
    scheduleRef.current = schedule
  }, [schedule])

  // Force re-render
  const forceUpdate = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  // Load schedule data
  useEffect(() => {
    if (!userProfile?.id) {
      setIsLoading(false)
      return
    }

    const loadSchedule = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("📅 Loading schedule for user:", userProfile.id)

        // Fetch data from Supabase
        const { data: supabaseData, error: supabaseError } = await getScheduleItems(userProfile.id)

        if (supabaseError) {
          console.error("Error fetching data from Supabase:", supabaseError.message)
          throw new Error(`Error fetching data from Supabase: ${supabaseError.message}`)
        }

        if (!supabaseData || supabaseData.length === 0) {
          // Attempt to migrate from localStorage if no data in Supabase
          console.log("📦 Attempting to migrate data from localStorage")
          const { success, migratedCount } = await migrateLocalScheduleToSupabase(userProfile.id)

          if (success && migratedCount > 0) {
            // Fetch again after migration
            const { data: migratedData, error: migratedError } = await getScheduleItems(userProfile.id)

            if (migratedError) {
              console.error("Error fetching migrated data:", migratedError.message)
              throw new Error(`Error fetching migrated data: ${migratedError.message}`)
            }

            setSchedule(migratedData || [])
            scheduleRef.current = migratedData || []

            toast({
              title: "Schedule migrated!",
              description: `${migratedCount} items have been migrated to the cloud.`,
            })
          } else {
            setSchedule([])
            scheduleRef.current = []
          }
        } else {
          setSchedule(supabaseData)
          scheduleRef.current = supabaseData
        }
      } catch (err: any) {
        console.error("❌ Error loading schedule:", err)
        setError("Could not load your schedule. Trying to use local data...")

        // Fallback to localStorage on error
        try {
          const localStorageKey = `schedule_${userProfile.id}`
          const localData = localStorage.getItem(localStorageKey)
          if (localData) {
            const localSchedule = JSON.parse(localData)
            const parsedSchedule = Array.isArray(localSchedule) ? localSchedule : []
            setSchedule(parsedSchedule)
            scheduleRef.current = parsedSchedule
            console.log("📱 Using localStorage data as fallback")
          } else {
            setSchedule([])
            scheduleRef.current = []
          }
        } catch (localError) {
          console.error("❌ Error loading local data:", localError)
          setSchedule([])
          scheduleRef.current = []
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadSchedule()
  }, [userProfile?.id, toast])

  // Add schedule item with optimistic updates
  const addScheduleItem = async (item: Omit<ScheduleItem, "id">) => {
    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      })
      return
    }

    // Create temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`

    // Create optimistic item
    const optimisticItem: ScheduleItem = {
      ...item,
      id: tempId,
    }

    // Apply optimistic update
    setSchedule((prev) => [...prev, optimisticItem])

    // Force update
    forceUpdate()

    try {
      console.log("➕ Adding schedule item:", item)
      const { data, error } = await addScheduleItemSupabase(item, userProfile.id)

      if (error) {
        console.error("Error adding item to Supabase:", error.message)
        throw new Error(`Error adding item to Supabase: ${error.message}`)
      }

      if (data) {
        console.log("✅ Item added successfully:", data)

        // Replace optimistic item with real data
        setSchedule((prev) => prev.map((i) => (i.id === tempId ? data : i)))

        // Force update
        forceUpdate()

        toast({
          title: "Class added!",
          description: "New class has been added to your schedule.",
        })
      }
    } catch (err: any) {
      console.error("❌ Error adding item:", err)

      toast({
        title: "Error",
        description: "Could not add class. Please try again.",
        variant: "destructive",
      })

      // Revert optimistic update on error
      setSchedule((prev) => prev.filter((i) => i.id !== tempId))
      forceUpdate()

      // Fallback to localStorage
      try {
        const newItem: ScheduleItem = {
          ...item,
          id: crypto.randomUUID(),
        }

        setSchedule((prev) => {
          const newSchedule = [...prev, newItem]
          localStorage.setItem(`schedule_${userProfile.id}`, JSON.stringify(newSchedule))
          console.log("📱 Item saved to localStorage as fallback")
          return newSchedule
        })

        forceUpdate()
      } catch (localError) {
        console.error("❌ Error with localStorage fallback:", localError)
      }
    }
  }

  // Update schedule item with optimistic updates
  const updateScheduleItem = async (id: string, updates: Partial<ScheduleItem>) => {
    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      })
      return
    }

    // Find current item
    const currentItem = scheduleRef.current.find((item) => item.id === id)

    if (!currentItem) {
      console.error("Item not found for update:", id)
      return
    }

    // Create optimistic item
    const optimisticItem: ScheduleItem = {
      ...currentItem,
      ...updates,
    }

    // Apply optimistic update
    setSchedule((prev) => prev.map((item) => (item.id === id ? optimisticItem : item)))

    // Force update
    forceUpdate()

    try {
      console.log("✏️ Updating schedule item:", id, updates)
      const { data, error } = await updateScheduleItemSupabase(id, updates, userProfile.id)

      if (error) {
        console.error("Error updating item in Supabase:", error.message)
        throw new Error(`Error updating item in Supabase: ${error.message}`)
      }

      if (data) {
        console.log("✅ Item updated successfully:", data)

        // Update with real server data
        setSchedule((prev) => prev.map((item) => (item.id === id ? data : item)))

        // Force update
        forceUpdate()

        toast({
          title: "Class updated!",
          description: "Class information has been saved.",
        })
      }
    } catch (err: any) {
      console.error("❌ Error updating item:", err)

      toast({
        title: "Error",
        description: "Could not update class. Please try again.",
        variant: "destructive",
      })

      // Revert optimistic update on error
      setSchedule((prev) => {
        const originalItem = scheduleRef.current.find((item) => item.id === id)
        return prev.map((item) => (item.id === id ? originalItem || item : item))
      })

      forceUpdate()

      // Fallback to localStorage
      try {
        setSchedule((prev) => {
          const newSchedule = prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
          localStorage.setItem(`schedule_${userProfile.id}`, JSON.stringify(newSchedule))
          console.log("📱 Item updated in localStorage as fallback")
          return newSchedule
        })

        forceUpdate()
      } catch (localError) {
        console.error("❌ Error with localStorage fallback:", localError)
      }
    }
  }

  // Delete schedule item with optimistic updates
  const deleteScheduleItem = async (id: string) => {
    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive",
      })
      return
    }

    // Store item for possible reversion
    const deletedItem = scheduleRef.current.find((item) => item.id === id)

    // Apply optimistic update
    setSchedule((prev) => prev.filter((item) => item.id !== id))

    // Force update
    forceUpdate()

    try {
      console.log("🗑️ Deleting schedule item:", id)
      const { error } = await deleteScheduleItemSupabase(id, userProfile.id)

      if (error) {
        console.error("Error deleting item from Supabase:", error.message)
        throw new Error(`Error deleting item from Supabase: ${error.message}`)
      }

      console.log("✅ Item deleted successfully")

      // Force update
      forceUpdate()

      toast({
        title: "Class removed!",
        description: "Class has been removed from your schedule.",
      })
    } catch (err: any) {
      console.error("❌ Error deleting item:", err)

      toast({
        title: "Error",
        description: "Could not delete class. Please try again.",
        variant: "destructive",
      })

      // Revert optimistic update on error
      if (deletedItem) {
        setSchedule((prev) => [...prev, deletedItem])
        forceUpdate()
      }

      // Fallback to localStorage
      try {
        setSchedule((prev) => {
          const newSchedule = prev.filter((item) => item.id !== id)
          localStorage.setItem(`schedule_${userProfile.id}`, JSON.stringify(newSchedule))
          console.log("📱 Item deleted from localStorage as fallback")
          return newSchedule
        })

        forceUpdate()
      } catch (localError) {
        console.error("❌ Error with localStorage fallback:", localError)
      }
    }
  }

  const getScheduleForDay = (day: WeekDay) => {
    return schedule.filter((item) => item.day === day)
  }

  // Public API
  return {
    schedule,
    isLoading,
    error,
    addScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    getScheduleForDay,
    version,
  }
}

export default useSchedule
