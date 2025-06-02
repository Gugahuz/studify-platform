import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId } = await req.json()

    console.log("🔄 Criando Payment Intent para:", { priceId, userId })

    if (!priceId || !userId) {
      return NextResponse.json({ error: "Price ID e User ID são obrigatórios" }, { status: 400 })
    }

    // Buscar informações do preço no Stripe
    const price = await stripe.prices.retrieve(priceId)
    console.log("💰 Preço encontrado:", price)

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError || !profile) {
      console.error("❌ Erro ao buscar perfil:", profileError)
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar se o usuário já tem um customer ID no Stripe
    let customerId = profile.stripe_customer_id

    // Se não tem customer ID, criar um novo customer
    if (!customerId) {
      console.log("👤 Criando novo customer no Stripe...")
      try {
        const customer = await stripe.customers.create({
          email: profile.email,
          name: profile.nome || undefined,
          metadata: {
            userId: userId,
          },
        })

        customerId = customer.id

        // Salvar customer ID no perfil
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId)

        if (updateError) {
          console.error("❌ Erro ao salvar customer ID:", updateError)
        }

        console.log("✅ Customer criado:", customerId)
      } catch (stripeError) {
        console.error("❌ Erro ao criar customer no Stripe:", stripeError)
        return NextResponse.json({ error: "Erro ao criar customer no Stripe" }, { status: 500 })
      }
    } else {
      console.log("✅ Customer existente:", customerId)
    }

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount!,
      currency: price.currency || "brl",
      customer: customerId,
      metadata: {
        userId: userId,
        priceId: priceId,
        planType: getPlanTypeFromPriceId(priceId),
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
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

function getPlanTypeFromPriceId(priceId: string): string {
  // Esta função deve mapear o priceId para o tipo de plano
  // Por enquanto, vamos usar uma lógica simples baseada no ID
  if (priceId.includes("monthly")) return "monthly"
  if (priceId.includes("quarterly")) return "quarterly"
  if (priceId.includes("yearly")) return "yearly"

  // Fallback - você pode ajustar isso baseado nos seus price IDs reais
  return "monthly"
}
