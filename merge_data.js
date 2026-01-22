const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'src', 'data');
const files = [
  'questoes_inteligencia.json',
  'questoes_sensoriamento_lote1.json',
  'questoes_sensoriamento_cesar.json',
  'questoes_sensoriamento_cesar_lote2.json',
  'questoes_sensoriamento_cesar_lote3.json',
  'questoes_fisica_cesar.json',
  'questoes_fisica_cesar_lote2.json',
  'questoes_fisica_cesar_lote3.json',
  'questoes_mca_cesar.json',
  'questoes_mca_cesar_lote2.json',
  'questoes_inteligencia_cesar.json' // Caso exista outro lote
];

let allQuestions = [];

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    try {
      let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Normalização para o formato esperado pelo Frontend
      data = data.map(q => {
        return {
          id: q.id || Math.random().toString(36).substr(2, 9),
          tipo: q.tipo || "TIPO 1",
          tema: q.tema || q.subject || "Geral",
          enunciado: q.enunciado,
          itens: q.itens || null,
          comando: q.comando || null,
          alternativas: q.alternativas || q.opcoes,
          resposta_correta: q.resposta_correta || q.correta,
          justificativa: q.justificativa
        };
      });

      allQuestions = allQuestions.concat(data);
      console.log(`Mesclado e Normalizado: ${file} (${data.length} questões)`);
    } catch (e) {
      console.error(`Erro ao processar ${file}:`, e.message);
    }
  }
});

// Remover duplicatas e ordenar
const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.id + q.enunciado.substring(0,20), q])).values());

fs.writeFileSync(path.join(dataDir, 'questoes.json'), JSON.stringify(uniqueQuestions, null, 2));
console.log(`\nSUCESSO: Banco consolidado com ${uniqueQuestions.length} questões totais.`);
