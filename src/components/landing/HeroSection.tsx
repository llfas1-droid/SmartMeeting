import React from 'react';
import { Mic, Upload, ShieldCheck, CheckCircle2, ArrowRight, Play, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onStartRecording: () => void;
  onExploreDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartRecording,
  onExploreDemo,
}) => {
  return (
    <section id="hero" className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Anti-Slop Clean Editorial Kicker (Zero pill discipline) */}
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-4">
          <span>Sem Bots Intrusivos</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Aprovação Manager-in-the-Loop</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Privacidade Corporativa</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] text-balance">
          Elimine o fardo administrativo pós-reunião.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
            Com controlo e sem bots constrangedores.
          </span>
        </h1>

        {/* Value Proposition Description */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Grave reuniões diretamente no browser ou faça upload de áudio e vídeo (.mp3, .wav, .mp4). 
          A nossa IA gera resumos executivos e cria um <strong className="text-white font-semibold">Mapa de Distribuição de Tarefas</strong> que requer obrigatoriamente a sua aprovação antes de qualquer notificação à equipa.
        </p>

        {/* CTAs Block */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md">
          <button
            onClick={onStartRecording}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 rounded-xl transition-all shadow-lg shadow-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 whitespace-nowrap"
          >
            <Mic className="w-4 h-4 stroke-[2.5]" />
            <span>Gravar Reunião Agora</span>
          </button>

          <button
            onClick={onExploreDemo}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current text-cyan-400" />
            <span>Ver Demo de Tarefas</span>
          </button>
        </div>

        {/* Proof of impact strip (Quantitative Rigor) */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-400">
          <div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">5.4h</div>
            <div className="mt-1 text-slate-400">Poupadas semanalmente por cada Scrum Master</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">0 Bots</div>
            <div className="mt-1 text-slate-400">A pedir autorização para entrar em chamadas de clientes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">100%</div>
            <div className="mt-1 text-slate-400">Tarefas revistas antes do disparo para Jira ou Slack</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-400 font-mono tabular-nums">AES-256</div>
            <div className="mt-1 text-slate-400">Encriptação em repouso e isolamento de tenant</div>
          </div>
        </div>

        {/* Hero Visual Preview Mockup */}
        <div className="mt-12 relative rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] text-slate-400">smartmeeting.app/sprint-44/governance-review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Manager Gate Active
              </span>
            </div>
          </div>

          <div className="relative group">
            <img
              src="/src/assets/images/smartmeeting_hero_preview_1792844432779.jpg"
              alt="SmartMeeting painel de inteligência de reunião e aprovação de tarefas"
              className="w-full h-auto object-cover max-h-[580px]"
              referrerPolicy="no-referrer"
            />
            {/* Soft highlight overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};
