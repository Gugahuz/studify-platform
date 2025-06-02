import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 Criando Payment Intent...")

    const { priceId, userId } = await req.json()

    if (!priceId || !userId) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    // Buscar informações do preço
    const price = await stripe.prices.retrieve(priceId)
    console.log("💰 Preço encontrado:", { id: price.id, amount: price.unit_amount })

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError || !profile) {
      console.error("❌ Usuário não encontrado:", profileError)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Criar ou obter cliente do Stripe
    let customerId: string

    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
      console.log("🔄 Usando cliente existente:", customerId)
    } else {
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

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount!,
      currency: price.currency,
      customer: customerId,
      metadata: {
        userId: userId,
        priceId: priceId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log("✅ Payment Intent criado:", paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("❌ Erro ao criar Payment Intent:", error)
    return NextResponse.json(
      {
        error: "Falha ao criar Payment Intent",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
