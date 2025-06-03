import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email e nova senha são obrigatórios" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const emailLowerCase = email.trim().toLowerCase()

    console.log("🔐 Iniciando redefinição de senha para:", emailLowerCase)

    // First, get the user from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .ilike("email", emailLowerCase)
      .single()

    if (profileError || !profile) {
      console.error("❌ Usuário não encontrado na tabela profiles:", profileError)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    console.log("✅ Usuário encontrado na tabela profiles:", profile.id)

    // Try to find and update user in Supabase Auth
    let authUpdated = false

    try {
      // First, try to get the user by ID (if the profile ID matches an auth user ID)
      const { data: authUserById, error: getUserError } = await supabase.auth.admin.getUserById(profile.id)

      if (!getUserError && authUserById.user) {
        console.log("🔍 Usuário encontrado no Auth pelo ID, atualizando senha...")

        const { error: authError } = await supabase.auth.admin.updateUserById(profile.id, {
          password: newPassword,
        })

        if (authError) {
          console.error("⚠️ Erro ao atualizar senha no Auth:", authError)
        } else {
          console.log("✅ Senha atualizada no Supabase Auth")
          authUpdated = true
        }
      } else {
        // If not found by ID, try to find by email
        console.log("🔍 Buscando usuário no Auth por email...")

        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

        if (!listError && authUsers.users) {
          const authUser = authUsers.users.find((u) => u.email?.toLowerCase() === emailLowerCase)

          if (authUser) {
            console.log("🔍 Usuário encontrado no Auth por email, atualizando senha...")

            const { error: authError } = await supabase.auth.admin.updateUserById(authUser.id, {
              password: newPassword,
            })

            if (authError) {
              console.error("⚠️ Erro ao atualizar senha no Auth:", authError)
            } else {
              console.log("✅ Senha atualizada no Supabase Auth")
              authUpdated = true

              // Update profile ID to match auth user ID for future consistency
              if (profile.id !== authUser.id) {
                console.log("🔄 Sincronizando ID do perfil com Auth...")
                await supabase.from("profiles").update({ id: authUser.id }).eq("email", emailLowerCase)
              }
            }
          } else {
            console.log("ℹ️ Usuário não encontrado no Auth - continuando apenas com tabela profiles")
          }
        }
      }
    } catch (authException) {
      console.warn("⚠️ Exceção ao trabalhar com Auth:", authException)
    }

    // Always update password in profiles table for compatibility
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .ilike("email", emailLowerCase)

    if (profileUpdateError) {
      console.error("❌ Erro ao atualizar senha na tabela profiles:", profileUpdateError)
      return NextResponse.json({ error: "Erro ao atualizar senha na base de dados" }, { status: 500 })
    }

    console.log("✅ Senha atualizada na tabela profiles")

    // If auth wasn't updated, we'll rely on the custom login logic
    if (!authUpdated) {
      console.log("ℹ️ Senha atualizada apenas na tabela profiles - login funcionará via lógica customizada")
    }

    return NextResponse.json({
      success: true,
      message: authUpdated ? "Senha atualizada com sucesso em todos os sistemas" : "Senha atualizada com sucesso",
      authUpdated,
    })
  } catch (error) {
    console.error("❌ Erro na API de redefinição de senha:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
