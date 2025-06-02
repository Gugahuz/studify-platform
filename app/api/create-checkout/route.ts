import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    console.log("🛒 Creating checkout session...")

    // Verificar se as chaves estão configuradas
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ STRIPE_SECRET_KEY not configured")
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })

    const { priceId, userId } = await req.json()

    if (!priceId || !userId) {
      console.error("❌ Missing required fields:", { priceId: !!priceId, userId: !!userId })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("📋 Checkout request:", { priceId, userId })

    // Get user profile
    const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (profileError || !profile) {
      console.error("❌ User not found:", profileError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("👤 User found:", { email: profile.email, name: profile.nome })

    // Create or get Stripe customer
    let customerId: string

    // Check if user already has a subscription with customer ID
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
      console.log("🔄 Using existing customer:", customerId)
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.nome,
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id
      console.log("✨ Created new customer:", customerId)
    }

    // Create checkout session
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
      success_url: `https://v0-studify0106.vercel.app/dashboard/assinatura?success=true`,
      cancel_url: `https://v0-studify0106.vercel.app/dashboard/assinatura?canceled=true`,
      metadata: {
        userId: userId,
      },
    })

    console.log("✅ Checkout session created:", session.id)

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("❌ Error creating checkout session:", error)
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
