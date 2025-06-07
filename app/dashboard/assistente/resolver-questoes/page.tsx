"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"

// Função para formatar equações matemáticas
const formatMathEquation = (text: string) => {
  return text
    .replace(/([a-zA-Z])([²³⁴⁵⁶⁷⁸⁹¹⁰])/g, "<strong>$1$2</strong>")
    .replace(/([0-9]+[a-zA-Z][²³⁴⁵⁶⁷⁸⁹¹⁰]?)/g, "<strong>$1</strong>")
    .replace(/([a-zA-Z]\s*=\s*[0-9-]+)/g, "<strong>$1</strong>")
    .replace(/(x\s*=\s*[0-9-]+)/g, "<strong>$1</strong>")
}

export default function Page() {
  const searchParams = useSearchParams()
  const questao = searchParams.get("questao")
  const materia = searchParams.get("materia")
  const dificuldade = searchParams.get("dificuldade")
  const id = searchParams.get("id")
  const [resolucao, setResolucao] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) {
      router.push(
        `/login?callbackUrl=/dashboard/assistente/resolver-questoes?questao=${questao}&materia=${materia}&dificuldade=${dificuldade}&id=${id}`,
      )
    }
  }, [session, router, questao, materia, dificuldade, id])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/openai/questao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questao: questao, materia: materia, dificuldade: dificuldade }),
        })

        if (response.ok) {
          const data = await response.json()
          setResolucao(data.message.content)
        } else {
          toast.error("Erro ao gerar resolução. Tente novamente.")
        }
      } catch (error) {
        console.error("Erro ao buscar resolução:", error)
        toast.error("Erro ao gerar resolução. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    if (questao) {
      fetchData()
    }
  }, [questao, materia, dificuldade])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Resolução da Questão</h1>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[400px]" />
          <Skeleton className="h-4 w-[400px]" />
          <Skeleton className="h-4 w-[400px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      ) : (
        <>
          {resolucao ? (
            <>
              <div
                className="prose prose-green max-w-none"
                dangerouslySetInnerHTML={{
                  __html: resolucao
                    .split("\n")
                    .map((line) => {
                      // Formatar equações matemáticas
                      if (line.includes("=") && (line.includes("x") || line.includes("²") || line.includes("³"))) {
                        return `<p>${formatMathEquation(line)}</p>`
                      }
                      return `<p>${line}</p>`
                    })
                    .join(""),
                }}
              />
              <Button
                onClick={() =>
                  router.push(
                    `/dashboard/editar-questao?questao=${questao}&materia=${materia}&dificuldade=${dificuldade}&id=${id}`,
                  )
                }
              >
                Editar Questão
              </Button>
            </>
          ) : (
            <p>Nenhuma resolução disponível.</p>
          )}
        </>
      )}
      <style jsx global>{`
  .prose strong {
    font-weight: 700 !important;
    background: none !important;
    border: none !important;
    padding: 0 !important;
    color: inherit !important;
  }
  
  .prose code {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    font-weight: 700 !important;
    color: inherit !important;
    font-family: inherit !important;
  }
  
  .prose pre {
    background: none !important;
    border: none !important;
    padding: 0 !important;
  }
`}</style>
    </div>
  )
}
