"use client"

import { useState, useEffect } from "react"
import { useUserData } from "@/hooks/use-user-data"
import { getUserStreakData, updateUserStreak, calculateNewStreak, migrateLocalStreakData } from "@/utils/streak-helpers"

export function useDailyStreak() {
  const { userProfile } = useUserData()
  const [streak, setStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userProfile?.id) {
      setIsLoading(false)
      return
    }

    const checkAndUpdateStreak = async () => {
      try {
        console.log("🔐 Iniciando verificação de streak para usuário:", userProfile.id)
        setError(null)

        // Primeiro, tentar migrar dados do localStorage
        await migrateLocalStreakData(userProfile.id)

        // Buscar dados atuais do usuário no Supabase
        const userData = await getUserStreakData(userProfile.id)

        if (!userData) {
          throw new Error("Não foi possível buscar dados do usuário")
        }

        // Calcular novo streak baseado na última data de login
        const today = new Date()
        const todayString = today.toISOString().split("T")[0]

        const { newStreak, shouldUpdate } = calculateNewStreak(userData.last_login_date, userData.current_streak || 0)

        // Atualizar no banco se necessário
        if (shouldUpdate) {
          const success = await updateUserStreak(userProfile.id, newStreak, todayString)

          if (!success) {
            throw new Error("Falha ao atualizar streak no banco de dados")
          }
        }

        setStreak(newStreak)
        console.log("✅ Streak verificado e atualizado:", newStreak)
      } catch (error) {
        console.error("❌ Erro ao verificar sequência:", error)
        setError(error instanceof Error ? error.message : "Erro desconhecido")

        // Fallback para localStorage em caso de erro
        try {
          const lastLoginKey = `lastLogin_${userProfile.id}`
          const streakKey = `streak_${userProfile.id}`
          const localStreak = localStorage.getItem(streakKey)

          if (localStreak) {
            setStreak(Number.parseInt(localStreak))
            console.log("🔄 Usando dados do localStorage como fallback:", localStreak)
          } else {
            setStreak(0)
          }
        } catch (localError) {
          console.error("❌ Erro no fallback do localStorage:", localError)
          setStreak(0)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAndUpdateStreak()
  }, [userProfile])

  // Função para forçar atualização do streak (útil para testes)
  const refreshStreak = async () => {
    if (!userProfile?.id) return

    setIsLoading(true)

    try {
      const userData = await getUserStreakData(userProfile.id)
      if (userData) {
        setStreak(userData.current_streak || 0)
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar streak:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    streak,
    isLoading,
    error,
    refreshStreak,
  }
}
