"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, type Profile } from "@/lib/supabase"

export function useUserData() {
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refreshUserData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("🔄 Atualizando dados do usuário...")

      // Primeiro tenta obter usuário da sessão do Supabase
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      // Se não houver usuário na sessão do Supabase, verifica o localStorage
      if (authError || !user) {
        console.log("⚠️ Usuário não encontrado na sessão do Supabase, verificando localStorage...")
        const testUser = localStorage.getItem("testUser")

        if (testUser) {
          const parsedUser = JSON.parse(testUser)
          console.log("✅ Usuário encontrado no localStorage:", parsedUser)

          setUserProfile(parsedUser)
          setUserEmail(parsedUser.email || null)
          setIsLoading(false)
          return
        }

        console.log("❌ Usuário não encontrado no localStorage")
        setUserProfile(null)
        setUserEmail(null)
        setIsLoading(false)
        return
      }

      setUserEmail(user.email || null)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`)
      }

      setUserProfile(profile)
      console.log("✅ Dados atualizados com sucesso:", profile)
    } catch (error) {
      console.error("❌ Erro ao atualizar dados do usuário:", error)
      setError(error instanceof Error ? error : new Error(String(error)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const getUserData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log("👤 Carregando dados do usuário...")

        // Primeiro tenta obter usuário da sessão do Supabase
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        // Se não houver usuário na sessão do Supabase, verifica o localStorage
        if (authError || !user) {
          console.log("⚠️ Usuário não encontrado na sessão do Supabase, verificando localStorage...")
          const testUser = localStorage.getItem("testUser")

          if (testUser) {
            const parsedUser = JSON.parse(testUser)
            console.log("✅ Usuário encontrado no localStorage:", parsedUser)

            setUserProfile(parsedUser)
            setUserEmail(parsedUser.email || null)
            setIsLoading(false)
            return
          }

          console.log("❌ Usuário não encontrado no localStorage")
          setUserProfile(null)
          setUserEmail(null)
          setIsLoading(false)
          return
        }

        console.log("✅ Usuário autenticado:", user.id)
        setUserEmail(user.email || null)

        // Buscar perfil do usuário
        try {
          console.log("📋 Buscando perfil do usuário...")
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

          if (profileError) {
            console.error("❌ Erro ao buscar perfil:", profileError.message)

            // Se o perfil não existe, criar um novo
            if (profileError.code === "PGRST116") {
              console.log("📝 Criando novo perfil...")
              const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert([
                  {
                    id: user.id,
                    email: user.email,
                    nome: user.user_metadata?.full_name || "Usuário",
                    escolaridade: "ensino-medio",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ])
                .select()
                .single()

              if (createError) {
                console.error("❌ Erro ao criar perfil:", createError.message)
                throw new Error(`Erro ao criar perfil: ${createError.message}`)
              }

              console.log("✅ Perfil criado com sucesso:", newProfile)
              setUserProfile(newProfile)
            } else {
              throw new Error(`Erro ao buscar perfil: ${profileError.message}`)
            }
          } else {
            console.log("✅ Perfil encontrado:", profile)
            setUserProfile(profile)
          }
        } catch (profileError) {
          console.error("❌ Erro geral no perfil:", profileError)
          setUserProfile(null)
        }
      } catch (error) {
        console.error("❌ Erro geral ao buscar dados do usuário:", error)
        setError(error instanceof Error ? error : new Error(String(error)))
        setUserProfile(null)
        setUserEmail(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUserData()

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Mudança de autenticação:", event)

      if (event === "SIGNED_OUT") {
        setUserProfile(null)
        setUserEmail(null)
        setIsLoading(false)
        localStorage.removeItem("testUser") // Limpar localStorage também
      } else if (event === "SIGNED_IN" && session?.user) {
        // Recarregar dados quando usuário faz login
        refreshUserData()
      }
    })

    return () => {
      console.log("🧹 Limpando subscriptions...")
      subscription.unsubscribe()
    }
  }, [refreshUserData])

  return {
    userProfile,
    userEmail,
    isLoading,
    error,
    refreshUserData,
  }
}
