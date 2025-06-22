import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("🔍 Checking is_premium for user:", userId)

    // Buscar na tabela PROFILES a coluna is_premium
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError)
      return NextResponse.json({ isPremium: false }, { status: 200 })
    }

    console.log("📊 Profile data:", profile)

    // Verificar se is_premium é TRUE ou FALSE
    const isPremium = profile?.is_premium === true

    console.log("✅ Premium status:", {
      isPremium,
      is_premium_value: profile?.is_premium,
    })

    return NextResponse.json({
      isPremium,
      subscription: {
        plan_type: isPremium ? "premium" : "free",
        status: isPremium ? "active" : "inactive",
      },
    })
  } catch (error) {
    console.error("❌ Subscription status error:", error)
    return NextResponse.json({ isPremium: false }, { status: 200 })
  }
}
