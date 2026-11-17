import React from 'react';
import { ArrowRight, CheckCircle2, FileText, LogIn, Mic, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenRegister,
  onOpenLogin,
}) => {
  return (
    <section id="hero" className="relative pt-16 pb-16 sm:pt-24 sm:pb-20 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[320px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Gratuito · Acesso livre para equipas ágeis</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
            Reuniões em decisões claras.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Tarefas aprovadas antes do envio.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Carregue áudio, vídeo ou texto da reunião. A IA gera o resumo, extrai tarefas para sua revisão e responde a qualquer dúvida no chat.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onOpenRegister}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 rounded-xl transition-all shadow-lg shadow-cyan-500/15"
            >
              <span>Criar Conta Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>Iniciar Sessão</span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <Mic className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">Áudio, Vídeo ou Texto</h2>
            <p className="mt-1 text-xs text-slate-400">
              Grave no browser ou carregue ficheiros e transcrições em segundos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">Aprovação do Gestor</h2>
            <p className="mt-1 text-xs text-slate-400">
              Edite prazos e responsáveis antes de partilhar com a equipa.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-white">Google Tasks & Docs</h2>
            <p className="mt-1 text-xs text-slate-400">
              Exporte tarefas aprovadas e atas organizadas com 1 clique.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
