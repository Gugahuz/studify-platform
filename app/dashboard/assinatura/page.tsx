"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, CreditCard, Crown, Loader2, Star, Zap, Shield } from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

// Planos de assinatura
const plans = [
  {
    id: "monthly",
    name: "Mensal",
    description: "Perfeito para começar",
    price: 29.9,
    interval: "mês",
    billingCycle: "Cobrado mensalmente",
    features: [
      "Acesso completo ao assistente Studo",
      "Geração ilimitada de resumos",
      "Cronograma personalizado",
      "Simulados e exercícios",
      "Suporte prioritário",
    ],
    icon: Zap,
  },
  {
    id: "quarterly",
    name: "Trimestral",
    description: "Melhor custo-benefício",
    price: 24.9,
    originalPrice: 29.9,
    interval: "mês",
    billingCycle: "Cobrado a cada 3 meses (R$ 74,70)",
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
    icon: Star,
  },
  {
    id: "yearly",
    name: "Anual",
    description: "Máxima economia",
    price: 19.9,
    originalPrice: 29.9,
    interval: "mês",
    billingCycle: "Cobrado anualmente (R$ 238,80)",
    features: [
      "Acesso completo ao assistente Studo",
      "Geração ilimitada de resumos",
      "Cronograma personalizado",
      "Simulados e exercícios",
      "Suporte prioritário",
      "Relatórios de progresso avançados",
      "Acesso antecipado a novas funcionalidades",
      "Consultoria personalizada mensal",
    ],
    savings: "Economize 33%",
    icon: Crown,
  },
]

export default function AssinaturaPage() {
  const { user, loading: userLoading, refreshUserData } = useUserData()
  const [loading, setLoading] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [expiryDate, setExpiryDate] = useState<string | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  // Buscar status de assinatura ao carregar
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user?.id) return

      try {
        console.log("🔍 Buscando status de assinatura para usuário:", user.id)

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_premium, premium_expires_at")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("❌ Erro ao buscar perfil:", profileError)
        } else if (profile) {
          console.log("✅ Perfil encontrado:", profile)
          setIsPremium(profile.is_premium || false)
          setExpiryDate(profile.premium_expires_at)
        }

        // Buscar assinatura ativa
        const { data: subscription, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single()

        if (subscriptionError) {
          console.log("ℹ️ Nenhuma assinatura ativa encontrada")
        } else if (subscription) {
          console.log("✅ Assinatura ativa encontrada:", subscription)
          setCurrentPlan(subscription.plan_type)
          setSubscriptionData(subscription)
        }
      } catch (error) {
        console.error("❌ Erro ao buscar status de assinatura:", error)
      }
    }

    fetchSubscriptionStatus()
  }, [user?.id])

  // Simular assinatura (para ambiente de teste)
  const handleSubscribe = async (planId: string) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para assinar")
      return
    }

    try {
      setLoading(planId)
      console.log(`🚀 Iniciando assinatura do plano: ${planId}`)

      // Simular processamento de pagamento
      toast.loading("Processando pagamento...", { id: "payment" })
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Calcular data de expiração baseada no plano
      const now = new Date()
      const expiryDate = new Date()

      if (planId === "monthly") {
        expiryDate.setMonth(now.getMonth() + 1)
      } else if (planId === "quarterly") {
        expiryDate.setMonth(now.getMonth() + 3)
      } else if (planId === "yearly") {
        expiryDate.setFullYear(now.getFullYear() + 1)
      }

      console.log("📅 Data de expiração calculada:", expiryDate)

      // Atualizar status premium no banco de dados
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_expires_at: expiryDate.toISOString(),
        })
        .eq("id", user.id)

      if (profileError) {
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`)
      }

      console.log("✅ Perfil atualizado com status premium")

      // Cancelar assinatura anterior se existir
      await supabase.from("subscriptions").update({ status: "canceled" }).eq("user_id", user.id).eq("status", "active")

      // Registrar nova assinatura no banco
      const subscriptionId = `sub_${planId}_${Date.now()}`
      const { error: subscriptionError } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: `cus_sim_${user.id}`,
        status: "active",
        plan_type: planId,
        current_period_start: now.toISOString(),
        current_period_end: expiryDate.toISOString(),
      })

      if (subscriptionError) {
        throw new Error(`Erro ao registrar assinatura: ${subscriptionError.message}`)
      }

      console.log("✅ Assinatura registrada no banco")

      // Registrar pagamento simulado
      const amount = planId === "monthly" ? 2990 : planId === "quarterly" ? 7470 : 23880
      await supabase.from("payments").insert({
        user_id: user.id,
        stripe_payment_intent_id: `pi_sim_${Date.now()}`,
        amount,
        currency: "brl",
        status: "succeeded",
      })

      console.log("✅ Pagamento registrado")

      // Atualizar estado local
      setIsPremium(true)
      setCurrentPlan(planId)
      setExpiryDate(expiryDate.toISOString())

      // Atualizar dados do usuário
      refreshUserData()

      toast.dismiss("payment")
      toast.success("🎉 Assinatura realizada com sucesso! Bem-vindo ao Premium!")
    } catch (error) {
      console.error("❌ Erro ao processar assinatura:", error)
      toast.dismiss("payment")
      toast.error(error instanceof Error ? error.message : "Erro ao processar assinatura")
    } finally {
      setLoading(null)
    }
  }

  // Cancelar assinatura
  const handleCancelSubscription = async () => {
    if (!user?.id) return

    try {
      setLoading("cancel")
      console.log("🚫 Cancelando assinatura...")

      // Simular processamento
      toast.loading("Cancelando assinatura...", { id: "cancel" })
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Atualizar status premium
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_premium: false,
          premium_expires_at: null,
        })
        .eq("id", user.id)

      if (profileError) {
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`)
      }

      // Atualizar assinatura
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
        })
        .eq("user_id", user.id)
        .eq("status", "active")

      if (subscriptionError) {
        throw new Error(`Erro ao cancelar assinatura: ${subscriptionError.message}`)
      }

      // Atualizar estado local
      setIsPremium(false)
      setCurrentPlan(null)
      setExpiryDate(null)
      setSubscriptionData(null)

      // Atualizar dados do usuário
      refreshUserData()

      toast.dismiss("cancel")
      toast.success("Assinatura cancelada com sucesso")
      console.log("✅ Assinatura cancelada")
    } catch (error) {
      console.error("❌ Erro ao cancelar assinatura:", error)
      toast.dismiss("cancel")
      toast.error(error instanceof Error ? error.message : "Erro ao cancelar assinatura")
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const getPlanName = (planType: string) => {
    switch (planType) {
      case "monthly":
        return "Mensal"
      case "quarterly":
        return "Trimestral"
      case "yearly":
        return "Anual"
      default:
        return "Desconhecido"
    }
  }

  if (userLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Assinatura Premium</h1>
        <p className="text-gray-600">Desbloqueie todo o potencial do Studify</p>
      </div>

      {isPremium ? (
        <Card className="mb-8 border-studify-green bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-studify-green rounded-full">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-studify-green text-xl">Você é Premium! 🎉</CardTitle>
                <CardDescription>Aproveite todos os recursos exclusivos do Studify</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Plano atual</p>
                  <Badge className="bg-studify-green">{getPlanName(currentPlan || "")}</Badge>
                </div>
              </div>
              {expiryDate && (
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Válido até</p>
                    <p className="font-medium">{formatDate(expiryDate)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className="bg-green-500">Ativo</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={loading === "cancel"}
                className="mr-4"
              >
                {loading === "cancel" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Cancelar Assinatura"
                )}
              </Button>
              <span className="text-sm text-gray-500">
                Você pode cancelar a qualquer momento. O acesso continuará até o final do período pago.
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="text-amber-700">Escolha seu plano Premium</CardTitle>
            <CardDescription>
              Desbloqueie recursos avançados e acelere seus estudos com nossa tecnologia de IA
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-3 mb-8">
        {plans.map((plan) => {
          const IconComponent = plan.icon
          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.popular
                  ? "border-studify-green shadow-lg scale-105 bg-gradient-to-b from-green-50 to-white"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-studify-green text-white px-4 py-1">Mais Popular</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div
                    className={`p-3 rounded-full ${
                      plan.popular ? "bg-studify-green text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>

                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>

                <div className="mt-4">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-gray-500">/{plan.interval}</span>
                  </div>

                  {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-sm text-gray-400 line-through">De R$ {plan.originalPrice.toFixed(2)}</span>
                      {plan.savings && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">{plan.billingCycle}</p>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular ? "bg-studify-green hover:bg-studify-green/90" : "bg-gray-900 hover:bg-gray-800"
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id || isPremium}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : isPremium ? (
                    "Plano Atual"
                  ) : (
                    "Assinar Agora"
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-studify-green" />
              Por que escolher o Premium?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">🤖 Assistente IA Avançado</h4>
                <p className="text-sm text-gray-600">
                  Converse com o Studo sem limites e receba ajuda personalizada para seus estudos
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">📚 Resumos Ilimitados</h4>
                <p className="text-sm text-gray-600">
                  Gere quantos resumos precisar com nossa tecnologia de IA avançada
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">📅 Cronograma Inteligente</h4>
                <p className="text-sm text-gray-600">
                  Planejamento automático baseado em seus objetivos e disponibilidade
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">🎯 Simulados Personalizados</h4>
                <p className="text-sm text-gray-600">Pratique com questões adaptadas ao seu nível e área de estudo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Garantias e Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">🔒 Pagamento Seguro</h4>
                <p className="text-sm text-gray-600">Processamento seguro com criptografia de ponta</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">↩️ Cancelamento Fácil</h4>
                <p className="text-sm text-gray-600">Cancele a qualquer momento, sem taxas ou complicações</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">📞 Suporte Prioritário</h4>
                <p className="text-sm text-gray-600">Atendimento especializado para usuários premium</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">🔄 Atualizações Gratuitas</h4>
                <p className="text-sm text-gray-600">Acesso a todas as novas funcionalidades sem custo adicional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
