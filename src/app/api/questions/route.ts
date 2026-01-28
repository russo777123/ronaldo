import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const materia = searchParams.get('materia')

  try {
    const questions = await prisma.question.findMany({
      where: (materia && materia !== 'Todos' ? { materia } : {}) as any,
      include: {
        _count: {
          select: { responses: true }
        }
      }
    })

    // Parse JSON strings back to arrays/objects with safety
    const parsedQuestions = questions.map(q => {
      try {
        return {
          ...q,
          itens: q.itens ? JSON.parse(q.itens) : null,
          alternativas: q.alternativas ? JSON.parse(q.alternativas) : {}
        }
      } catch (e) {
        console.error(`Error parsing question ${q.id}:`, e)
        return null
      }
    }).filter(q => q !== null)

    // Randomize questions using Fisher-Yates shuffle
    const shuffled = [...parsedQuestions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return NextResponse.json(shuffled)
  } catch (error: any) {
    console.error('API Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json({ 
      error: 'Falha ao buscar questões', 
      details: error.message 
    }, { status: 500 })
  }
}
