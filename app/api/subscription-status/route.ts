import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get user's subscription status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("❌ Error getting profile:", profileError)
      return NextResponse.json({ error: "Failed to get profile" }, { status: 500 })
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    if (subscriptionError && subscriptionError.code !== "PGRST116") {
      console.error("❌ Error getting subscription:", subscriptionError)
    }

    return NextResponse.json({
      isPremium: profile?.is_premium || false,
      premiumExpiresAt: profile?.premium_expires_at,
      subscription: subscription || null,
    })
  } catch (error) {
    console.error("❌ Error getting subscription status:", error)
    return NextResponse.json({ error: "Failed to get subscription status" }, { status: 500 })
  }
}
