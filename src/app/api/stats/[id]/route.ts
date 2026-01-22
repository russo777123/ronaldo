import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const responses = await prisma.response.findMany({
      where: { questionId: id }
    }) as any[]

    if (responses.length === 0) {
      return NextResponse.json({
        accuracyRate: 0,
        averageTime: 0,
        totalResponses: 0
      })
    }

    const correctOnes = responses.filter(r => r.isCorrect).length
    const accuracyRate = Math.round((correctOnes / responses.length) * 100)
    
    const totalTime = responses.reduce((acc, curr) => acc + curr.timeSeconds, 0)
    const averageTime = Math.round(totalTime / responses.length)

    return NextResponse.json({
      accuracyRate,
      averageTime,
      totalResponses: responses.length
    })
  } catch (error) {
    console.error('Stats API Error:', error)
    return NextResponse.json({ error: 'Falha ao buscar estatísticas' }, { status: 500 })
  }
}
