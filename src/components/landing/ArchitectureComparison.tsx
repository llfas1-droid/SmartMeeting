import React from 'react';
import { ShieldCheck, Check, X, Lock, Server, Cpu, FileCheck } from 'lucide-react';

export const ArchitectureComparison: React.FC = () => {
  return (
    <section id="governance" className="py-20 bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs font-semibold text-cyan-400 mb-2">
            Análise Comparativa
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
            Por que as ferramentas convencionais falham com equipas ágeis.
          </h2>
          <p className="mt-4 text-base text-slate-400">
            A maioria dos softwares pós-reunião foram criados para gerar volume, não governança. Veja como o SmartMeeting protege a sua operação.
          </p>
        </div>

        {/* Comparison Matrix */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 mb-16 shadow-xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80">
                <th className="py-4 px-6 font-semibold text-slate-300">Critério Operacional</th>
                <th className="py-4 px-6 font-semibold text-rose-400">Bots de Reunião Tradicionais</th>
                <th className="py-4 px-6 font-semibold text-cyan-400 bg-cyan-950/20 border-l border-r border-slate-800">
                  SmartMeeting (Micro-SaaS)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="py-4 px-6 font-medium text-white">Presença na Chamada</td>
                <td className="py-4 px-6 text-slate-400">
                  <div className="flex items-center gap-2 text-rose-400">
                    <X className="w-4 h-4 shrink-0" />
                    <span>Bot estranho entra na sala e inibe clientes</span>
                  </div>
                </td>
                <td className="py-4 px-6 bg-cyan-950/10 border-l border-r border-slate-800 text-white font-medium">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Invisível: Gravação direta no browser ou upload a frio</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-medium text-white">Distribuição de Tarefas</td>
                <td className="py-4 px-6 text-slate-400">
                  <div className="flex items-center gap-2 text-rose-400">
                    <X className="w-4 h-4 shrink-0" />
                    <span>Disparo cego de tickets com alucinações de IA</span>
                  </div>
                </td>
                <td className="py-4 px-6 bg-cyan-950/10 border-l border-r border-slate-800 text-white font-medium">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Aprovação mandatória do Gestor (Manager-in-the-Loop)</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-medium text-white">Formatos Aceites</td>
                <td className="py-4 px-6 text-slate-400">Apenas reuniões agendadas no calendário</td>
                <td className="py-4 px-6 bg-cyan-950/10 border-l border-r border-slate-800 text-white font-medium">
                  .mp3, .wav, .mp4, gravações locais ou de ecrã
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-medium text-white">Comprovação de Contexto</td>
                <td className="py-4 px-6 text-slate-400">Resumo genérico sem origem clara</td>
                <td className="py-4 px-6 bg-cyan-950/10 border-l border-r border-slate-800 text-white font-medium">
                  Snippet do áudio e orador anexado a cada tarefa
                </td>
              </tr>

              <tr>
                <td className="py-4 px-6 font-medium text-white">Privacidade e Treino de IA</td>
                <td className="py-4 px-6 text-slate-400">Muitas vezes dados são retidos para treino público</td>
                <td className="py-4 px-6 bg-cyan-950/10 border-l border-r border-slate-800 text-white font-medium">
                  Zero retenção corporativa · Encriptação AES-256
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Security & Compliance (Tarefa 1: Privacidade Crítica) */}
        <div id="security" className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 sm:p-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
            <Lock className="w-4 h-4" />
            <span>Infraestrutura de Segurança & Governança</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Dados corporativos tratados com padrão bancário.
          </h3>
          <p className="text-sm text-slate-400 max-w-2xl mb-8 leading-relaxed">
            Reuniões de estratégia de produto e roadmap contêm a propriedade intelectual mais valiosa da sua empresa. Por isso construímos o SmartMeeting com isolamento criptográfico ponta a ponta.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm mb-1.5">Encriptação AES-256 & TLS 1.3</h4>
              <p className="text-slate-400 leading-relaxed">
                Todos os ficheiros multimédia e transcrições são encriptados em repouso com chaves geridas por tenant e trânsito protegido.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <FileCheck className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm mb-1.5">Conformidade RGPD & LGPD</h4>
              <p className="text-slate-400 leading-relaxed">
                Direito ao esquecimento com exclusão imediata de áudio e dados após processamento conforme a sua política interna.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-white text-sm mb-1.5">Zero Retenção para Treino</h4>
              <p className="text-slate-400 leading-relaxed">
                As suas conversas confidenciais jamais são utilizadas para treinar modelos públicos de inteligência artificial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
