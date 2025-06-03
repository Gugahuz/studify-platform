import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { supabase } from "@/lib/supabase"
import { resetCodeManager } from "@/lib/reset-codes"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim()

    // Verificar se o usuário existe
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", normalizedEmail)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 404 })
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Armazenar código com expiração de 10 minutos
    resetCodeManager.set(normalizedEmail, code, 10 * 60 * 1000)

    console.log(`Código gerado para ${normalizedEmail}: ${code}`) // Debug log

    // Enviar email com Resend
    const { data, error } = await resend.emails.send({
      from: "Studify <noreply@studify.digital>",
      to: [normalizedEmail],
      subject: "Código de recuperação de senha - Studify",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">Studify</h1>
            <p style="color: #6b7280; margin: 5px 0;">Never stop learning</p>
          </div>
          
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Recuperação de senha</h2>
            <p style="color: #6b7280; margin-bottom: 30px;">
              Você solicitou a recuperação de senha para sua conta. Use o código abaixo:
            </p>
            
            <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h1 style="color: #10b981; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
            </div>
            
            <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
              Este código expira em 10 minutos.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>Se você não solicitou esta recuperação, ignore este email.</p>
            <p>© 2024 Studify. Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Erro ao enviar email:", error)
      return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Código enviado com sucesso" })
  } catch (error) {
    console.error("Erro na API send-reset-code:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
