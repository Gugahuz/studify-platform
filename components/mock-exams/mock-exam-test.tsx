"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Play, RefreshCw, Database, FileText } from "lucide-react"

export function MockExamTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTemplateTest = async () => {
    try {
      setLoading(true)
      console.log("🧪 Running template access test...")

      const response = await fetch("/api/mock-exams/test-templates")
      const data = await response.json()

      console.log("Test result:", data)
      setTestResult(data)
    } catch (error) {
      console.error("Test failed:", error)
      setTestResult({
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const testOriginalAPI = async () => {
    try {
      setLoading(true)
      console.log("🧪 Testing original templates API...")

      const response = await fetch("/api/mock-exams/templates?featured=true")
      const data = await response.json()

      console.log("Original API result:", data)
      setTestResult({
        success: true,
        originalAPI: data,
        message: "Original API test completed",
      })
    } catch (error) {
      console.error("Original API test failed:", error)
      setTestResult({
        success: false,
        error: "Original API test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Teste de Acesso aos Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runTemplateTest} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Teste Completo
              </>
            )}
          </Button>

          <Button onClick={testOriginalAPI} disabled={loading} variant="outline" className="flex-1">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                API Original
              </>
            )}
          </Button>
        </div>

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                Status: {testResult.success ? "Sucesso" : "Erro"}
                {testResult.step && ` (Etapa: ${testResult.step})`}
              </span>
            </div>

            {testResult.success && testResult.data && (
              <div className="space-y-4">
                {/* Counts */}
                <div>
                  <h4 className="font-medium mb-2">Contadores:</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">Total: {testResult.data.counts.total}</Badge>
                    <Badge variant="default">Ativos: {testResult.data.counts.active}</Badge>
                    <Badge variant="secondary">Destacados: {testResult.data.counts.featured}</Badge>
                  </div>
                </div>

                {/* Sample Template */}
                {testResult.data.sampleTemplate && (
                  <div>
                    <h4 className="font-medium mb-2">Template de Exemplo:</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div>
                        <strong>Título:</strong> {testResult.data.sampleTemplate.title}
                      </div>
                      <div>
                        <strong>Categoria:</strong> {testResult.data.sampleTemplate.category}
                      </div>
                      <div>
                        <strong>Dificuldade:</strong> {testResult.data.sampleTemplate.difficulty_level}/5
                      </div>
                      <div>
                        <strong>Questões:</strong> {testResult.data.sampleTemplate.total_questions}
                      </div>
                      <div>
                        <strong>Tempo:</strong> {testResult.data.sampleTemplate.time_limit_minutes} min
                      </div>
                    </div>
                  </div>
                )}

                {/* Templates List */}
                {testResult.data.templates.featured.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Templates Destacados:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {testResult.data.templates.featured.map((template: any) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded"
                        >
                          <span>{template.title}</span>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {template.total_questions}q
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions Check */}
                {testResult.data.questionsCheck && (
                  <div>
                    <h4 className="font-medium mb-2">Verificação de Questões:</h4>
                    <div className="text-sm text-green-600">
                      ✅ Tabela de questões acessível ({testResult.data.questionsCheck.length} registros encontrados)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Original API Test Results */}
            {testResult.originalAPI && (
              <div>
                <h4 className="font-medium mb-2">Resultado da API Original:</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div>
                    <strong>Sucesso:</strong> {testResult.originalAPI.success ? "✅" : "❌"}
                  </div>
                  {testResult.originalAPI.templates && (
                    <div>
                      <strong>Templates:</strong> {testResult.originalAPI.templates.length}
                    </div>
                  )}
                  {testResult.originalAPI.error && (
                    <div className="text-red-600">
                      <strong>Erro:</strong> {testResult.originalAPI.error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Details */}
            {!testResult.success && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                <div>
                  <strong>Erro:</strong> {testResult.error}
                </div>
                {testResult.details && (
                  <div>
                    <strong>Detalhes:</strong> {testResult.details}
                  </div>
                )}
                {testResult.suggestion && (
                  <div className="mt-2 text-blue-600">
                    <strong>Sugestão:</strong> {testResult.suggestion}
                  </div>
                )}
              </div>
            )}

            {testResult.message && (
              <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{testResult.message}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
