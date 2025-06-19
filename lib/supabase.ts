import { createClient } from "@supabase/supabase-js"

// Tipos para o perfil do usuário - removido campo apelido
export type Profile = {
  id: string
  nome: string
  email: string
  telefone: string | null
  escolaridade: string
  avatar_url?: string | null
  password?: string | null
  created_at?: string
  updated_at?: string
}

// Tipo para logs de login
export type LoginLog = {
  id: string
  user_id: string | null
  email: string
  login_attempt_time: string
  success: boolean
  ip_address: string | null
  user_agent: string | null
  error_message: string | null
}

// Cria o cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

console.log("🔧 Configuração Supabase:")
console.log("📍 URL:", supabaseUrl)
console.log("🔑 Anon Key:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "NÃO DEFINIDA")

// Implementação do padrão singleton para o cliente Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseInstance
}

// Exporta o cliente Supabase para compatibilidade com código existente
export const supabase = getSupabaseClient()

// Re-export createClient for other modules that need it
export { createClient }

// Função para verificar se usuário existe no auth
export async function checkUserExistsInAuth(userId: string): Promise<boolean> {
  try {
    console.log("🔍 Verificando se usuário existe no auth.users:", userId)

    // Usar RPC para verificar se o usuário existe
    const { data, error } = await supabase.rpc("check_user_exists", { user_id: userId })

    if (error) {
      console.error("❌ Erro ao verificar usuário no auth:", error)
      return false
    }

    console.log("📊 Usuário existe no auth:", data)
    return data === true
  } catch (error) {
    console.error("❌ Exceção ao verificar usuário no auth:", error)
    return false
  }
}

// Função para aguardar usuário ser criado no auth
export async function waitForUserInAuth(userId: string, maxAttempts = 10): Promise<boolean> {
  console.log(`⏳ Aguardando usuário ${userId} ser criado no auth (máx ${maxAttempts} tentativas)`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Tentativa ${attempt}/${maxAttempts}`)

    const exists = await checkUserExistsInAuth(userId)

    if (exists) {
      console.log(`✅ Usuário encontrado no auth na tentativa ${attempt}`)
      return true
    }

    if (attempt < maxAttempts) {
      console.log(`⏳ Usuário não encontrado, aguardando 2 segundos...`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  console.log(`❌ Usuário não foi encontrado no auth após ${maxAttempts} tentativas`)
  return false
}

// Função para registrar tentativas de login
export async function logLoginAttempt(email: string, success: boolean, userId?: string, errorMessage?: string) {
  try {
    console.log("📝 Registrando tentativa de login:", { email, success, userId, errorMessage })

    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : null

    const { data, error } = await supabase.rpc("log_login_attempt", {
      p_email: email,
      p_success: success,
      p_user_id: userId || null,
      p_ip_address: null,
      p_user_agent: userAgent,
      p_error_message: errorMessage || null,
    })

    if (error) {
      console.error("❌ Erro ao registrar tentativa de login:", error)
    } else {
      console.log("✅ Tentativa de login registrada com sucesso")
    }

    return { data, error }
  } catch (error) {
    console.error("❌ Erro inesperado ao registrar login:", error)
    return { data: null, error }
  }
}

// Função para criar perfil com verificação robusta
export async function createUserProfile(
  userId: string,
  userData: {
    nome: string
    email: string
    telefone: string
    escolaridade: string
    password?: string
  },
) {
  try {
    console.log("📝 Iniciando criação de perfil:")
    console.log("🆔 User ID:", userId)
    console.log("📋 Dados do usuário:", { ...userData, password: userData.password ? "[HIDDEN]" : undefined })

    // Primeiro, aguardar o usuário ser criado no auth
    console.log("⏳ Verificando se usuário existe no auth...")
    const userExists = await waitForUserInAuth(userId, 15) // 15 tentativas = 30 segundos

    if (!userExists) {
      const error = new Error("Usuário não foi encontrado no sistema de autenticação após aguardar")
      console.error("❌ Usuário não existe no auth:", error.message)
      return { data: null, error }
    }

    console.log("✅ Usuário confirmado no auth, criando perfil...")

    const profileData = {
      id: userId,
      nome: userData.nome,
      email: userData.email,
      telefone: userData.telefone || null,
      escolaridade: userData.escolaridade,
      password: userData.password || null,
    }

    console.log("📤 Dados que serão inseridos na tabela profiles:", {
      ...profileData,
      password: profileData.password ? "[HIDDEN]" : null,
    })

    const { data, error } = await supabase.from("profiles").insert(profileData)

    console.log("📥 Resposta da inserção:")
    console.log("📊 Data:", data)
    console.log("❌ Error:", error)

    if (error) {
      console.error("❌ Erro detalhado ao criar perfil:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return { data: null, error }
    }

    console.log("✅ Perfil criado com sucesso")
    return { data, error: null }
  } catch (error) {
    console.error("❌ Exceção ao criar perfil:", error)
    return { data: null, error }
  }
}

// Função para verificar perfil
export async function checkUserProfile(userId: string) {
  try {
    console.log("🔍 Verificando perfil para usuário:", userId)

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    console.log("📥 Resposta da verificação de perfil:")
    console.log("📊 Data:", data ? { ...data, password: data.password ? "[HIDDEN]" : null } : null)
    console.log("❌ Error:", error)

    if (data) {
      console.log("✅ Perfil encontrado")
      return { data, error: null }
    }

    if (error && error.code === "PGRST116") {
      // Perfil não encontrado
      console.log("ℹ️ Perfil não encontrado (código PGRST116)")
      return { data: null, error: null }
    }

    console.error("❌ Erro ao verificar perfil:", error)
    return { data: null, error }
  } catch (error) {
    console.error("❌ Exceção ao verificar perfil:", error)
    return { data: null, error }
  }
}

// Função para tentar login alternativo para usuários não confirmados (modo de teste)
export async function attemptTestLogin(email: string, password: string) {
  try {
    console.log("🧪 Tentando login de teste para usuário não confirmado:", email)

    // Primeiro, verificar se o usuário existe na tabela profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single()

    if (profileError || !profiles) {
      console.log("❌ Usuário não encontrado na tabela profiles")
      return { success: false, error: "Usuário não encontrado" }
    }

    // Verificar se a senha bate (em produção, isso seria feito de forma mais segura)
    if (profiles.password === password) {
      console.log("✅ Senha correta para usuário não confirmado")
      return { success: true, user: profiles }
    } else {
      console.log("❌ Senha incorreta")
      return { success: false, error: "Senha incorreta" }
    }
  } catch (error) {
    console.error("❌ Erro no login de teste:", error)
    return { success: false, error: "Erro interno" }
  }
}

// Função para logout seguro
export async function signOut() {
  try {
    console.log("🚪 Iniciando processo de logout...")

    // Limpar dados locais primeiro
    if (typeof window !== "undefined") {
      console.log("🧹 Limpando dados locais...")
      localStorage.clear()
      sessionStorage.clear()
    }

    // Fazer logout no Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("❌ Erro no logout do Supabase:", error)
      // Mesmo com erro, consideramos logout bem-sucedido se limpamos os dados locais
      return { success: true, error }
    }

    console.log("✅ Logout realizado com sucesso")
    return { success: true, error: null }
  } catch (error) {
    console.error("❌ Exceção durante logout:", error)
    return { success: false, error }
  }
}

// Função para testar conexão com Supabase
export async function testSupabaseConnection() {
  try {
    console.log("🧪 Testando conexão com Supabase...")

    const { data, error } = await supabase.from("profiles").select("count", { count: "exact" })

    if (error) {
      console.error("❌ Erro na conexão:", error)
      return false
    }

    console.log("✅ Conexão com Supabase funcionando. Total de perfis:", data)
    return true
  } catch (error) {
    console.error("❌ Exceção ao testar conexão:", error)
    return false
  }
}
