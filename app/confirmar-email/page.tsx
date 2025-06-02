"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ConfirmarEmailPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Obter token e tipo da URL
        const token = searchParams.get("token")
        const type = searchParams.get("type")

        if (!token || type !== "email_confirmation") {
          setIsVerifying(false)
          setIsSuccess(false)
          setErrorMessage("Link de confirmação inválido ou expirado.")
          return
        }

        console.log("🔍 Verificando token de confirmação de email...")

        // Verificar o token com o Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email_confirmation",
        })

        if (error) {
          console.error("❌ Erro ao confirmar email:", error)
          setIsSuccess(false)
          setErrorMessage(error.message || "Não foi possível confirmar seu email. O link pode ter expirado.")
        } else {
          console.log("✅ Email confirmado com sucesso!")
          setIsSuccess(true)
        }
      } catch (error) {
        console.error("❌ Exceção ao confirmar email:", error)
        setIsSuccess(false)
        setErrorMessage("Ocorreu um erro inesperado. Tente novamente mais tarde.")
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isVerifying ? (
            <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : isSuccess ? (
            <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          ) : (
            <div className="mx-auto bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          )}

          <CardTitle className="text-2xl font-bold text-gray-900">
            {isVerifying ? "Verificando seu email..." : isSuccess ? "Email confirmado!" : "Falha na confirmação"}
          </CardTitle>
          <CardDescription>
            {isVerifying
              ? "Aguarde enquanto verificamos seu email."
              : isSuccess
                ? "Seu email foi confirmado com sucesso."
                : errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isVerifying && (
            <Button
              className={isSuccess ? "bg-green-600 hover:bg-green-700 w-full" : "w-full"}
              onClick={() => router.push("/")}
            >
              {isSuccess ? "Ir para o login" : "Voltar para a página inicial"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
