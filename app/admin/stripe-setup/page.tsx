"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Settings, CreditCard, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function StripeSetupPage() {
  const [loading, setLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false)

  // Executar diagnóstico automaticamente ao carregar
  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    try {
      setDiagnosticsLoading(true)
      console.log("🔍 Executando diagnósticos...")

      const response = await fetch("/api/test-stripe-setup")
      const data = await response.json()

      console.log("📊 Resultado do diagnóstico:", data)
      setDiagnostics(data)

      if (data.success && data.stripe_data?.products_count > 0) {
        setSetupComplete(true)
      }
    } catch (error) {
      console.error("❌ Erro no diagnóstico:", error)
      toast.error("Erro ao executar diagnósticos")
    } finally {
      setDiagnosticsLoading(false)
    }
  }

  const handleSetupProducts = async () => {
    try {
      setLoading(true)
      console.log("🚀 Iniciando configuração dos produtos...")

      const response = await fetch("/api/setup-stripe-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log("✅ Produtos configurados:", data.products)
        setProducts(data.products)
        setSetupComplete(true)
        toast.success("Produtos configurados com sucesso!")

        // Executar diagnóstico novamente
        await runDiagnostics()
      } else {
        throw new Error(data.error || "Erro ao configurar produtos")
      }
    } catch (error) {
      console.error("❌ Erro:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao configurar produtos")
    } finally {
      setLoading(false)
    }
  }

  const testStripeConnection = async () => {
    try {
      const response = await fetch("/api/stripe-products")
      const data = await response.json()

      if (data.success) {
        toast.success("Conexão com Stripe OK!")
        console.log("Produtos existentes:", data)
      } else {
        toast.error("Erro na conexão com Stripe")
      }
    } catch (error) {
      toast.error("Erro ao testar conexão")
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuração do Stripe</h1>
        <p className="text-gray-600">Configure os produtos de assinatura do Studify</p>
      </div>

      <div className="grid gap-6">
        {/* Diagnósticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Diagnósticos do Sistema
              <Button
                variant="outline"
                size="sm"
                onClick={runDiagnostics}
                disabled={diagnosticsLoading}
                className="ml-auto"
              >
                {diagnosticsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </CardTitle>
            <CardDescription>Verificação automática da configuração</CardDescription>
          </CardHeader>
          <CardContent>
            {diagnosticsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Executando diagnósticos...</span>
              </div>
            ) : diagnostics ? (
              <div className="space-y-4">
                {/* Status Geral */}
                <div className="flex items-center gap-2">
                  <Badge variant={diagnostics.success ? "default" : "destructive"}>
                    {diagnostics.success ? "✅ OK" : "❌ Erro"}
                  </Badge>
                  <span className="text-sm">
                    {diagnostics.success ? "Sistema configurado corretamente" : diagnostics.error}
                  </span>
                </div>

                {/* Verificação de Variáveis */}
                <div>
                  <h4 className="font-semibold mb-2">Variáveis de Ambiente:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2">
                      {diagnostics.checks?.stripe_secret_key ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">STRIPE_SECRET_KEY</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {diagnostics.checks?.stripe_publishable_key ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">STRIPE_PUBLISHABLE_KEY</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {diagnostics.checks?.app_url ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">APP_URL</span>
                    </div>
                  </div>
                </div>

                {/* Dados do Stripe */}
                {diagnostics.stripe_data && (
                  <div>
                    <h4 className="font-semibold mb-2">Dados do Stripe:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Produtos:</span>
                        <span className="ml-2">{diagnostics.stripe_data.products_count}</span>
                      </div>
                      <div>
                        <span className="font-medium">Preços:</span>
                        <span className="ml-2">{diagnostics.stripe_data.prices_count}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Debug JSON */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Ver dados completos</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(diagnostics, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-gray-500">Clique em atualizar para executar diagnósticos</p>
            )}
          </CardContent>
        </Card>

        {/* Status da Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Status da Configuração
            </CardTitle>
            <CardDescription>Configure os produtos de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant={setupComplete ? "default" : "secondary"}>
                {setupComplete ? "Configurado" : "Pendente"}
              </Badge>
              {setupComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSetupProducts} disabled={loading} className="flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Configurar Produtos
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={testStripeConnection}>
                Testar Conexão
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Produtos Configurados */}
        {(products.length > 0 || diagnostics?.stripe_data?.products?.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Produtos Configurados</CardTitle>
              <CardDescription>Lista dos produtos criados no Stripe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Produtos recém criados */}
                {products.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <Badge>{item.planId}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.product.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Product ID:</span>
                        <code className="ml-2 bg-gray-100 px-1 rounded">{item.product.id}</code>
                      </div>
                      <div>
                        <span className="font-medium">Price ID:</span>
                        <code className="ml-2 bg-gray-100 px-1 rounded">{item.price.id}</code>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Produtos existentes */}
                {diagnostics?.stripe_data?.products?.map((product: any, index: number) => (
                  <div key={`existing-${index}`} className="border rounded-lg p-4 bg-blue-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="outline">Existente</Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Product ID:</span>
                      <code className="ml-2 bg-gray-100 px-1 rounded">{product.id}</code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>✅ Variáveis de ambiente configuradas</li>
              <li>{diagnostics?.success ? "✅" : "⏳"} Configure os produtos clicando em "Configurar Produtos"</li>
              <li>🔄 Teste a página de assinatura em /dashboard/assinatura</li>
              <li>🔗 Configure o webhook do Stripe para processar pagamentos</li>
            </ol>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Dica:</strong> Se a página de assinatura ainda estiver em branco, verifique o console do
                navegador (F12) para ver os erros específicos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
