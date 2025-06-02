import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function GET() {
  try {
    console.log("🚀 Starting Stripe configuration check...")

    // Verificar se as chaves estão configuradas
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log("❌ STRIPE_SECRET_KEY not found")
      return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.log("❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found")
      return NextResponse.json({ error: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not configured" }, { status: 500 })
    }

    console.log("✅ Environment variables found")
    console.log("🔑 Secret key starts with:", process.env.STRIPE_SECRET_KEY.substring(0, 10))

    let stripe
    try {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2024-06-20",
      })
      console.log("✅ Stripe client initialized")
    } catch (stripeError) {
      console.error("❌ Error initializing Stripe:", stripeError)
      return NextResponse.json(
        {
          error: "Failed to initialize Stripe client",
          details: stripeError instanceof Error ? stripeError.message : "Unknown Stripe error",
        },
        { status: 500 },
      )
    }

    // Test Stripe connection
    try {
      console.log("🔍 Testing Stripe connection...")
      const account = await stripe.accounts.retrieve()
      console.log("✅ Stripe connection successful, account:", account.id)
    } catch (connectionError) {
      console.error("❌ Stripe connection failed:", connectionError)
      return NextResponse.json(
        {
          error: "Failed to connect to Stripe",
          details: connectionError instanceof Error ? connectionError.message : "Connection error",
        },
        { status: 500 },
      )
    }

    // IDs dos produtos fornecidos
    const productIds = {
      monthly: "prod_SQOjpzfjFoo3Gt",
      quarterly: "prod_SQOrjrwsX8QrIF",
      yearly: "prod_SQPBH9p2FWAkRR",
    }

    console.log("📦 Looking for products:", productIds)

    // Buscar todos os preços ativos
    let allPrices
    try {
      console.log("🔍 Fetching prices from Stripe...")
      allPrices = await stripe.prices.list({
        active: true,
        limit: 100,
        expand: ["data.product"],
      })
      console.log(`📊 Found ${allPrices.data.length} active prices`)
    } catch (pricesError) {
      console.error("❌ Error fetching prices:", pricesError)
      return NextResponse.json(
        {
          error: "Failed to fetch prices from Stripe",
          details: pricesError instanceof Error ? pricesError.message : "Prices fetch error",
        },
        { status: 500 },
      )
    }

    // Rest of the function remains the same...
    const pricesByProduct = {
      monthly: [],
      quarterly: [],
      yearly: [],
    }

    for (const price of allPrices.data) {
      if (price.product && typeof price.product === "object") {
        const productId = price.product.id

        const priceInfo = {
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          interval_count: price.recurring?.interval_count,
          product_name: price.product.name,
          product_id: productId,
        }

        if (productId === productIds.monthly) {
          pricesByProduct.monthly.push(priceInfo)
        } else if (productId === productIds.quarterly) {
          pricesByProduct.quarterly.push(priceInfo)
        } else if (productId === productIds.yearly) {
          pricesByProduct.yearly.push(priceInfo)
        }
      }
    }

    console.log("💰 Prices found by product:", {
      monthly: pricesByProduct.monthly.length,
      quarterly: pricesByProduct.quarterly.length,
      yearly: pricesByProduct.yearly.length,
    })

    const missingPrices = []
    if (pricesByProduct.monthly.length === 0) missingPrices.push("Mensal")
    if (pricesByProduct.quarterly.length === 0) missingPrices.push("Trimestral")
    if (pricesByProduct.yearly.length === 0) missingPrices.push("Anual")

    console.log("✅ Configuration check completed successfully")

    return NextResponse.json({
      success: true,
      webhookUrl: "https://v0-studify0106.vercel.app/api/webhooks/stripe",
      configuration: {
        secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
        publishableKeyConfigured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
      productIds,
      prices: pricesByProduct,
      totalPricesFound: allPrices.data.length,
      missingPrices,
      allProducts: allPrices.data.map((price) => ({
        id: price.id,
        product_id: typeof price.product === "object" ? price.product.id : price.product,
        product_name: typeof price.product === "object" ? price.product.name : "Unknown",
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
      })),
    })
  } catch (error) {
    console.error("❌ Unexpected error in stripe-config:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        configuration: {
          secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
          publishableKeyConfigured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
        },
      },
      { status: 500 },
    )
  }
}
