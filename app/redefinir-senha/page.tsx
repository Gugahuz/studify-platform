"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Check for tokens in URL hash and set session
  useEffect(() => {
    const handleAuthTokens = async () => {
      try {
        // Get the hash from the URL
        const hash = window.location.hash

        if (hash) {
          // Parse the hash parameters
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get("access_token")
          const refreshToken = params.get("refresh_token")
          const type = params.get("type")

          console.log("Hash params:", { accessToken: !!accessToken, refreshToken: !!refreshToken, type })

          if (type === "recovery" && accessToken && refreshToken) {
            // Set the session with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) {
              console.error("Error setting session:", error)
              setError("Link de redefinição inválido ou expirado.")
            } else {
              console.log("Session set successfully:", data)
              setIsValidSession(true)
              // Clear the hash from URL for security
              window.history.replaceState(null, "", window.location.pathname)
            }
          } else {
            setError("Link de redefinição inválido.")
          }
        } else {
          // Check if there's already a valid session
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session) {
            setIsValidSession(true)
          } else {
            setError("Link de redefinição inválido ou expirado.")
          }
        }
      } catch (err) {
        console.error("Error handling auth tokens:", err)
        setError("Erro ao processar o link de redefinição.")
      } finally {
        setIsCheckingSession(false)
      }
    }

    handleAuthTokens()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.")
        setIsLoading(false)
        return
      }

      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.")
        setIsLoading(false)
        return
      }

      // Update password using Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error("Error updating password:", error)
        setError(error.message)
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive",
        })
      } else {
        console.log("Password updated successfully:", data)

        // Try to update the password in the profiles table as well
        try {
          if (data?.user?.email) {
            const { error: profileError } = await supabase
              .from("profiles")
              .update({ password: password })
              .ilike("email", data.user.email.toLowerCase())

            if (profileError) {
              console.error("Error updating profile password:", profileError)
            } else {
              console.log("Profile password updated successfully")
            }
          }
        } catch (profileError) {
          console.error("Error updating profile password:", profileError)
          // Continue even if profile update fails
        }

        toast({
          title: "Senha redefinida com sucesso!",
          description: "Você será redirecionado para a página de login.",
        })

        // Sign out to force fresh login
        await supabase.auth.signOut()

        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/")
        }, 2000)
      }
    } catch (err) {
      console.error("Error resetting password:", err)
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.")
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Verificando link de redefinição...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if session is invalid
  if (!isValidSession || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl font-bold text-gray-900">Link inválido</CardTitle>
            <CardDescription>{error || "O link de redefinição de senha é inválido ou expirou."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Redefinir senha</CardTitle>
          <CardDescription>Crie uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <CardFooter className="flex justify-end px-0 pt-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
