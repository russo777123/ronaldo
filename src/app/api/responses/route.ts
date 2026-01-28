import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { questionId, selected, isCorrect, timeSeconds } = body

    console.log('📝 Salvando resposta:', { questionId, selected, isCorrect, timeSeconds })

    const response = await prisma.response.create({
      data: {
        questionId,
        selected,
        isCorrect,
        timeSeconds: timeSeconds || 0
      } as any
    })

    console.log('✅ Resposta salva com sucesso:', response)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('❌ API Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta // Prisma specific
    })
    return NextResponse.json({ 
      error: 'Falha ao salvar resposta', 
      details: error.message 
    }, { status: 500 })
  }
}
