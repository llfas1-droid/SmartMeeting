import React from 'react';
import { Check, X } from 'lucide-react';

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
            Do áudio ao plano de ação aprovado em minutos.
          </h2>
          <p className="mt-4 text-base text-slate-400">
            Veja como o SmartMeeting simplifica o acompanhamento pós-reunião com validação antes da distribuição de tarefas.
          </p>
        </div>

        {/* Comparison Matrix */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80">
                <th className="py-4 px-6 font-semibold text-slate-300">Critério Operacional</th>
                <th className="py-4 px-6 font-semibold text-rose-400">Processo Manual / Genérico</th>
                <th className="py-4 px-6 font-semibold text-cyan-400 bg-cyan-950/20 border-l border-r border-slate-800">
                  SmartMeeting
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="py-4 px-6 font-medium text-white">Distribuição de Tarefas</td>
                <td className="py-4 px-6 text-slate-400">
                  <div className="flex items-center gap-2 text-rose-400">
                    <X className="w-4 h-4 shrink-0" />
                    <span>Anotações dispersas ou disparo automático sem revisão</span>
                  </div>
                </td>
                <td className="py-4 px-6 bg-cyan-950/10 border-l border-r border-slate-800 text-white font-medium">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Aprovação obrigatória antes do envio à equipa</span>
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
                <td className="py-4 px-6 font-medium text-white">Exportação Google Workspace</td>
                <td className="py-4 px-6 text-slate-400">Cópia manual de atas e prazos</td>
                <td className="py-4 px-6 bg-cyan-950/10 border-l border-r border-slate-800 text-white font-medium">
                  Sincronização direta para Google Tasks e Google Docs
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
