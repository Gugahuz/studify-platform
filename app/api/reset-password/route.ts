import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { resetCodeManager } from "@/lib/reset-codes"

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Normalizar dados
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedCode = code.trim()

    console.log("🔐 Tentando resetar senha para:", normalizedEmail)

    // Verificar código
    const verification = resetCodeManager.verify(normalizedEmail, normalizedCode)

    if (!verification.valid) {
      console.log("❌ Verificação falhou:", verification.error)
      return NextResponse.json({ error: verification.error }, { status: 400 })
    }

    console.log("✅ Código verificado, atualizando senha...")

    // Usar a função RPC para atualizar a senha em ambos os sistemas
    const { data: rpcResult, error: rpcError } = await supabase.rpc("update_user_password", {
      user_email: normalizedEmail,
      new_password: newPassword,
    })

    if (rpcError) {
      console.error("❌ Erro ao atualizar senha via RPC:", rpcError)
      return NextResponse.json({ error: "Erro ao atualizar senha: " + rpcError.message }, { status: 500 })
    }

    console.log("🔄 Resultado da atualização via RPC:", rpcResult)

    // Remover código usado
    resetCodeManager.delete(normalizedEmail)

    console.log("✅ Senha atualizada com sucesso")
    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso. Faça login com sua nova senha.",
    })
  } catch (error) {
    console.error("❌ Erro na API reset-password:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
