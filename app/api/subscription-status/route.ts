import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get user's subscription status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", userId)
      .single()

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single()

    return NextResponse.json({
      isPremium: profile?.is_premium || false,
      premiumExpiresAt: profile?.premium_expires_at,
      subscription: subscription,
    })
  } catch (error) {
    console.error("❌ Error getting subscription status:", error)
    return NextResponse.json({ error: "Failed to get subscription status" }, { status: 500 })
  }
}
