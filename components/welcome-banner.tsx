"use client"

import { useUserData } from "@/hooks/use-user-data"
import { useSubscription } from "@/hooks/use-subscription"
import { getCurrentDate, getGreeting } from "@/utils/date-helpers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function WelcomeBanner() {
  const { userProfile } = useUserData()
  const { subscriptionStatus, loading: subscriptionLoading } = useSubscription(userProfile?.id)
  const greeting = getGreeting()
  const currentDate = getCurrentDate()
  const userName = userProfile?.nome || "Estudante"

  // Verificar se o usuário realmente tem assinatura ativa do banco de dados
  const isPro = subscriptionStatus?.isPremium || false

  return (
    <div className="relative h-20">
      {/* Mascote com proporções naturais e parte fora da caixa */}
      <img
        src="/images/studify-mascot-green.png"
        alt="Mascote Studify"
        className="absolute z-20 drop-shadow-xl object-contain"
        style={{
          left: "-10px",
          top: "-25px",
          width: "110px",
          height: "130px",
        }}
        onError={(e) => {
          e.currentTarget.style.display = "none"
        }}
      />

      {/* Banner principal - DIV independente */}
      <Card className="bg-gradient-to-r from-studify-green to-studify-lightgreen text-white border-0 h-20">
        <CardContent className="p-0 h-full">
          <div
            className="flex items-center justify-between h-full"
            style={{ paddingLeft: "100px", paddingRight: "24px" }}
          >
            {/* Conteúdo de texto */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-0.5">
                {greeting}, {userName}!
              </h1>
              <p className="text-green-100 text-sm capitalize">{currentDate} • Vamos Estudar Hoje?</p>
            </div>

            {/* Badge à direita */}
            <div className="flex-shrink-0">
              {!subscriptionLoading && (
                <Badge
                  variant={isPro ? "default" : "secondary"}
                  className={
                    isPro
                      ? "bg-yellow-500 text-yellow-900 border-yellow-400 font-semibold px-3 py-1"
                      : "bg-white/20 text-white border-white/30 px-3 py-1"
                  }
                >
                  {isPro ? "✨ Studify Pro" : "Studify Free"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
