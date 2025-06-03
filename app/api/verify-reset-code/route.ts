import { type NextRequest, NextResponse } from "next/server"
import { resetCodeManager } from "@/lib/reset-codes"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email e código são obrigatórios" }, { status: 400 })
    }

    // Normalizar email e código
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedCode = code.trim()

    console.log(`Verificando código para ${normalizedEmail}: ${normalizedCode}`) // Debug log

    // Verificar código usando o manager centralizado
    const verification = resetCodeManager.verify(normalizedEmail, normalizedCode)

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Código verificado com sucesso" })
  } catch (error) {
    console.error("Erro na API verify-reset-code:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
