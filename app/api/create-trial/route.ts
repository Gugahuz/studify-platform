import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 Iniciando criação de trial gratuito...")

    // Verificar se as chaves estão configuradas
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ STRIPE_SECRET_KEY não configurada")
      return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })

    const body = await req.json()
    console.log("📋 Dados recebidos:", body)

    const { userId } = body

    if (!userId) {
      console.error("❌ User ID ausente")
      return NextResponse.json({ error: "User ID obrigatório" }, { status: 400 })
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError || !profile) {
      console.error("❌ Usuário não encontrado:", profileError)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    console.log("👤 Usuário encontrado:", { email: profile.email, name: profile.nome })

    // Verificar se o usuário já teve trial
    const { data: existingSubscriptions } = await supabase.from("subscriptions").select("*").eq("user_id", userId)

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      console.log("❌ Usuário já teve trial ou assinatura")
      return NextResponse.json({ error: "Usuário já teve trial ou assinatura" }, { status: 400 })
    }

    // Criar ou obter cliente do Stripe
    let customerId: string

    if (profile.stripe_customer_id) {
      customerId = profile.stripe_customer_id
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

      // Atualizar perfil com customer ID
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId)
    }

    // Buscar o preço do plano mensal para criar a assinatura com trial
    const response = await fetch(`${req.nextUrl.origin}/api/stripe-products`)
    const stripeProducts = await response.json()

    if (!stripeProducts?.success || !stripeProducts?.products?.monthly) {
      console.error("❌ Produtos do Stripe não encontrados")
      return NextResponse.json({ error: "Produtos não configurados" }, { status: 500 })
    }

    const monthlyPriceId = stripeProducts.products.monthly[0]?.id

    if (!monthlyPriceId) {
      console.error("❌ Price ID mensal não encontrado")
      return NextResponse.json({ error: "Plano mensal não configurado" }, { status: 500 })
    }

    // Criar assinatura com trial de 7 dias
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: monthlyPriceId }],
      trial_period_days: 7,
      metadata: {
        userId: userId,
        planType: "trial",
      },
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    })

    console.log("✅ Assinatura com trial criada:", subscription.id)

    // Calcular datas
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Atualizar perfil do usuário para premium durante o trial
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        premium_expires_at: trialEnd.toISOString(),
        stripe_customer_id: customerId,
      })
      .eq("id", userId)

    if (profileUpdateError) {
      console.error("❌ Erro ao atualizar perfil:", profileUpdateError)
      return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
    }

    // Criar registro de assinatura
    const { error: subscriptionError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      plan_type: "trial",
      status: "trialing",
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })

    if (subscriptionError) {
      console.error("❌ Erro ao criar registro de assinatura:", subscriptionError)
      return NextResponse.json({ error: "Erro ao registrar assinatura" }, { status: 500 })
    }

    console.log("✅ Trial criado com sucesso")

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      trialEnd: trialEnd.toISOString(),
      message: "Trial de 7 dias ativado com sucesso!",
    })
  } catch (error) {
    console.error("❌ Erro ao criar trial:", error)
    return NextResponse.json(
      {
        error: "Falha ao criar trial",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
