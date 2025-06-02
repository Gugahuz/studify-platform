"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Lock, CheckCircle } from "lucide-react"
import { toast } from "sonner"

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

  // Criar Payment Intent quando o componente carrega
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        console.log("🔄 Criando Payment Intent...")

        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId,
            userId,
          }),
        })

        if (!response.ok) {
          throw new Error("Erro ao criar Payment Intent")
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

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)

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
        },
      })

      if (error) {
        console.error("❌ Erro no pagamento:", error)
        toast.error(error.message || "Erro no pagamento")
      } else if (paymentIntent.status === "succeeded") {
        console.log("✅ Pagamento realizado com sucesso!")
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

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
        fontFamily: '"Inter", sans-serif',
      },
      invalid: {
        color: "#9e2146",
      },
    },
    hidePostalCode: false,
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Inicializando pagamento...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resumo do Plano */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Plano {planName}</h3>
            <p className="text-sm text-gray-600">Studify Premium</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{amount}</p>
            <p className="text-sm text-gray-600">
              {planName === "Mensal" ? "/mês" : planName === "Trimestral" ? "/trimestre" : "/ano"}
            </p>
          </div>
        </div>
      </div>

      {/* Informações de Segurança */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <Lock className="h-4 w-4 text-blue-600" />
        <span>Seus dados estão protegidos com criptografia SSL de 256 bits</span>
      </div>

      {/* Campo do Cartão */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Informações do Cartão</label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-gray-500">Use o cartão de teste: 4242 4242 4242 4242 para testar</p>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-studify-green hover:bg-studify-green/90"
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
      </div>

      {/* Garantias */}
      <div className="text-center space-y-2 pt-4 border-t">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Cancele a qualquer momento</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Suporte 24/7 para usuários premium</span>
        </div>
      </div>
    </form>
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
