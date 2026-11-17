import React from 'react';
import { Check, CheckSquare, MessageSquare, Mic, Sparkles } from 'lucide-react';

interface FeaturesSectionProps {
  onOpenRegister: () => void;
}

const CAPABILITY_CARDS = [
  {
    icon: Mic,
    title: 'Captura Direta ou Upload',
    description: 'Transforme qualquer gravação ou texto num relatório estruturado.',
    bullets: [
      'Gravação direta no browser',
      'Upload .mp3, .wav, .mp4 ou texto',
      'Identificação clara de oradores',
    ],
  },
  {
    icon: CheckSquare,
    title: 'Mapa de Tarefas Validado',
    description: 'Mantenha o controlo total antes de distribuir responsabilidades.',
    bullets: [
      'Edição rápida de prazos e responsáveis',
      'Aprovação individual ou em lote',
      'Exportação direta para Google Tasks',
    ],
  },
  {
    icon: MessageSquare,
    title: 'Assistente da Reunião',
    description: 'Esclareça dúvidas sobre decisões e prazos em linguagem natural.',
    bullets: [
      'Respostas baseadas apenas na reunião',
      'Perguntas rápidas sugeridas',
      'Histórico contextual por reunião',
    ],
  },
  {
    icon: Sparkles,
    title: 'Resumo e Atas em 1 Clique',
    description: 'Elimine notas manuais com síntese executiva imediata.',
    bullets: [
      'Decisões e próximos passos isolados',
      'Bloqueios e riscos destacados',
      'Criação direta de documento no Google Docs',
    ],
  },
] as const;

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onOpenRegister }) => {
  return (
    <section id="features" className="py-16 bg-slate-950/60 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-semibold text-cyan-400 mb-2">
              Fluxo SmartMeeting
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Tudo o que precisa após cada reunião.
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenRegister}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors self-start md:self-auto"
          >
            Criar Conta Gratuita
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CAPABILITY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">{card.title}</h3>
                </div>

                <p className="text-xs text-slate-400 mb-4">{card.description}</p>

                <ul className="space-y-2 text-xs text-slate-300">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
