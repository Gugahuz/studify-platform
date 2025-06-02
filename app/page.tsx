import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Layout - Login First */}
      <div className="md:hidden min-h-screen bg-studify-white flex flex-col">
        {/* Header compacto para mobile */}
        <div className="bg-gradient-to-r from-studify-green to-studify-green text-studify-white p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <span className="studify-logo text-studify-white text-5xl font-bold tracking-wide drop-shadow-lg">
              studify
            </span>
          </div>
          <p className="text-base font-medium text-studify-white/90">Never stop learning</p>
        </div>

        {/* Login Section - Prioridade no mobile */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-studify-gray">Bem-vindo de volta</h2>
              <p className="text-studify-gray mt-1 text-sm">Never stop learning</p>
            </div>
            <LoginForm />
          </div>
        </div>

        {/* Features compactas no final */}
        <div className="bg-studify-lightgreen/10 p-4 space-y-2">
          <div className="flex items-center text-sm">
            <div className="bg-studify-green rounded-full p-1 mr-2">
              <svg className="h-3 w-3 text-studify-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-studify-gray">Assistente de estudos personalizado</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="bg-studify-green rounded-full p-1 mr-2">
              <svg className="h-3 w-3 text-studify-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-studify-gray">Resolução de dúvidas com IA</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="bg-studify-green rounded-full p-1 mr-2">
              <svg className="h-3 w-3 text-studify-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-studify-gray">Cronogramas de estudo otimizados</span>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Original */}
      <div className="hidden md:flex md:flex-1 bg-gradient-to-br from-studify-green to-studify-green text-studify-white p-6 md:p-12 flex-col justify-center">
        <div className="max-w-md mx-auto md:mx-0">
          <div className="mb-6 flex justify-start items-center h-16">
            <span className="studify-logo text-studify-white text-6xl font-bold tracking-wide drop-shadow-lg">
              studify
            </span>
          </div>

          <h2 className="text-4xl font-bold mb-6">Never stop learning</h2>
          <p className="text-lg mb-8 text-studify-white/90">
            Organize seus estudos, tire dúvidas e mantenha uma rotina produtiva com a ajuda da inteligência artificial.
          </p>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-studify-lightgreen rounded-full p-2 mr-3">
                <svg className="h-5 w-5 text-studify-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span>Assistente de estudos personalizado</span>
            </div>
            <div className="flex items-center">
              <div className="bg-studify-lightgreen rounded-full p-2 mr-3">
                <svg className="h-5 w-5 text-studify-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span>Resolução de dúvidas com IA</span>
            </div>
            <div className="flex items-center">
              <div className="bg-studify-lightgreen rounded-full p-2 mr-3">
                <svg className="h-5 w-5 text-studify-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span>Cronogramas de estudo otimizados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Login Section */}
      <div className="hidden md:flex md:flex-1 bg-studify-white p-6 md:p-12 items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8"></div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
