import React from 'react';
import { User } from '../../types/index.ts';
import { ShieldCheck, Mic, Upload, LogIn, UserCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenRecorder: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenRecorder,
  onNavigateSection,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <button 
          onClick={() => onNavigateSection('hero')}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            SmartMeeting<span className="text-cyan-400">.ai</span>
          </span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button 
            onClick={() => onNavigateSection('features')}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 focus:outline-none"
          >
            Funcionalidades
          </button>
          <button 
            onClick={() => onNavigateSection('governance')}
            className="hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 focus:outline-none"
          >
            Aprovação de Tarefas
          </button>
        </nav>

        {/* Zone 3: Primary Action / User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenRecorder}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Nova Gravação</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-slate-200">{currentUser.name}</div>
                  <div className="text-slate-400 text-[11px] capitalize">{currentUser.role.replace('_', ' ')}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-colors"
                  title="Terminar sessão"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors whitespace-nowrap"
              >
                Entrar
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 rounded-lg transition-all whitespace-nowrap shadow-sm shadow-cyan-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span>Criar Conta Grátis</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
