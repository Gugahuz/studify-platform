import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Resend } from "resend"

// Inicializar o cliente Resend com a API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email e código são obrigatórios" }, { status: 400 })
    }

    // Verificar se o email existe na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("nome, email")
      .ilike("email", email.toLowerCase())
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 404 })
    }

    // Nome do usuário ou "Usuário" se não estiver disponível
    const userName = profile.nome || "Usuário"

    // Criar o conteúdo do email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Recuperação - Studify</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 24px;
            margin: 0;
            font-weight: 600;
          }
          .code-container {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px dashed #3b82f6;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .warning-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
          }
          .warning ul {
            margin: 0;
            padding-left: 20px;
            color: #92400e;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📚 Studify</div>
            <h1 class="title">Código de Recuperação de Senha</h1>
          </div>
          
          <p>Olá, <strong>${userName}</strong>!</p>
          
          <p>Você solicitou a recuperação de senha para sua conta no Studify. Use o código abaixo para redefinir sua senha:</p>
          
          <div class="code-container">
            <div class="code">${code}</div>
          </div>
          
          <div class="warning">
            <div class="warning-title">⚠️ Importante:</div>
            <ul>
              <li>Este código é válido por apenas <strong>15 minutos</strong></li>
              <li>Use-o apenas no site oficial do Studify</li>
              <li>Não compartilhe este código com ninguém</li>
              <li>Se você não solicitou esta recuperação, ignore este email</li>
            </ul>
          </div>
          
          <p>Para sua segurança, este código expirará automaticamente em 15 minutos. Se precisar de um novo código, você pode solicitar outro na página de login.</p>
          
          <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema Studify.</p>
            <p>© ${new Date().getFullYear()} Studify - Todos os direitos reservados</p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
              Se você está tendo problemas, entre em contato conosco.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Studify - Código de Recuperação de Senha

Olá, ${userName}!

Você solicitou a recuperação de senha para sua conta no Studify.

Seu código de recuperação é: ${code}

IMPORTANTE:
- Este código é válido por 15 minutos
- Use-o apenas no site oficial do Studify
- Não compartilhe este código com ninguém

Se você não solicitou esta recuperação, ignore este email.

Studify Team
© ${new Date().getFullYear()} Studify - Todos os direitos reservados
    `

    // Enviar o email usando Resend com o domínio padrão (não requer verificação)
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Studify <onboarding@resend.dev>", // Usando o domínio padrão do Resend
      to: email,
      subject: "🔐 Código de Recuperação de Senha - Studify",
      html: htmlContent,
      text: textContent,
    })

    if (emailError) {
      console.error("Erro ao enviar email:", emailError)
      return NextResponse.json(
        {
          error: "Falha ao enviar o email. Tente novamente em alguns minutos.",
          details: emailError.message,
        },
        { status: 500 },
      )
    }

    console.log("Email enviado com sucesso:", emailData)

    return NextResponse.json({
      success: true,
      message: "Código enviado por email com sucesso",
      emailId: emailData?.id,
    })
  } catch (error) {
    console.error("Erro ao enviar email:", error)

    // Tratamento de erro mais específico
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Erro ao enviar email",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
