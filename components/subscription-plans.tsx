"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Alert, AlertDescription } from "@/components/ui/alert"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Plan {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  priceId: string
  interval: string
  features: string[]
  popular?: boolean
  savings?: string
}

interface SubscriptionPlansProps {
  userId: string
  currentPlan?: string
}

export function SubscriptionPlans({ userId, currentPlan }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [configLoading, setConfigLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStripeConfig()
  }, [])

  const fetchStripeConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await fetch("/api/stripe-config")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch configuration")
      }

      console.log("📋 Stripe config:", data)

      // Criar planos baseados nos preços encontrados
      const newPlans: Plan[] = []

      // Plano Mensal
      if (data.prices.monthly.length > 0) {
        const monthlyPrice = data.prices.monthly[0]
        newPlans.push({
          id: "monthly",
          name: "Mensal",
          description: "Perfeito para começar",
          price: (monthlyPrice.amount || 2990) / 100,
          priceId: monthlyPrice.id,
          interval: "mês",
          features: [
            "Acesso completo ao assistente Studo",
            "Geração ilimitada de resumos",
            "Cronograma personalizado",
            "Simulados e exercícios",
            "Suporte prioritário",
          ],
        })
      }

      // Plano Trimestral
      if (data.prices.quarterly.length > 0) {
        const quarterlyPrice = data.prices.quarterly[0]
        const monthlyEquivalent =
          quarterlyPrice.interval_count === 3
            ? (quarterlyPrice.amount || 7470) / 3 / 100
            : (quarterlyPrice.amount || 2490) / 100

        newPlans.push({
          id: "quarterly",
          name: "Trimestral",
          description: "Melhor custo-benefício",
          price: monthlyEquivalent,
          originalPrice: 29.9,
          priceId: quarterlyPrice.id,
          interval: "mês",
          features: [
            "Acesso completo ao assistente Studo",
            "Geração ilimitada de resumos",
            "Cronograma personalizado",
            "Simulados e exercícios",
            "Suporte prioritário",
            "Relatórios de progresso avançados",
          ],
          popular: true,
          savings: "Economize 17%",
        })
      }

      // Plano Anual
      if (data.prices.yearly.length > 0) {
        const yearlyPrice = data.prices.yearly[0]
        const monthlyEquivalent =
          yearlyPrice.interval_count === 12
            ? (yearlyPrice.amount || 23880) / 12 / 100
            : (yearlyPrice.amount || 1990) / 100

        newPlans.push({
          id: "yearly",
          name: "Anual",
          description: "Máxima economia",
          price: monthlyEquivalent,
          originalPrice: 29.9,
          priceId: yearlyPrice.id,
          interval: "mês",
          features: [
            "Acesso completo ao assistente Studo",
            "Geração ilimitada de resumos",
            "Cronograma personalizado",
            "Simulados e exercícios",
            "Suporte prioritário",
            "Relatórios de progresso avançados",
            "Acesso antecipado a novas funcionalidades",
          ],
          savings: "Economize 33%",
        })
      }

      if (newPlans.length === 0) {
        throw new Error("Nenhum plano encontrado. Verifique se os preços estão configurados no Stripe.")
      }

      setPlans(newPlans)
      setError(null)
    } catch (error) {
      console.error("❌ Error fetching Stripe config:", error)
      setError(error instanceof Error ? error.message : "Erro ao carregar configuração")
    } finally {
      setConfigLoading(false)
    }
  }

  const handleSubscribe = async (priceId: string, planId: string) => {
    try {
      setLoading(planId)

      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          userId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar sessão de checkout")
      }

      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: result.sessionId })
        if (error) {
          throw new Error(error.message)
        }
      }
    } catch (error) {
      console.error("❌ Error creating checkout:", error)
      alert(`Erro ao processar pagamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setLoading(null)
    }
  }

  if (configLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={fetchStripeConfig}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (plans.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nenhum plano disponível no momento. Tente novamente mais tarde.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative ${plan.popular ? "border-studify-green shadow-lg scale-105" : "border-gray-200"}`}
        >
          {plan.popular && (
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-studify-green">Mais Popular</Badge>
          )}

          <CardHeader className="text-center">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                <span className="text-gray-500">/{plan.interval}</span>
              </div>

              {plan.originalPrice && (
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-sm text-gray-400 line-through">R$ {plan.originalPrice.toFixed(2)}</span>
                  {plan.savings && (
                    <Badge variant="secondary" className="text-xs">
                      {plan.savings}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-studify-green flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
              onClick={() => handleSubscribe(plan.priceId, plan.id)}
              disabled={loading === plan.id || currentPlan === plan.id}
            >
              {loading === plan.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : currentPlan === plan.id ? (
                "Plano Atual"
              ) : (
                "Assinar Agora"
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
