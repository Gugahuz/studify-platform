import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching subscription:", error)
      return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
    }

    // Se não encontrou assinatura
    if (!subscription) {
      return NextResponse.json({ status: "inactive", subscription: null })
    }

    // Verificar se a assinatura está ativa
    const now = new Date()
    const endDate = new Date(subscription.current_period_end)
    const isActive = endDate > now && subscription.status !== "canceled"

    return NextResponse.json({
      status: isActive ? "active" : "inactive",
      subscription: {
        ...subscription,
        is_active: isActive,
      },
    })
  } catch (error) {
    console.error("Error getting subscription status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
