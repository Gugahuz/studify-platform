import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(req: NextRequest) {
  try {
    console.log("🚫 Iniciando cancelamento de assinatura...")

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID é obrigatório" }, { status: 400 })
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (subscriptionError || !subscription) {
      console.error("❌ Assinatura não encontrada:", subscriptionError)
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 })
    }

    console.log("✅ Assinatura encontrada:", subscription.stripe_subscription_id)

    // Cancelar assinatura no Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

    console.log("✅ Assinatura cancelada no Stripe:", canceledSubscription.id)

    // Atualizar status no banco de dados
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.stripe_subscription_id)

    if (updateError) {
      console.error("❌ Erro ao atualizar status da assinatura:", updateError)
      throw new Error("Erro ao atualizar status da assinatura")
    }

    // Atualizar status premium do usuário
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_premium: false,
        premium_expires_at: null,
      })
      .eq("id", userId)

    if (profileError) {
      console.error("❌ Erro ao atualizar perfil:", profileError)
      throw new Error("Erro ao atualizar perfil do usuário")
    }

    console.log("✅ Assinatura cancelada com sucesso")

    return NextResponse.json({
      success: true,
      message: "Assinatura cancelada com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao cancelar assinatura:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao cancelar assinatura",
      },
      { status: 500 },
    )
  }
}
