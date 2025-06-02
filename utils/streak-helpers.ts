import { supabase } from "@/lib/supabase"

export interface UserStreakData {
  current_streak: number | null
  last_login_date: string | null
}

/**
 * Busca os dados de streak do usuário no Supabase
 */
export async function getUserStreakData(userId: string): Promise<UserStreakData | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("current_streak, last_login_date")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Erro ao buscar dados de streak:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar dados de streak:", error)
    return null
  }
}

/**
 * Atualiza o streak do usuário no Supabase
 */
export async function updateUserStreak(userId: string, newStreak: number, loginDate: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        current_streak: newStreak,
        last_login_date: loginDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Erro ao atualizar streak:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao atualizar streak:", error)
    return false
  }
}

/**
 * Calcula o novo streak baseado na última data de login
 */
export function calculateNewStreak(
  lastLoginDate: string | null,
  currentStreak: number,
): { newStreak: number; shouldUpdate: boolean } {
  const today = new Date()
  const todayString = today.toISOString().split("T")[0]

  // Se não há data de último login, é o primeiro login
  if (!lastLoginDate) {
    return { newStreak: 1, shouldUpdate: true }
  }

  // Converter a data do último login para objeto Date
  const lastLogin = new Date(lastLoginDate)
  const lastLoginString = lastLogin.toISOString().split("T")[0]

  // Se é o mesmo dia, não atualizar
  if (lastLoginString === todayString) {
    return { newStreak: currentStreak, shouldUpdate: false }
  }

  // Calcular diferença em dias
  const diffTime = today.getTime() - lastLogin.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    // Dia consecutivo - incrementar streak
    return { newStreak: currentStreak + 1, shouldUpdate: true }
  } else {
    // Mais de um dia de diferença - resetar streak
    return { newStreak: 1, shouldUpdate: true }
  }
}

/**
 * Migra dados do localStorage para o Supabase (executado apenas uma vez)
 */
export async function migrateLocalStreakData(userId: string): Promise<void> {
  try {
    const lastLoginKey = `lastLogin_${userId}`
    const streakKey = `streak_${userId}`
    const migrationKey = `streakMigrated_${userId}`

    // Verificar se já foi migrado
    if (localStorage.getItem(migrationKey)) {
      return
    }

    const localStreak = localStorage.getItem(streakKey)
    const localLastLogin = localStorage.getItem(lastLoginKey)

    // Se há dados no localStorage, migrar para o Supabase
    if (localStreak && localLastLogin) {
      const success = await updateUserStreak(userId, Number.parseInt(localStreak), localLastLogin)

      if (success) {
        // Marcar como migrado e limpar localStorage
        localStorage.setItem(migrationKey, "true")
        localStorage.removeItem(lastLoginKey)
        localStorage.removeItem(streakKey)
        console.log("✅ Dados de streak migrados do localStorage para Supabase")
      }
    } else {
      // Marcar como migrado mesmo se não havia dados
      localStorage.setItem(migrationKey, "true")
    }
  } catch (error) {
    console.error("Erro ao migrar dados de streak:", error)
  }
}
