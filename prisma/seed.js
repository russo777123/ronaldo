const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const fs = require('fs');
const path = require('path');

const adapter = new PrismaBetterSqlite3({ url: 'file:prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const dataDir = path.join(__dirname, '../src/data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

  console.log(`Limpando banco de dados...`);
  await prisma.response.deleteMany({});
  await prisma.question.deleteMany({});

  console.log(`Encontrados ${files.length} arquivos de dados.`);

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const questionsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Identificar a matéria pelo nome do arquivo
    let materia = "Geral";
    const lowerFile = file.toLowerCase();
    if (lowerFile.includes('fisica')) materia = "Física";
    else if (lowerFile.includes('mca')) materia = "MCA";
    else if (lowerFile.includes('sensoriamento')) materia = "Sensoriamento";
    else if (lowerFile.includes('inteligencia')) materia = "Inteligência";

    console.log(`Importando ${questionsData.length} questões de [${file}] como [${materia}]...`);

    for (const q of questionsData) {
      // Mapeamento robusto de campos para diferentes versões do JSON
      const alternativas = q.alternativas || q.opcoes;
      const respostaCorreta = q.resposta_correta || q.correta;
      const tema = q.tema || q.subject || "Geral";

      if (!alternativas || !respostaCorreta) {
        console.warn(`Questão skipada em ${file}: ID ${q.id} (Faltam alternativas ou resposta correta)`);
        continue;
      }

      await prisma.question.create({
        data: {
          originalId: q.id ? q.id.toString() : null,
          tipo: q.tipo || "TIPO 1",
          tema: tema,
          materia: materia,
          enunciado: q.enunciado,
          itens: q.itens ? JSON.stringify(q.itens) : null,
          comando: q.comando || null,
          alternativas: JSON.stringify(alternativas),
          resposta_correta: respostaCorreta,
          justificativa: q.justificativa || ""
        }
      });
    }
  }

  console.log('Migração concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
