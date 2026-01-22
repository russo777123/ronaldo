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

    return NextResponse.json(parsedQuestions)
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
