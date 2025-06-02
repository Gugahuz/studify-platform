import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST() {
  try {
    console.log("🏗️ Criando produtos no Stripe...")

    const productsToCreate = [
      {
        name: "Studify Premium - Mensal",
        description: "Acesso completo ao Studify com recursos premium por 1 mês",
        metadata: { plan_type: "monthly" },
        price: {
          unit_amount: 2990, // R$ 29.90
          currency: "brl",
          recurring: { interval: "month", interval_count: 1 },
        },
      },
      {
        name: "Studify Premium - Trimestral",
        description: "Acesso completo ao Studify com recursos premium por 3 meses",
        metadata: { plan_type: "quarterly" },
        price: {
          unit_amount: 7470, // R$ 74.70 (R$ 24.90/mês)
          currency: "brl",
          recurring: { interval: "month", interval_count: 3 },
        },
      },
      {
        name: "Studify Premium - Anual",
        description: "Acesso completo ao Studify com recursos premium por 1 ano",
        metadata: { plan_type: "yearly" },
        price: {
          unit_amount: 23880, // R$ 238.80 (R$ 19.90/mês)
          currency: "brl",
          recurring: { interval: "year", interval_count: 1 },
        },
      },
    ]

    const createdProducts = []

    for (const productData of productsToCreate) {
      try {
        // Verificar se o produto já existe
        const existingProducts = await stripe.products.list({
          active: true,
        })

        const existingProduct = existingProducts.data.find(
          (p) => p.metadata.plan_type === productData.metadata.plan_type,
        )

        if (existingProduct) {
          console.log(`✅ Produto ${productData.metadata.plan_type} já existe:`, existingProduct.id)
          createdProducts.push({
            product: existingProduct,
            price: null,
            status: "already_exists",
          })
          continue
        }

        // Criar produto
        const product = await stripe.products.create({
          name: productData.name,
          description: productData.description,
          metadata: productData.metadata,
        })

        console.log(`✅ Produto criado: ${product.id}`)

        // Criar preço
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: productData.price.unit_amount,
          currency: productData.price.currency,
          recurring: productData.price.recurring,
          metadata: productData.metadata,
        })

        console.log(`✅ Preço criado: ${price.id}`)

        createdProducts.push({
          product,
          price,
          status: "created",
        })
      } catch (error) {
        console.error(`❌ Erro ao criar produto ${productData.metadata.plan_type}:`, error)
        createdProducts.push({
          product: null,
          price: null,
          status: "error",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Produtos processados com sucesso`,
      products: createdProducts,
    })
  } catch (error) {
    console.error("❌ Erro geral ao criar produtos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao criar produtos",
      },
      { status: 500 },
    )
  }
}
