"use client"

import { Loader2, Shield, Lock, CreditCard } from "lucide-react"

export default function CheckoutLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center space-y-6 p-8">
        {/* Ícone de Loading */}
        <div className="relative">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 absolute -top-1 -right-1" />
        </div>

        {/* Texto Principal */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">Inicializando pagamento seguro</h3>
          <p className="text-gray-600">Preparando sua sessão de checkout...</p>
        </div>

        {/* Indicadores de Segurança */}
        <div className="space-y-3 max-w-sm mx-auto">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="h-3 w-3 text-green-600" />
            </div>
            <span>Conexão segura SSL</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Lock className="h-3 w-3 text-green-600" />
            </div>
            <span>Dados protegidos pelo Stripe</span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-48 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: "60%" }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
