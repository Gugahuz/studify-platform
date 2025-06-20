"use client"

import type React from "react"

interface SimpleMockExamResultsProps {
  attempt: any
  responses: any[]
}

const SimpleMockExamResults: React.FC<SimpleMockExamResultsProps> = ({ attempt, responses }) => {
  return (
    <div>
      <h2>Resultados do Simulado</h2>
      {attempt ? (
        <>
          <p>Pontuação: {attempt.percentage}%</p>
          <p>
            Questões corretas: {attempt.correct_answers} de {attempt.total_questions}
          </p>
          <p>Tempo gasto: {attempt.time_spent_seconds} segundos</p>
        </>
      ) : (
        <p>Carregando resultados...</p>
      )}
    </div>
  )
}

export { SimpleMockExamResults }
export default SimpleMockExamResults
