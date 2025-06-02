import { supabase } from "@/lib/supabase"

/**
 * Verifica se uma tabela existe no Supabase
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", tableName)
      .eq("table_schema", "public")
      .single()

    if (error) {
      console.error(`Erro ao verificar tabela ${tableName}:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error)
    return false
  }
}

/**
 * Verifica se o Supabase está configurado corretamente
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("profiles").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Erro na conexão com Supabase:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao testar conexão com Supabase:", error)
    return false
  }
}

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 */
export async function checkUserPermission(userId: string, resourceId: string, resourceType: string): Promise<boolean> {
  try {
    switch (resourceType) {
      case "event":
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("user_id")
          .eq("id", resourceId)
          .single()

        if (eventError || !eventData) return false
        return eventData.user_id === userId

      case "schedule_item":
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("schedule_items")
          .select("user_id")
          .eq("id", resourceId)
          .single()

        if (scheduleError || !scheduleData) return false
        return scheduleData.user_id === userId

      default:
        return false
    }
  } catch (error) {
    console.error(`Erro ao verificar permissão para ${resourceType} ${resourceId}:`, error)
    return false
  }
}
