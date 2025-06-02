import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST() {
  try {
    console.log("🚀 Configurando produtos do Stripe...")

    // Definir os produtos que queremos criar
    const productsToCreate = [
      {
        name: "Studify Premium - Mensal",
        description: "Acesso completo ao Studify Premium por 1 mês",
        price: 2990, // R$ 29.90 em centavos
        interval: "month",
        interval_count: 1,
        planId: "monthly",
      },
      {
        name: "Studify Premium - Trimestral",
        description: "Acesso completo ao Studify Premium por 3 meses",
        price: 7470, // R$ 74.70 em centavos (3x R$ 24.90)
        interval: "month",
        interval_count: 3,
        planId: "quarterly",
      },
      {
        name: "Studify Premium - Anual",
        description: "Acesso completo ao Studify Premium por 1 ano",
        price: 23880, // R$ 238.80 em centavos (12x R$ 19.90)
        interval: "year",
        interval_count: 1,
        planId: "yearly",
      },
    ]

    const createdProducts = []

    for (const productData of productsToCreate) {
      console.log(`📦 Criando produto: ${productData.name}`)

      // Verificar se o produto já existe
      const existingProducts = await stripe.products.search({
        query: `name:'${productData.name}'`,
      })

      let product
      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0]
        console.log(`✅ Produto já existe: ${product.id}`)
      } else {
        // Criar novo produto
        product = await stripe.products.create({
          name: productData.name,
          description: productData.description,
          metadata: {
            planId: productData.planId,
          },
        })
        console.log(`✨ Produto criado: ${product.id}`)
      }

      // Verificar se o preço já existe
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      })

      let price
      if (existingPrices.data.length > 0) {
        price = existingPrices.data[0]
        console.log(`✅ Preço já existe: ${price.id}`)
      } else {
        // Criar novo preço
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: productData.price,
          currency: "brl",
          recurring: {
            interval: productData.interval as "month" | "year",
            interval_count: productData.interval_count,
          },
          metadata: {
            planId: productData.planId,
          },
        })
        console.log(`✨ Preço criado: ${price.id}`)
      }

      createdProducts.push({
        product,
        price,
        planId: productData.planId,
      })
    }

    console.log("✅ Configuração concluída!")

    return NextResponse.json({
      success: true,
      message: "Produtos configurados com sucesso",
      products: createdProducts,
    })
  } catch (error) {
    console.error("❌ Erro ao configurar produtos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao configurar produtos",
      },
      { status: 500 },
    )
  }
}
