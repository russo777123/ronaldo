"use client";

import { useState, useEffect } from "react";

interface Question {
  id: string;
  tipo: "TIPO 1" | "TIPO 2" | "TIPO 3" | "TIPO 4";
  tema: string;
  enunciado: string;
  itens?: string[];
  comando?: string;
  alternativas: { [key: string]: string };
  resposta_correta: string;
  justificativa: string;
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00");
  const [realStats, setRealStats] = useState<{ accuracyRate: number; averageTime: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tema, setTema] = useState<string>("Todos");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchQuestions = async (filterMateria: string) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/questions?materia=${filterMateria}`);
      if (!resp.ok) throw new Error("Falha ao buscar questões");
      const data = await resp.json();
      setQuestions(data);
      setCurrentIdx(0);
      setRevealed(false);
      setSelectedOpt(null);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
    } catch (e: any) {
      console.error("Erro ao carregar questões:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions("Todos");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (startTime === 0) return;
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setElapsedTime(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const handleSelect = (key: string) => {
    if (revealed) return;
    setSelectedOpt(key);
  };

  const handleReveal = async () => {
    if (!selectedOpt || revealed) return;
    
    const currentQuestion = questions[currentIdx];
    const isCorrect = selectedOpt === currentQuestion.resposta_correta;
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    setRevealed(true);
    if (isCorrect) {
      setScore((prev) => prev + (10 / questions.length));
    }

    try {
      // Save response and wait for it to complete
      const saveResp = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selected: selectedOpt,
          isCorrect,
          timeSeconds: timeSpent
        })
      });

      if (!saveResp.ok) {
        console.error("Erro ao salvar resposta:", await saveResp.text());
      }

      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch real stats after saving
      const statsResp = await fetch(`/api/stats/${currentQuestion.id}`);
      if (statsResp.ok) {
        const statsData = await statsResp.json();
        setRealStats(statsData);
      } else {
        console.error("Erro ao buscar stats:", await statsResp.text());
      }
    } catch (e) {
      console.error("Erro ao processar resposta:", e);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setRevealed(false);
      setRealStats(null);
      setQuestionStartTime(Date.now());
    } else {
      alert("Simulado concluído! Nota Final: " + score.toFixed(2));
      setCurrentIdx(0);
      setScore(0);
      setSelectedOpt(null);
      setRevealed(false);
      setRealStats(null);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold tracking-widest text-sm uppercase">César Engine Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-rose-500/20 text-rose-500 mb-4 border border-rose-500/40">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <p className="text-rose-500 font-bold tracking-widest text-sm uppercase mb-2">Erro de Operação</p>
        <p className="text-slate-400 text-xs">{error}</p>
        <button onClick={() => fetchQuestions(tema)} className="mt-8 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-blue-500 transition-colors">Tentar Novamente</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b1121] flex flex-col items-center justify-center p-4">
        <div className="mb-6 opacity-20">
          <svg className="w-24 h-24 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <p className="text-slate-400 font-bold tracking-widest text-sm uppercase mb-4 text-center">Nenhuma questão encontrada para<br/><span className="text-blue-500">{tema}</span></p>
        <button onClick={() => { setTema("Todos"); fetchQuestions("Todos"); }} className="px-6 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors">Ver Todas as Matérias</button>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="min-h-screen bg-[#0b1121] text-white p-4 md:p-8 selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-200">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            <span className="font-bold text-base tracking-tight">Filtrar por Matéria:</span>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between w-full md:w-72 px-5 py-3 bg-[#1e293b]/40 border border-slate-700/50 rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#1e293b]/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                {tema === "Todos" ? "Todas as Matérias" : tema}
              </div>
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 mt-2 w-full md:w-72 bg-[#111827] border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {["Todos", "Física", "MCA", "Sensoriamento", "Inteligência"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setTema(item);
                      setDropdownOpen(false);
                      fetchQuestions(item);
                    }}
                    className="w-full px-5 py-3 text-left text-sm font-medium text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    {item === "Todos" ? "Todas as Matérias" : item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Question Card */}
        <div className="bg-[#111827] border border-slate-800/80 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          {/* Tags & Meta */}
          <div className="px-5 py-4 md:px-8 md:py-6 flex flex-wrap items-center justify-between border-b border-slate-800/50 bg-white/[0.02] gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#2563eb]/10 text-[#60a5fa] text-[9px] md:text-[10px] font-black px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-blue-500/20 uppercase tracking-wider">{q.tema}</span>
              <span className="bg-[#9333ea]/10 text-[#c084fc] text-[9px] md:text-[10px] font-black px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-purple-500/20 uppercase tracking-wider">EAOF 2026/1</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs md:text-sm bg-cyan-400/5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-cyan-400/10">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {elapsedTime}
            </div>
          </div>

          <div className="p-6 md:p-12 space-y-8 md:space-y-12">
            {/* Enunciado */}
            <div className="space-y-6 md:space-y-8">
              <p className="text-slate-200 text-lg md:text-xl font-medium leading-[1.6] tracking-tight">
                {q.enunciado}
              </p>
              
              {q.itens && (
                <div className="space-y-3 md:space-y-4 bg-[#1e293b]/20 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-700/30 backdrop-blur-sm">
                  {q.itens.map((item, i) => (
                    <p key={i} className="text-slate-400 italic text-sm md:text-base leading-relaxed pl-4 border-l-2 border-blue-500/20">{item}</p>
                  ))}
                  <p className="pt-4 md:pt-6 font-black text-blue-400 text-[10px] md:text-xs uppercase tracking-[0.2em]">{q.comando}</p>
                </div>
              )}
            </div>

            {/* Alternatives Grid */}
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(q.alternativas).map(([key, value]) => {
                let cardStyle = "bg-[#1e293b]/10 border-slate-800 hover:bg-[#1e293b]/30 hover:border-slate-700 hover:translate-x-1";
                let badgeStyle = "bg-[#1f2937] text-slate-500 border-slate-700";
                let checkIcon = null;

                if (selectedOpt === key) {
                  cardStyle = "bg-[#2563eb]/10 border-blue-500/50 ring-1 ring-blue-500/20 translate-x-1";
                  badgeStyle = "bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]";
                }

                if (revealed) {
                  if (key === q.resposta_correta) {
                    cardStyle = "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/20 translate-x-1";
                    badgeStyle = "bg-emerald-500 text-white border-emerald-400";
                    checkIcon = (
                      <div className="ml-auto w-6 h-6 flex items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-500 bg-emerald-500/10">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    );
                  } else if (selectedOpt === key) {
                    cardStyle = "bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/20 translate-x-1";
                    badgeStyle = "bg-rose-500 text-white border-rose-400";
                  }
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className={`group flex items-center text-left p-4 md:p-5 rounded-[1rem] md:rounded-[1.25rem] border-2 transition-all duration-300 ${cardStyle}`}
                  >
                    <span className={`w-9 h-9 md:w-11 md:h-11 flex-shrink-0 flex items-center justify-center rounded-full font-black text-sm md:text-base mr-4 md:mr-6 transition-all border-2 ${badgeStyle}`}>
                      {key.toUpperCase()}
                    </span>
                    <span className={`text-slate-400 text-sm md:text-base font-medium leading-relaxed group-hover:text-slate-100 transition-colors py-1 ${selectedOpt === key ? 'text-white' : ''}`}>
                      {value}
                    </span>
                    {checkIcon}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feedback Panel */}
        {revealed && (
          <div className={`bg-[#111827] border ${selectedOpt === q.resposta_correta ? 'border-emerald-500/30' : 'border-rose-500/30'} rounded-[2rem] p-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-2xl`}>
            <div className="flex items-center gap-5">
               <div className={`w-14 h-14 ${selectedOpt === q.resposta_correta ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-rose-500/20 border-rose-500/40'} rounded-2xl flex items-center justify-center border shadow-inner`}>
                 {selectedOpt === q.resposta_correta ? (
                   <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                 ) : (
                   <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                 )}
               </div>
               <div className="space-y-1">
                 <h3 className={`${selectedOpt === q.resposta_correta ? 'text-emerald-500' : 'text-rose-500'} text-3xl font-black tracking-tight uppercase`}>
                   {selectedOpt === q.resposta_correta ? 'Resposta Correta!' : 'Resposta Incorreta!'}
                 </h3>
                 <p className={`${selectedOpt === q.resposta_correta ? 'text-emerald-500/60' : 'text-rose-500/60'} text-xs font-bold uppercase tracking-widest`}>
                   {selectedOpt === q.resposta_correta ? 'Excelente desempenho, Guerreiro.' : 'Continue treinando, Guerreiro.'}
                 </p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
               <div className="bg-[#1e293b]/40 p-8 rounded-3xl border border-slate-800/50 space-y-2 backdrop-blur-sm">
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Taxa de Acerto</p>
                 <p className="text-3xl font-black text-white tracking-tighter">
                   {realStats ? `${realStats.accuracyRate}%` : '...'}
                 </p>
               </div>
               <div className="bg-[#1e293b]/40 p-8 rounded-3xl border border-slate-800/50 space-y-2 backdrop-blur-sm">
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Tempo Médio</p>
                 <p className="text-3xl font-black text-white tracking-tighter">
                   {realStats ? `${realStats.averageTime}s` : '...'}
                 </p>
               </div>
               <div className="bg-[#1e293b]/40 p-8 rounded-3xl border border-slate-800/50 space-y-2 backdrop-blur-sm">
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Seu Tempo</p>
                 <p className="text-3xl font-black text-white tracking-tighter">{Math.floor((Date.now() - questionStartTime) / 1000)}s</p>
               </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">Fundamentação César Engine</h4>
              </div>
              <p className="text-slate-400 italic text-base leading-[1.8] font-light pl-6 border-l-2 border-slate-800/60">{q.justificativa}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center py-8">
          <button onClick={() => handleNext()} className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:tracking-[0.4em]">
             Pular Questão
          </button>
          
          <button 
            onClick={revealed ? handleNext : handleReveal}
            disabled={!selectedOpt && !revealed}
            className={`group relative ${revealed ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:opacity-20 disabled:grayscale text-white font-black text-xs px-14 py-5 rounded-[1.25rem] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] transition-all active:scale-95 disabled:shadow-none hover:-translate-y-1`}
          >
            <div className="flex items-center gap-4 relative z-10 uppercase tracking-widest">
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {revealed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                )}
              </svg>
              {revealed ? "Próxima Questão" : "Confirmar Resposta"}
            </div>
            <div className={`absolute inset-0 bg-gradient-to-r ${revealed ? 'from-emerald-400/20' : 'from-blue-400/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.25rem]`}></div>
          </button>
        </div>

        <footer className="text-center pt-16 pb-12 opacity-30 border-t border-slate-800/40">
           <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">César Engine v3.0 • Sistema de Operações de Inteligência</p>
        </footer>

      </div>
    </div>
  );
}
