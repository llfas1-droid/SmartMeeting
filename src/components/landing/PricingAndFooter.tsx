import React from 'react';

interface PricingAndFooterProps {
  onSelectPlan?: (planName: string) => void;
}

export const PricingAndFooter: React.FC<PricingAndFooterProps> = () => {
  return (
    <footer className="py-10 bg-slate-950/80 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">SmartMeeting</span>
          <span>· Inteligência de reuniões e distribuição de tarefas</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-slate-300 transition-colors">Funcionalidades</a>
          <a href="#governance" className="hover:text-slate-300 transition-colors">Aprovação de Tarefas</a>
          <span className="text-slate-700">|</span>
          <span>© 2026 SmartMeeting AI. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
};
