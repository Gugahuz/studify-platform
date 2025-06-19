"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Database, RefreshCw, AlertTriangle, Table } from "lucide-react"

export function MockExamDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [rawResponse, setRawResponse] = useState<string>("")

  const runDebugCheck = async () => {
    try {
      setLoading(true)
      setRawResponse("")

      console.log("🔍 Starting debug check...")

      const response = await fetch("/api/mock-exams/debug")

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Get the raw response text first
      const responseText = await response.text()
      setRawResponse(responseText)

      console.log("Raw response:", responseText.substring(0, 200) + "...")

      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(responseText)
        console.log("Parsed JSON successfully:", data)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        data = {
          success: false,
          error: "Invalid JSON response",
          details: `Response was: ${responseText.substring(0, 100)}...`,
          parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
        }
      }

      setDebugInfo(data)
    } catch (error) {
      console.error("Debug check failed:", error)
      setDebugInfo({
        success: false,
        error: "Network or fetch error",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
      case "connected_alt":
      case "client_created":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "connection_failed":
      case "basic_connection_failed":
      case "import_failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
      case "connected_alt":
        return "default"
      case "client_created":
        return "secondary"
      case "basic_connection_failed":
        return "outline"
      case "connection_failed":
      case "import_failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getTableStatusIcon = (exists: boolean) => {
    return exists ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sistema de Simulados - Debug Avançado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDebugCheck} disabled={loading} className="w-full">
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            "Executar Verificação Completa"
          )}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {debugInfo.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">Status Geral: {debugInfo.success ? "OK" : "Erro"}</span>
            </div>

            {debugInfo.success && debugInfo.debug && (
              <div className="space-y-4">
                {/* Basic Environment Check */}
                <div>
                  <h4 className="font-medium mb-2">Ambiente:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      Ambiente: <Badge variant="outline">{debugInfo.debug.basic.environment}</Badge>
                    </div>
                    <div>
                      Timestamp:{" "}
                      <span className="text-gray-600">
                        {new Date(debugInfo.debug.basic.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      Supabase URL:{" "}
                      <Badge variant={debugInfo.debug.basic.hasSupabaseUrl ? "default" : "destructive"}>
                        {debugInfo.debug.basic.hasSupabaseUrl ? "✓" : "✗"}
                      </Badge>
                    </div>
                    <div>
                      Supabase Key:{" "}
                      <Badge variant={debugInfo.debug.basic.hasSupabaseKey ? "default" : "destructive"}>
                        {debugInfo.debug.basic.hasSupabaseKey ? "✓" : "✗"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Supabase Status */}
                <div>
                  <h4 className="font-medium mb-2">Status do Supabase:</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(debugInfo.debug.supabase.status)}
                    <Badge variant={getStatusColor(debugInfo.debug.supabase.status)}>
                      {debugInfo.debug.supabase.status}
                    </Badge>
                  </div>

                  {debugInfo.debug.supabase.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-2">
                      <strong>Erro:</strong> {debugInfo.debug.supabase.error}
                    </div>
                  )}

                  {debugInfo.debug.supabase.connectionTest && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded mb-2">
                      <strong>Conexão OK:</strong> Método {debugInfo.debug.supabase.connectionTest.method}
                      {debugInfo.debug.supabase.connectionTest.count !== undefined && (
                        <span> - {debugInfo.debug.supabase.connectionTest.count} registros</span>
                      )}
                    </div>
                  )}

                  {/* Tables Check */}
                  {debugInfo.debug.supabase.tablesCheck && (
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        Tabelas do Sistema de Simulados:
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(debugInfo.debug.supabase.tablesCheck).map(([tableName, exists]) => (
                          <div key={tableName} className="flex items-center gap-2">
                            {getTableStatusIcon(exists as boolean)}
                            <span className={exists ? "text-green-700" : "text-red-700"}>
                              {tableName.replace("mock_exam_", "").replace("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action based on table status */}
                      {Object.values(debugInfo.debug.supabase.tablesCheck).some((exists) => !exists) && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm text-yellow-800">
                            <strong>⚠️ Algumas tabelas não existem!</strong>
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Execute os scripts SQL 014 e 015 no Supabase para criar as tabelas necessárias.
                          </p>
                        </div>
                      )}

                      {Object.values(debugInfo.debug.supabase.tablesCheck).every((exists) => exists) && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-800">
                            <strong>✅ Todas as tabelas existem!</strong>
                          </p>
                          <p className="text-xs text-green-700 mt-1">O sistema de simulados está pronto para uso.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!debugInfo.success && (
              <div className="space-y-3">
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  <div>
                    <strong>Erro:</strong> {debugInfo.error}
                  </div>
                  {debugInfo.details && (
                    <div>
                      <strong>Detalhes:</strong> {debugInfo.details}
                    </div>
                  )}
                  {debugInfo.parseError && (
                    <div>
                      <strong>Erro de Parse:</strong> {debugInfo.parseError}
                    </div>
                  )}
                </div>

                {debugInfo.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Stack Trace</summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">{debugInfo.stack.join("\n")}</pre>
                  </details>
                )}
              </div>
            )}

            {rawResponse && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">Resposta Raw do Servidor</summary>
                <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto max-h-40">{rawResponse}</pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
