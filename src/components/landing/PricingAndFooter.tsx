import React from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface PricingAndFooterProps {
  onSelectPlan: (planName: string) => void;
}

export const PricingAndFooter: React.FC<PricingAndFooterProps> = ({
  onSelectPlan,
}) => {
  return (
    <section id="pricing" className="py-20 bg-slate-950/80 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-semibold text-cyan-400 mb-2">
            Planos Transparentes
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Preços desenhados para equipas de 3 a 15 membros.
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Comece com teste gratuito de 14 dias. Sem cartão de crédito obrigatório.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-stretch">
          {/* Plan 1 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="text-sm font-semibold text-white">Squad Starter</div>
              <p className="text-xs text-slate-400 mt-1">Para equipas pequenas até 5 membros</p>
              
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white font-mono tabular-nums">€29</span>
                <span className="text-xs text-slate-400">/ mês</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Até 15 horas de reuniões / mês</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Upload .mp3, .wav e gravação de microfone</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Resumos executivos com IA</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Mapa de Tarefas com aprovação do Gestor</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('Squad Starter')}
              className="mt-8 w-full py-2.5 px-4 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Começar Teste Grátis
            </button>
          </div>

          {/* Plan 2: Flagship Pro Manager */}
          <div className="bg-slate-900/90 border-2 border-cyan-500/80 rounded-2xl p-7 flex flex-col justify-between relative shadow-xl shadow-cyan-950/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-cyan-400 to-indigo-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
              Mais Escolhido por PMs
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Pro Manager</div>
              <p className="text-xs text-slate-400 mt-1">Para squads ágeis de 6 a 15 membros</p>
              
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white font-mono tabular-nums">€69</span>
                <span className="text-xs text-slate-400">/ mês</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Gravações ilimitadas (áudio + vídeo .mp4)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Gravação de áudio do separador (Meet/Zoom)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Integração e webhook com Jira, Linear & Slack</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Chatbot interativo com histórico de reuniões</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Diarização avançada de até 15 oradores</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('Pro Manager')}
              className="mt-8 w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 rounded-lg transition-all shadow-md shadow-cyan-500/20"
            >
              Ativar 14 Dias de Teste Grátis
            </button>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="text-sm font-semibold text-white">Governança Enterprise</div>
              <p className="text-xs text-slate-400 mt-1">Múltiplos squads e conformidade estrita</p>
              
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white font-mono tabular-nums">€149</span>
                <span className="text-xs text-slate-400">/ mês</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Tudo do plano Pro sem limites</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>SSO Corporativo (SAML / Okta / Azure AD)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Acordo de Tratamento de Dados (DPA / RGPD)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Retenção personalizada com exclusão automática</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPlan('Governança Enterprise')}
              className="mt-8 w-full py-2.5 px-4 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Falar com Especialista
            </button>
          </div>
        </div>

        {/* Quiet Clean Footer */}
        <footer className="pt-10 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">SmartMeeting</span>
            <span>· Governança de reuniões sem bots intrusivos</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-slate-300 transition-colors">Funcionalidades</a>
            <a href="#security" className="hover:text-slate-300 transition-colors">Segurança</a>
            <a href="#governance" className="hover:text-slate-300 transition-colors">Governança</a>
            <span className="text-slate-700">|</span>
            <span>© 2026 SmartMeeting AI Inc. Todos os direitos reservados.</span>
          </div>
        </footer>
      </div>
    </section>
  );
};
