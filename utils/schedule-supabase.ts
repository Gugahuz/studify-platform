import { supabase } from "@/lib/supabase"
import type { ScheduleItem, WeekDay } from "@/types/schedule"

export interface SupabaseScheduleItem {
  id: string
  user_id: string
  day: string
  start_time: string
  subject: string
  duration: number
  color: string
  created_at?: string
  updated_at?: string
}

// Converter item do Supabase para o formato do app
export function convertFromSupabase(item: SupabaseScheduleItem): ScheduleItem {
  return {
    id: item.id,
    day: item.day as WeekDay,
    startTime: item.start_time,
    subject: item.subject,
    duration: item.duration,
    color: item.color,
  }
}

// Converter item do app para o formato do Supabase
export function convertToSupabase(
  item: Omit<ScheduleItem, "id">,
  userId: string,
  id?: string,
): Omit<SupabaseScheduleItem, "created_at" | "updated_at"> {
  return {
    id: id || crypto.randomUUID(),
    user_id: userId,
    day: item.day,
    start_time: item.startTime,
    subject: item.subject,
    duration: item.duration,
    color: item.color,
  }
}

// Buscar todos os itens do cronograma do usuário
export async function getScheduleItems(userId: string): Promise<{ data: ScheduleItem[] | null; error: any }> {
  try {
    console.log("🔍 Buscando itens do cronograma para usuário:", userId)

    const { data, error } = await supabase
      .from("schedule_items")
      .select("*")
      .eq("user_id", userId)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      console.error("❌ Erro ao buscar cronograma:", error)
      return { data: null, error }
    }

    const scheduleItems = data.map(convertFromSupabase)
    console.log("✅ Cronograma carregado:", scheduleItems.length, "itens")

    return { data: scheduleItems, error: null }
  } catch (err) {
    console.error("❌ Exceção ao buscar cronograma:", err)
    return { data: null, error: err }
  }
}

// Adicionar item ao cronograma
export async function addScheduleItem(
  item: Omit<ScheduleItem, "id">,
  userId: string,
): Promise<{ data: ScheduleItem | null; error: any }> {
  try {
    console.log("➕ Adicionando item ao cronograma:", item)

    const newId = crypto.randomUUID()
    const supabaseItem = convertToSupabase(item, userId, newId)

    const { data, error } = await supabase.from("schedule_items").insert(supabaseItem).select().single()

    if (error) {
      console.error("❌ Erro ao adicionar item:", error)
      return { data: null, error }
    }

    const scheduleItem = convertFromSupabase(data)
    console.log("✅ Item adicionado com sucesso:", scheduleItem)

    return { data: scheduleItem, error: null }
  } catch (err) {
    console.error("❌ Exceção ao adicionar item:", err)
    return { data: null, error: err }
  }
}

// Atualizar item do cronograma
export async function updateScheduleItem(
  id: string,
  updates: Partial<ScheduleItem>,
  userId: string,
): Promise<{ data: ScheduleItem | null; error: any }> {
  try {
    console.log("✏️ Atualizando item do cronograma:", id, updates)

    // Preparar dados para atualização
    const updateData: Partial<SupabaseScheduleItem> = {}

    if (updates.day) updateData.day = updates.day
    if (updates.startTime) updateData.start_time = updates.startTime
    if (updates.subject) updateData.subject = updates.subject
    if (updates.duration !== undefined) updateData.duration = updates.duration
    if (updates.color) updateData.color = updates.color

    const { data, error } = await supabase
      .from("schedule_items")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("❌ Erro ao atualizar item:", error)
      return { data: null, error }
    }

    const scheduleItem = convertFromSupabase(data)
    console.log("✅ Item atualizado com sucesso:", scheduleItem)

    return { data: scheduleItem, error: null }
  } catch (err) {
    console.error("❌ Exceção ao atualizar item:", err)
    return { data: null, error: err }
  }
}

// Excluir item do cronograma
export async function deleteScheduleItem(id: string, userId: string): Promise<{ error: any }> {
  try {
    console.log("🗑️ Excluindo item do cronograma:", id)

    const { error } = await supabase.from("schedule_items").delete().eq("id", id).eq("user_id", userId)

    if (error) {
      console.error("❌ Erro ao excluir item:", error)
      return { error }
    }

    console.log("✅ Item excluído com sucesso")
    return { error: null }
  } catch (err) {
    console.error("❌ Exceção ao excluir item:", err)
    return { error: err }
  }
}

// Migrar dados do localStorage para o Supabase
export async function migrateLocalScheduleToSupabase(
  userId: string,
): Promise<{ success: boolean; migratedCount: number }> {
  try {
    console.log("🔄 Iniciando migração do cronograma do localStorage para Supabase")

    // Verificar se há dados no localStorage
    const localStorageKey = `schedule_${userId}`
    const localData = localStorage.getItem(localStorageKey)

    if (!localData) {
      console.log("ℹ️ Nenhum dado encontrado no localStorage para migrar")
      return { success: true, migratedCount: 0 }
    }

    let localSchedule: ScheduleItem[]
    try {
      localSchedule = JSON.parse(localData)
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse dos dados do localStorage:", parseError)
      return { success: false, migratedCount: 0 }
    }

    if (!Array.isArray(localSchedule) || localSchedule.length === 0) {
      console.log("ℹ️ Nenhum item válido encontrado no localStorage para migrar")
      localStorage.removeItem(localStorageKey)
      return { success: true, migratedCount: 0 }
    }

    console.log(`📦 Migrando ${localSchedule.length} itens do localStorage`)

    // Converter e inserir itens
    const itemsToInsert = localSchedule.map((item) => convertToSupabase(item, userId, item.id || crypto.randomUUID()))

    const { error } = await supabase.from("schedule_items").insert(itemsToInsert)

    if (error) {
      console.error("❌ Erro ao migrar dados:", error)
      return { success: false, migratedCount: 0 }
    }

    // Limpar localStorage após migração bem-sucedida
    localStorage.removeItem(localStorageKey)
    console.log(`✅ Migração concluída: ${localSchedule.length} itens migrados`)

    return { success: true, migratedCount: localSchedule.length }
  } catch (err) {
    console.error("❌ Exceção durante migração:", err)
    return { success: false, migratedCount: 0 }
  }
}
