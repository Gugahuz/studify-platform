"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SupabaseConfigGuide() {
  const [showGuide, setShowGuide] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "✅ Copiado!",
      description: "Texto copiado para a área de transferência.",
    })
  }

  if (!showGuide) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGuide(true)}
          className="bg-white shadow-lg border-amber-300 text-amber-800 hover:bg-amber-50"
        >
          <Settings className="h-4 w-4 mr-2" />
          Configurar Supabase
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuração do Supabase para Testes
          </CardTitle>
          <CardDescription>
            Para desabilitar a confirmação de email e facilitar os testes, siga estas instruções:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">1. Acesse o Dashboard do Supabase</h3>
            <p className="text-sm text-gray-600">
              Vá para{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                supabase.com/dashboard
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">2. Navegue para Authentication Settings</h3>
            <p className="text-sm text-gray-600">
              No seu projeto, vá para: <strong>Authentication → Settings</strong>
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">3. Desabilite a Confirmação de Email</h3>
            <p className="text-sm text-gray-600">Procure pela seção "User Signups" e:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Desmarque "Enable email confirmations"</li>
              <li>Ou marque "Enable email confirmations" mas também marque "Enable manual linking"</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">4. Configurações Alternativas</h3>
            <p className="text-sm text-gray-600">Se a opção acima não estiver disponível, tente:</p>

            <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-xs font-mono mb-2">
                Na seção "Auth" → "Settings" → "Email Templates", você pode configurar:
              </p>
              <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                <li>Disable email confirmations</li>
                <li>Set confirmation URL to your domain</li>
                <li>Enable auto-confirm for testing</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">5. Confirmar Usuários Manualmente (Alternativa)</h3>
            <p className="text-sm text-gray-600">
              Se não conseguir desabilitar, você pode confirmar usuários manualmente no SQL Editor:
            </p>

            <div className="bg-gray-100 p-3 rounded-md">
              <code className="text-xs block mb-2">
                UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'usuario@email.com';
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard("UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'usuario@email.com';")
                }
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar SQL
              </Button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Importante:</strong> Essas configurações são apenas para desenvolvimento/teste. Em produção,
              sempre mantenha a confirmação de email habilitada para segurança.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowGuide(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                window.open("https://supabase.com/dashboard", "_blank")
                setShowGuide(false)
              }}
            >
              Abrir Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
