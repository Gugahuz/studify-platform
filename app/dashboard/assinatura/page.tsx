"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, CreditCard, Crown, Loader2, Star, Zap, Shield, AlertCircle, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import EmbeddedCheckout from "@/components/embedded-checkout"

export default function AssinaturaPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [expiryDate, setExpiryDate] = useState<string | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [stripeProducts, setStripeProducts] = useState<any>(null)
  const [productsLoading, setProductsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string
    name: string
    priceId: string
    amount: string
  } | null>(null)

  // Buscar dados do usuário
  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("🔍 Buscando dados do usuário...")

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.error("❌ Erro na autenticação:", authError)
          return
        }

        if (!authUser) {
          console.log("❌ Usuário não autenticado")
          return
        }

        console.log("✅ Usuário autenticado:", authUser.id)
        setUser(authUser)

        // Buscar perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_premium, premium_expires_at")
          .eq("id", authUser.id)
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
          .eq("user_id", authUser.id)
          .eq("status", "active")
          .single()

        if (subscriptionError) {
          console.log("ℹ️ Nenhuma assinatura ativa encontrada")
        } else if (subscription) {
          console.log("✅ Assinatura ativa encontrada:", subscription)
          setCurrentPlan(subscription.plan_type)
        }
      } catch (error) {
        console.error("❌ Erro geral:", error)
      } finally {
        setUserLoading(false)
      }
    }

    getUser()
  }, [])

  // Buscar produtos do Stripe
  useEffect(() => {
    const fetchStripeProducts = async () => {
      try {
        console.log("🔍 Buscando produtos do Stripe...")
        setError(null)

        const response = await fetch("/api/stripe-products")

        if (!response.ok) {
          throw new Error(`Erro ao buscar produtos: ${response.status}`)
        }

        const data = await response.json()
        console.log("✅ Produtos do Stripe carregados:", data)

        if (!data.success) {
          throw new Error(data.error || "Erro ao carregar produtos")
        }

        setStripeProducts(data)
      } catch (error) {
        console.error("❌ Erro ao carregar produtos do Stripe:", error)
        setError(error instanceof Error ? error.message : "Erro ao carregar produtos")
        toast.error("Erro ao carregar produtos. Tente novamente.")
      } finally {
        setProductsLoading(false)
      }
    }

    fetchStripeProducts()
  }, [])

  // Função para processar assinatura
  const handleSubscribe = async (planId: string) => {
    console.log("🎯 BOTÃO CLICADO! handleSubscribe chamado com planId:", planId)

    if (!user?.id) {
      console.error("❌ Usuário não encontrado")
      toast.error("Você precisa estar logado para assinar")
      return
    }

    // Obter informações do plano
    const priceId = getPriceIdForPlan(planId)
    if (!priceId) {
      toast.error("Erro ao obter informações do plano")
      return
    }

    const planInfo = getPlanInfo(planId)

    setSelectedPlan({
      id: planId,
      name: planInfo.name,
      priceId: priceId,
      amount: planInfo.amount,
    })

    setShowCheckoutModal(true)
  }

  // Função para obter informações do plano
  const getPlanInfo = (planId: string) => {
    switch (planId) {
      case "monthly":
        return { name: "Mensal", amount: "R$ 29,90" }
      case "quarterly":
        return { name: "Trimestral", amount: "R$ 74,70" }
      case "yearly":
        return { name: "Anual", amount: "R$ 238,80" }
      default:
        return { name: "Desconhecido", amount: "R$ 0,00" }
    }
  }

  // Função para obter Price ID baseado no plano
  const getPriceIdForPlan = (planId: string): string | null => {
    if (!stripeProducts?.success || !stripeProducts?.products) {
      console.error("❌ Produtos do Stripe não carregados")
      return null
    }

    const planProducts = stripeProducts.products[planId]

    if (Array.isArray(planProducts) && planProducts.length > 0) {
      return planProducts[0].id
    }

    console.error(`❌ Price ID não encontrado para o plano: ${planId}`)
    return null
  }

  // Função chamada quando o pagamento é bem-sucedido
  const handlePaymentSuccess = async () => {
    console.log("🎉 Pagamento realizado com sucesso!")

    // Fechar modal
    setShowCheckoutModal(false)
    setSelectedPlan(null)

    // Recarregar dados do usuário
    toast.success("🎉 Bem-vindo ao Studify Premium!")

    // Aguardar um pouco e recarregar a página para atualizar o status
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  // Cancelar assinatura
  const handleCancelSubscription = async () => {
    if (!user?.id) return

    try {
      setLoading("cancel")
      console.log("🚫 Cancelando assinatura...")

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

  // Função para determinar o texto e estilo do botão
  const getButtonConfig = (planId: string) => {
    if (!isPremium) {
      return {
        text: "Assinar Agora",
        disabled: false,
        variant: planId === "quarterly" ? "studify" : "default",
        icon: null,
      }
    }

    if (currentPlan === planId) {
      return {
        text: "Plano Atual",
        disabled: true,
        variant: "secondary",
        icon: null,
      }
    }

    // Definir hierarquia dos planos
    const planHierarchy = { monthly: 1, quarterly: 2, yearly: 3 }
    const currentLevel = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0
    const targetLevel = planHierarchy[planId as keyof typeof planHierarchy] || 0

    if (targetLevel > currentLevel) {
      return {
        text: "Fazer Upgrade",
        disabled: false,
        variant: planId === "quarterly" ? "studify" : "default",
        icon: <ArrowUp className="mr-2 h-4 w-4" />,
      }
    } else {
      return {
        text: "Alterar Plano",
        disabled: false,
        variant: "outline",
        icon: <ArrowDown className="mr-2 h-4 w-4" />,
      }
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

  // Verificar se há parâmetros de sucesso/cancelamento na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get("success")
    const canceled = urlParams.get("canceled")

    if (success === "true") {
      toast.success("🎉 Pagamento realizado com sucesso! Bem-vindo ao Premium!")
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Recarregar dados do usuário
      window.location.reload()
    } else if (canceled === "true") {
      toast.error("Pagamento cancelado. Você pode tentar novamente a qualquer momento.")
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  if (userLoading || productsLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Você precisa estar logado para acessar esta página.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Verificar se os produtos estão disponíveis
  if (!stripeProducts?.success) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erro ao carregar produtos. Tente recarregar a página.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Assinatura Premium</h1>
        <p className="text-gray-600">Desbloqueie todo o potencial do Studify</p>
      </div>

      {/* Modal de Checkout Embarcado */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pt-6">
            <DialogTitle className="text-center text-xl font-semibold text-gray-900">Finalizar Assinatura</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Complete seu pagamento de forma rápida e segura
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="pb-6">
              <EmbeddedCheckout
                priceId={selectedPlan.priceId}
                userId={user.id}
                planName={selectedPlan.name}
                amount={selectedPlan.amount}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowCheckoutModal(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

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

      {/* DEBUG E ERRO */}
      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro:</strong> {error}
            <br />
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              Recarregar Página
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* PLANOS DE ASSINATURA */}
      <div className="grid gap-8 md:grid-cols-3 mb-8">
        {/* PLANO MENSAL */}
        <Card
          className={`relative transition-all duration-200 hover:shadow-lg ${
            currentPlan === "monthly" ? "border-studify-green bg-green-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {currentPlan === "monthly" && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-studify-green text-white px-4 py-1">Seu Plano</Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div
                className={`p-3 rounded-full ${
                  currentPlan === "monthly" ? "bg-studify-green text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                <Zap className="h-6 w-6" />
              </div>
            </div>

            <CardTitle className="text-xl">Mensal</CardTitle>
            <CardDescription className="text-sm">Perfeito para começar</CardDescription>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold">R$ 29.90</span>
                <span className="text-gray-500">/mês</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Cobrado mensalmente</p>
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Acesso completo ao assistente Studo</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Geração ilimitada de resumos</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Cronograma personalizado</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Simulados e exercícios</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Suporte prioritário</span>
              </li>
            </ul>

            {(() => {
              const config = getButtonConfig("monthly")
              return (
                <button
                  className={`w-full py-2 px-4 rounded-md transition-colors disabled:opacity-50 ${
                    config.variant === "studify"
                      ? "bg-studify-green hover:bg-studify-green/90 text-white"
                      : config.variant === "secondary"
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : config.variant === "outline"
                          ? "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                  onClick={() => {
                    console.log("🖱️ CLIQUE DETECTADO! Plano: monthly")
                    handleSubscribe("monthly")
                  }}
                  disabled={config.disabled || loading === "monthly"}
                >
                  {loading === "monthly" ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      {config.icon}
                      {config.text}
                    </div>
                  )}
                </button>
              )
            })()}
          </CardContent>
        </Card>

        {/* PLANO TRIMESTRAL */}
        <Card
          className={`relative transition-all duration-200 hover:shadow-lg ${
            currentPlan === "quarterly"
              ? "border-studify-green bg-green-50"
              : "border-studify-green shadow-lg scale-105 bg-gradient-to-b from-green-50 to-white"
          }`}
        >
          {currentPlan === "quarterly" ? (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-studify-green text-white px-4 py-1">Seu Plano</Badge>
            </div>
          ) : (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-studify-green text-white px-4 py-1">Mais Popular</Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-studify-green text-white">
                <Star className="h-6 w-6" />
              </div>
            </div>

            <CardTitle className="text-xl">Trimestral</CardTitle>
            <CardDescription className="text-sm">Melhor custo-benefício</CardDescription>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold">R$ 24.90</span>
                <span className="text-gray-500">/mês</span>
              </div>

              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-sm text-gray-400 line-through">De R$ 29.90</span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Economize 17%
                </Badge>
              </div>

              <p className="text-xs text-gray-500 mt-2">Cobrado a cada 3 meses (R$ 74,70)</p>
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Acesso completo ao assistente Studo</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Geração ilimitada de resumos</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Cronograma personalizado</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Simulados e exercícios</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Suporte prioritário</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Relatórios de progresso avançados</span>
              </li>
            </ul>

            {(() => {
              const config = getButtonConfig("quarterly")
              return (
                <button
                  className={`w-full py-2 px-4 rounded-md transition-colors disabled:opacity-50 ${
                    config.variant === "studify"
                      ? "bg-studify-green hover:bg-studify-green/90 text-white"
                      : config.variant === "secondary"
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : config.variant === "outline"
                          ? "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                  onClick={() => {
                    console.log("🖱️ CLIQUE DETECTADO! Plano: quarterly")
                    handleSubscribe("quarterly")
                  }}
                  disabled={config.disabled || loading === "quarterly"}
                >
                  {loading === "quarterly" ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      {config.icon}
                      {config.text}
                    </div>
                  )}
                </button>
              )
            })()}
          </CardContent>
        </Card>

        {/* PLANO ANUAL */}
        <Card
          className={`relative transition-all duration-200 hover:shadow-lg ${
            currentPlan === "yearly" ? "border-studify-green bg-green-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {currentPlan === "yearly" && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-studify-green text-white px-4 py-1">Seu Plano</Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div
                className={`p-3 rounded-full ${
                  currentPlan === "yearly" ? "bg-studify-green text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                <Crown className="h-6 w-6" />
              </div>
            </div>

            <CardTitle className="text-xl">Anual</CardTitle>
            <CardDescription className="text-sm">Máxima economia</CardDescription>

            <div className="mt-4">
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold">R$ 19.90</span>
                <span className="text-gray-500">/mês</span>
              </div>

              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-sm text-gray-400 line-through">De R$ 29.90</span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Economize 33%
                </Badge>
              </div>

              <p className="text-xs text-gray-500 mt-2">Cobrado anualmente (R$ 238,80)</p>
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Acesso completo ao assistente Studo</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Geração ilimitada de resumos</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Cronograma personalizado</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Simulados e exercícios</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Suporte prioritário</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Relatórios de progresso avançados</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Acesso antecipado a novas funcionalidades</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-4 w-4 text-studify-green flex-shrink-0 mt-0.5" />
                <span className="text-sm">Consultoria personalizada mensal</span>
              </li>
            </ul>

            {(() => {
              const config = getButtonConfig("yearly")
              return (
                <button
                  className={`w-full py-2 px-4 rounded-md transition-colors disabled:opacity-50 ${
                    config.variant === "studify"
                      ? "bg-studify-green hover:bg-studify-green/90 text-white"
                      : config.variant === "secondary"
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : config.variant === "outline"
                          ? "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                  onClick={() => {
                    console.log("🖱️ CLIQUE DETECTADO! Plano: yearly")
                    handleSubscribe("yearly")
                  }}
                  disabled={config.disabled || loading === "yearly"}
                >
                  {loading === "yearly" ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      {config.icon}
                      {config.text}
                    </div>
                  )}
                </button>
              )
            })()}
          </CardContent>
        </Card>
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
