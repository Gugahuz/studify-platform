"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, CreditCard, Lock, Shield, CheckCircle, AlertCircle, Crown, Star, Zap } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

// Inicializar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutFormProps {
  priceId: string
  userId: string
  planName: string
  amount: string
  onSuccess: () => void
  onCancel: () => void
}

function CheckoutForm({ priceId, userId, planName, amount, onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [cardError, setCardError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)

  // Criar Payment Intent
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        console.log("🔄 Criando Payment Intent...")

        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId, userId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao criar Payment Intent")
        }

        const data = await response.json()
        console.log("✅ Payment Intent criado:", data.clientSecret)
        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error("❌ Erro ao criar Payment Intent:", error)
        toast.error("Erro ao inicializar pagamento")
      }
    }

    createPaymentIntent()
  }, [priceId, userId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) return

    if (!email || !name) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setLoading(true)
    setCardError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setLoading(false)
      return
    }

    try {
      console.log("💳 Processando pagamento...")

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: name,
            email: email,
          },
        },
      })

      if (error) {
        console.error("❌ Erro no pagamento:", error)
        setCardError(error.message || "Erro no pagamento")
        toast.error(error.message || "Erro no pagamento")
      } else if (paymentIntent.status === "succeeded") {
        console.log("✅ Pagamento realizado com sucesso!")

        // Atualizar status do usuário imediatamente
        await updateUserPremiumStatus(userId, planName, paymentIntent.id)

        toast.success("🎉 Pagamento realizado com sucesso!")
        onSuccess()
      }
    } catch (error) {
      console.error("❌ Erro ao processar pagamento:", error)
      toast.error("Erro ao processar pagamento")
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar status premium do usuário
  const updateUserPremiumStatus = async (userId: string, planName: string, paymentIntentId: string) => {
    try {
      console.log("🔄 Atualizando status premium do usuário...")

      // Primeiro, buscar o perfil do usuário para obter o customer ID
      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("stripe_customer_id, email")
        .eq("id", userId)
        .single()

      if (profileFetchError || !profile) {
        console.error("❌ Erro ao buscar perfil:", profileFetchError)
        throw new Error("Perfil do usuário não encontrado")
      }

      if (!profile.stripe_customer_id) {
        console.error("❌ Customer ID não encontrado no perfil")
        throw new Error("Customer ID não encontrado")
      }

      // Calcular data de expiração baseada no plano
      const now = new Date()
      let expiryDate: Date

      switch (planName) {
        case "Mensal":
          expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias
          break
        case "Trimestral":
          expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 dias
          break
        case "Anual":
          expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 365 dias
          break
        default:
          expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Default 30 dias
      }

      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          premium_expires_at: expiryDate.toISOString(),
        })
        .eq("id", userId)

      if (profileError) {
        console.error("❌ Erro ao atualizar perfil:", profileError)
        throw profileError
      }

      // Mapear nome do plano para tipo de plano
      const planType = planName === "Mensal" ? "monthly" : planName === "Trimestral" ? "quarterly" : "yearly"

      // Verificar se já existe uma assinatura para este usuário
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (existingSubscription) {
        // Atualizar assinatura existente
        console.log("🔄 Atualizando assinatura existente...")
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            plan_type: planType,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: expiryDate.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("user_id", userId)

        if (updateError) {
          console.error("❌ Erro ao atualizar assinatura:", updateError)
          throw updateError
        }
      } else {
        // Criar nova assinatura com todos os campos obrigatórios
        console.log("✨ Criando nova assinatura...")
        const { error: insertError } = await supabase.from("subscriptions").insert({
          user_id: userId,
          stripe_subscription_id: `pi_${paymentIntentId}`, // Usar Payment Intent ID como referência
          stripe_customer_id: profile.stripe_customer_id, // Incluir customer ID
          plan_type: planType,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: expiryDate.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })

        if (insertError) {
          console.error("❌ Erro ao criar assinatura:", insertError)
          throw insertError
        }
      }

      // Registrar o pagamento
      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        amount: Number.parseFloat(amount.replace("R$", "").replace(",", ".").replace(" ", "")) * 100, // Converter para centavos
        currency: "brl",
        status: "succeeded",
      })

      if (paymentError) {
        console.error("❌ Erro ao registrar pagamento:", paymentError)
        // Não vamos falhar por causa disso, apenas logar
      }

      console.log("✅ Status premium atualizado com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao atualizar status premium:", error)
      toast.error("Pagamento processado, mas houve erro ao atualizar seu status. Entre em contato com o suporte.")
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1f2937",
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSmoothing: "antialiased",
        "::placeholder": {
          color: "#9ca3af",
        },
        iconColor: "#6b7280",
      },
      invalid: {
        color: "#ef4444",
        iconColor: "#ef4444",
      },
      complete: {
        color: "#059669",
        iconColor: "#059669",
      },
    },
    hidePostalCode: true,
  }

  const getPlanIcon = () => {
    switch (planName) {
      case "Mensal":
        return <Zap className="h-5 w-5 text-blue-600" />
      case "Trimestral":
        return <Star className="h-5 w-5 text-studify-green" />
      case "Anual":
        return <Crown className="h-5 w-5 text-purple-600" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  const getPlanColor = () => {
    switch (planName) {
      case "Mensal":
        return "border-blue-200 bg-blue-50"
      case "Trimestral":
        return "border-green-200 bg-green-50"
      case "Anual":
        return "border-purple-200 bg-purple-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  if (!clientSecret) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 bg-studify-green rounded-full flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <Loader2 className="h-4 w-4 animate-spin text-studify-green absolute -top-1 -right-1" />
        </div>
        <div className="text-center">
          <h3 className="font-medium text-gray-900">Preparando pagamento</h3>
          <p className="text-sm text-gray-600">Aguarde um momento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-6">
      {/* Header do Plano */}
      <div className={`rounded-lg border-2 p-4 ${getPlanColor()}`}>
        <div className="flex items-center gap-3 mb-3">
          {getPlanIcon()}
          <div>
            <h3 className="font-semibold text-gray-900">Plano {planName}</h3>
            <p className="text-sm text-gray-600">Studify Premium</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">{amount}</span>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {planName === "Mensal" ? "por mês" : planName === "Trimestral" ? "por trimestre" : "por ano"}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            E-mail *
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="h-11"
            required
          />
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Nome completo *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className="h-11"
            required
          />
        </div>

        {/* Cartão */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Informações do cartão *</Label>
          <div className="border border-gray-300 rounded-md p-3 bg-white focus-within:ring-2 focus-within:ring-studify-green focus-within:border-studify-green transition-colors">
            <CardElement
              options={cardElementOptions}
              onChange={(event) => {
                setCardError(event.error ? event.error.message : null)
                setCardComplete(event.complete)
              }}
            />
          </div>
          {cardError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{cardError}</span>
            </div>
          )}
          <p className="text-xs text-gray-500">💳 Teste: 4242 4242 4242 4242 | Data: qualquer futura | CVC: 123</p>
        </div>

        <Separator />

        {/* Resumo */}
        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{amount}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{amount}</span>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Button
            type="submit"
            disabled={!stripe || loading || !cardComplete}
            className="w-full h-11 bg-studify-green hover:bg-studify-green/90 text-white font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Finalizar Pagamento
              </>
            )}
          </Button>

          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="w-full h-11">
            Cancelar
          </Button>
        </div>

        {/* Segurança */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Lock className="h-3 w-3 text-green-600" />
            <span>Pagamento 100% seguro com SSL</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Shield className="h-3 w-3 text-green-600" />
            <span>Dados protegidos pelo Stripe</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>Cancele a qualquer momento</span>
          </div>
        </div>

        {/* Termos */}
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          Ao finalizar, você concorda com nossos{" "}
          <button type="button" className="text-studify-green hover:underline">
            Termos de Uso
          </button>{" "}
          e{" "}
          <button type="button" className="text-studify-green hover:underline">
            Política de Privacidade
          </button>
        </p>

        {/* Powered by Stripe */}
        <div className="text-center pt-2 pb-4">
          <div className="inline-flex items-center gap-1 text-xs text-gray-500">
            <span>Powered by</span>
            <span className="font-semibold text-blue-600">stripe</span>
          </div>
        </div>
      </form>
    </div>
  )
}

interface EmbeddedCheckoutProps {
  priceId: string
  userId: string
  planName: string
  amount: string
  onSuccess: () => void
  onCancel: () => void
}

export default function EmbeddedCheckout(props: EmbeddedCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
