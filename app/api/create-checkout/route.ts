import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    console.log("🛒 Iniciando criação de sessão de checkout...")

    // Verificar se as chaves estão configuradas
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ STRIPE_SECRET_KEY não configurada")
      return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.error("❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não configurada")
      return NextResponse.json({ error: "Chave pública do Stripe não configurada" }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })

    const body = await req.json()
    console.log("📋 Dados recebidos:", body)

    const { priceId, userId } = body

    if (!priceId || !userId) {
      console.error("❌ Campos obrigatórios ausentes:", { priceId: !!priceId, userId: !!userId })
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    console.log("📋 Dados do checkout:", { priceId, userId })

    // Verificar se o preço existe no Stripe
    try {
      const price = await stripe.prices.retrieve(priceId)
      console.log("✅ Preço encontrado:", { id: price.id, amount: price.unit_amount, currency: price.currency })
    } catch (priceError) {
      console.error("❌ Preço não encontrado:", priceError)
      return NextResponse.json({ error: "ID de preço inválido" }, { status: 400 })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError || !profile) {
      console.error("❌ Usuário não encontrado:", profileError)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    console.log("👤 Usuário encontrado:", { email: profile.email, name: profile.nome })

    // Criar ou obter cliente do Stripe
    let customerId: string

    // Verificar se o usuário já tem uma assinatura com ID do cliente
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
      console.log("🔄 Usando cliente existente:", customerId)
    } else {
      // Criar novo cliente
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.nome,
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id
      console.log("✨ Novo cliente criado:", customerId)
    }

    // Usar o novo domínio para redirecionamentos
    const baseUrl = "https://studify.digital"

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard/assinatura?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/assinatura?canceled=true`,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    })

    console.log("✅ Sessão de checkout criada:", { id: session.id, url: session.url })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error("❌ Erro ao criar sessão de checkout:", error)
    return NextResponse.json(
      {
        error: "Falha ao criar sessão de checkout",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
