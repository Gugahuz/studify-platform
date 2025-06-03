"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, Users, Target, Heart } from "lucide-react"
import Link from "next/link"

export default function SobrePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sobre o Studify</h1>
          <p className="text-gray-600">Conheça nossa missão, equipe e como entrar em contato</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Sobre o Projeto */}
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Nossa Missão
            </CardTitle>
            <CardDescription>O que nos move todos os dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              O Studify nasceu com o objetivo de democratizar o acesso à educação de qualidade, oferecendo uma
              plataforma completa e intuitiva para estudantes de todos os níveis. Acreditamos que a tecnologia pode
              transformar a forma como aprendemos e nos desenvolvemos.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Nossa missão é criar um ambiente de aprendizado personalizado, onde cada estudante pode alcançar seu
              máximo potencial através de ferramentas inovadoras, conteúdo de qualidade e uma comunidade engajada.
            </p>
          </CardContent>
        </Card>

        {/* Equipe */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Nossa Equipe
            </CardTitle>
            <CardDescription>As pessoas por trás do Studify</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Somos uma equipe apaixonada por educação e tecnologia, formada por educadores, desenvolvedores e designers
              que trabalham juntos para criar a melhor experiência de aprendizado possível.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Equipe de Desenvolvimento</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Especialistas em tecnologia trabalhando para criar uma plataforma robusta e inovadora.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">Equipe Pedagógica</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Educadores experientes que garantem a qualidade e eficácia do conteúdo oferecido.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card className="border-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-600" />
              Nossos Valores
            </CardTitle>
            <CardDescription>Os princípios que nos guiam</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Excelência</h4>
                <p className="text-sm text-gray-600">Buscamos sempre a mais alta qualidade em tudo que fazemos.</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Colaboração</h4>
                <p className="text-sm text-gray-600">Acreditamos no poder da comunidade e do aprendizado conjunto.</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Paixão</h4>
                <p className="text-sm text-gray-600">
                  Somos apaixonados por educação e pelo impacto que podemos gerar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-600" />
              Entre em Contato
            </CardTitle>
            <CardDescription>Estamos aqui para ajudar você</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Tem alguma dúvida, sugestão ou precisa de ajuda? Nossa equipe está sempre pronta para atender você. Entre
              em contato conosco através dos canais abaixo:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">E-mail</h4>
                  <p className="text-sm text-gray-600">contato@studify.digital</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">Suporte</h4>
                  <p className="text-sm text-gray-600">suporte@studify.digital</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Horário de Atendimento</h4>
              <p className="text-sm text-blue-700">
                Segunda a Sexta: 8h às 18h
                <br />
                Sábado: 9h às 14h
                <br />
                Domingo: Fechado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Versão */}
        <Card className="border-gray-100">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>Studify Platform v1.0.0</p>
              <p className="mt-1">© 2024 Studify. Todos os direitos reservados.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
