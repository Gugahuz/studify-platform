import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function GET() {
  try {
    console.log("🔍 Testando configuração do Stripe...")

    // Verificar variáveis de ambiente
    const checks = {
      stripe_secret_key: !!process.env.STRIPE_SECRET_KEY,
      stripe_publishable_key: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      app_url: !!process.env.NEXT_PUBLIC_APP_URL,
    }

    console.log("📋 Verificação de variáveis:", checks)

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: "STRIPE_SECRET_KEY não configurada",
        checks,
      })
    }

    // Testar conexão com Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })

    // Tentar listar produtos
    const products = await stripe.products.list({ limit: 5 })
    console.log("✅ Conexão com Stripe OK. Produtos encontrados:", products.data.length)

    // Tentar listar preços
    const prices = await stripe.prices.list({ limit: 5 })
    console.log("✅ Preços encontrados:", prices.data.length)

    return NextResponse.json({
      success: true,
      message: "Configuração OK",
      checks,
      stripe_data: {
        products_count: products.data.length,
        prices_count: prices.data.length,
        products: products.data.map((p) => ({
          id: p.id,
          name: p.name,
          active: p.active,
        })),
        prices: prices.data.map((p) => ({
          id: p.id,
          product: p.product,
          amount: p.unit_amount,
          currency: p.currency,
          recurring: p.recurring,
        })),
      },
    })
  } catch (error) {
    console.error("❌ Erro no teste:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        checks: {
          stripe_secret_key: !!process.env.STRIPE_SECRET_KEY,
          stripe_publishable_key: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          app_url: !!process.env.NEXT_PUBLIC_APP_URL,
        },
      },
      { status: 500 },
    )
  }
}
