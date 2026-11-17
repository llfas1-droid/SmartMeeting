import React from 'react';
import { 
  BotOff, 
  ShieldCheck, 
  CheckCheck, 
  MessageSquareCode, 
  FileCheck2, 
  SlidersHorizontal,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface FeaturesSectionProps {
  onOpenRecorder: () => void;
  onExploreGovernance: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  onOpenRecorder,
  onExploreGovernance,
}) => {
  return (
    <section id="features" className="py-20 bg-slate-950/60 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-semibold text-cyan-400 mb-2">
            Arquitetura Operacional
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
            Construído para equipas ágeis que valorizam foco e governança.
          </h2>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            A maioria das ferramentas de IA gera ruído ao inundar o Jira e Slack com tarefas alucinadas. O SmartMeeting garante controlo total antes de qualquer disparo.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Manager-in-the-Loop (Flagship Feature - Col span 7) */}
          <div className="md:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-3">
                <span>01. Governança Operacional</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Aprovação de Tarefas "Manager-in-the-Loop"
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                O maior diferencial do fluxo: a IA extrai automaticamente os acordos da reunião, mas a equipa <strong className="text-white">nunca é notificada diretamente</strong>. Existe um portão de controlo obrigatório para validar responsáveis, ajustar prazos ou descartar sugestões antes de sincronizar com Google Tasks, Jira ou Slack.
              </p>

              {/* Interactive preview snippet */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">Portão de Validação</span>
                  <span className="text-cyan-400 font-mono">1 Clique para Sincronizar</span>
                </div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30">
                  <div>
                    <div className="text-white font-medium">Refatorar adapter do checkout para Stripe</div>
                    <div className="text-[11px] text-slate-400">Bernardo Costa · Entrega 27/10 · 8h</div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 rounded">
                    Aprovado
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Zero notificações acidentais no seu squad.</span>
              <button
                onClick={onExploreGovernance}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Experimentar Fluxo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Gravação Direta & Upload Multimédia (Col span 5) */}
          <div className="md:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-3">
                <span>02. Captura Flexível</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Gravação Direta ou Upload
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Grave o áudio diretamente pelo microfone ou separador do browser, ou faça upload do ficheiro .mp3, .wav ou .mp4 quando a reunião terminar.
              </p>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="font-bold">• Gravação no Browser:</span>
                  <span className="text-slate-300">Microfone ou áudio de separador em tempo real.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 pt-1">
                  <span className="font-bold">• Upload Drag & Drop:</span>
                  <span className="text-slate-200">Suporte nativo a .mp3, .wav e .mp4 até 500 MB.</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Suporte a reuniões presenciais e remotas.</span>
              <button
                onClick={onOpenRecorder}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Gravar Agora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Fim das Anotações Manuais (Col span 6) */}
          <div className="md:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-3">
                <span>03. Síntese Automatizada</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Fim das Anotações Manuais
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Pare de perder o fio condutor da reunião tentando digitar minutas e atas. O nosso motor neural identifica oradores com precisão (diarização), separa tópicos principais, sintetiza decisões e isola bloqueios operacionais em segundos.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-white mb-1">Diarização Precisa</div>
                  <div className="text-slate-400 text-[11px]">Sabe exatamente quem prometeu cada entrega.</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-white mb-1">Decisões Destacadas</div>
                  <div className="text-slate-400 text-[11px]">Resumo executivo em bullet points acionáveis.</div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
              Economize horas de transcrição manual a cada sprint review.
            </div>
          </div>

          {/* Card 4: Chatbot Interativo de Histórico (Col span 6) */}
          <div className="md:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-3">
                <span>04. Memória Viva da Equipa</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Chatbot Interativo de Reuniões
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Dúvidas sobre o que foi acordado há 3 semanas? O nosso chatbot com Retrieval-Augmented Generation pesquisa o histórico completo das reuniões da sua squad e responde com citações literais dos participantes.
              </p>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5 font-mono">
                <div className="text-cyan-400">Q: "Qual foi a data de entrega combinada para o gateway?"</div>
                <div className="text-slate-300">A: "O Bernardo indicou terça-feira, 27/10, antes do sprint review."</div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
              Citações com timestamp direto no áudio original.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
