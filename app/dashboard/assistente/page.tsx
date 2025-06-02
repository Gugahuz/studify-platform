import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Upload, History } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"

export default function AssistentePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assistente de Estudos</h1>
        <p className="text-gray-600">Tire suas dúvidas e receba explicações personalizadas</p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Pergunte ao Studo</CardTitle>
              <CardDescription>
                Faça perguntas ao Studo sobre qualquer matéria e receba respostas didáticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Upload de Questão</CardTitle>
              <CardDescription>Envie uma foto da questão para obter a resolução passo a passo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Arraste e solte sua imagem aqui</h3>
                <p className="text-gray-500 mb-4">ou</p>
                <Button>Selecionar arquivo</Button>
                <p className="text-xs text-gray-500 mt-4">Formatos suportados: JPG, PNG, PDF (máx. 10MB)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>Histórico de Perguntas</CardTitle>
              <CardDescription>Acesse suas perguntas e respostas anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Como resolver equações do segundo grau?</h4>
                      <span className="text-xs text-gray-500">
                        Há {i} dia{i > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      Para resolver uma equação do segundo grau ax² + bx + c = 0, você pode usar a fórmula de
                      Bhaskara...
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
