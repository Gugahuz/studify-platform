import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function GET() {
  try {
    console.log("🔍 Buscando produtos do Stripe...")

    // Verificar se as chaves estão configuradas
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ STRIPE_SECRET_KEY não configurada")
      return NextResponse.json(
        {
          success: false,
          error: "STRIPE_SECRET_KEY não configurada",
          products: { monthly: [], quarterly: [], yearly: [] },
        },
        { status: 500 },
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })

    // Buscar todos os produtos ativos
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
    })

    console.log(`✅ Encontrados ${products.data.length} produtos`)

    // Buscar todos os preços
    const prices = await stripe.prices.list({
      active: true,
      expand: ["data.product"],
    })

    console.log(`✅ Encontrados ${prices.data.length} preços`)

    // Organizar produtos por tipo de plano
    const organizedProducts = {
      monthly: [],
      quarterly: [],
      yearly: [],
    }

    prices.data.forEach((price) => {
      const product = price.product as Stripe.Product

      if (price.recurring) {
        const interval = price.recurring.interval
        const intervalCount = price.recurring.interval_count

        let planType = ""
        if (interval === "month" && intervalCount === 1) {
          planType = "monthly"
        } else if (interval === "month" && intervalCount === 3) {
          planType = "quarterly"
        } else if (interval === "year" && intervalCount === 1) {
          planType = "yearly"
        }

        if (planType && organizedProducts[planType as keyof typeof organizedProducts]) {
          organizedProducts[planType as keyof typeof organizedProducts].push({
            id: price.id,
            product_id: product.id,
            product_name: product.name,
            amount: price.unit_amount,
            currency: price.currency,
            interval: price.recurring.interval,
            interval_count: price.recurring.interval_count,
          })
        }
      }
    })

    console.log("✅ Produtos organizados:", organizedProducts)

    return NextResponse.json({
      success: true,
      products: organizedProducts,
      raw_products: products.data,
      raw_prices: prices.data,
      total_products: products.data.length,
      total_prices: prices.data.length,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar produtos",
        products: { monthly: [], quarterly: [], yearly: [] },
      },
      { status: 500 },
    )
  }
}
