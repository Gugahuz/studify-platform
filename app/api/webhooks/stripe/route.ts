import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("🎯 Stripe webhook received:", event.type)

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`🔔 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    console.log("📝 Updating subscription:", subscription.id)

    const customerId = subscription.customer as string
    const priceId = subscription.items.data[0]?.price.id

    // Get plan type from price ID
    let planType = "monthly"
    if (priceId?.includes("quarterly")) planType = "quarterly"
    if (priceId?.includes("yearly")) planType = "yearly"

    // Get user by customer ID
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single()

    if (existingSubscription) {
      // Update existing subscription
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          plan_type: planType,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id)

      if (error) {
        console.error("❌ Error updating subscription:", error)
        return
      }

      // Update user premium status
      await updateUserPremiumStatus(existingSubscription.user_id, subscription.status === "active")
    }

    console.log("✅ Subscription updated successfully")
  } catch (error) {
    console.error("❌ Error handling subscription update:", error)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    console.log("❌ Subscription canceled:", subscription.id)

    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_subscription_id", subscription.id)
      .single()

    if (existingSubscription) {
      // Update subscription status
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id)

      // Remove premium status
      await updateUserPremiumStatus(existingSubscription.user_id, false)
    }

    console.log("✅ Subscription cancellation handled")
  } catch (error) {
    console.error("❌ Error handling subscription cancellation:", error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log("💰 Payment succeeded:", invoice.id)

    const customerId = invoice.customer as string
    const subscriptionId = invoice.subscription as string

    // Get user by customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single()

    if (subscription && invoice.payment_intent) {
      // Record payment
      await supabase.from("payments").insert({
        user_id: subscription.user_id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: "succeeded",
      })

      // Ensure user has premium status
      await updateUserPremiumStatus(subscription.user_id, true)
    }

    console.log("✅ Payment recorded successfully")
  } catch (error) {
    console.error("❌ Error handling payment success:", error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log("💸 Payment failed:", invoice.id)

    const customerId = invoice.customer as string

    // Get user by customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single()

    if (subscription && invoice.payment_intent) {
      // Record failed payment
      await supabase.from("payments").insert({
        user_id: subscription.user_id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: "failed",
      })
    }

    console.log("✅ Failed payment recorded")
  } catch (error) {
    console.error("❌ Error handling payment failure:", error)
  }
}

async function updateUserPremiumStatus(userId: string, isPremium: boolean) {
  try {
    const updates: any = { is_premium: isPremium }

    if (isPremium) {
      // Set premium expiry to 1 month from now (will be updated by subscription webhook)
      updates.premium_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } else {
      updates.premium_expires_at = null
    }

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    if (error) {
      console.error("❌ Error updating user premium status:", error)
    } else {
      console.log(`✅ User ${userId} premium status updated to: ${isPremium}`)
    }
  } catch (error) {
    console.error("❌ Error updating premium status:", error)
  }
}
