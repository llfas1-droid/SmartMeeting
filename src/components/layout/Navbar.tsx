import React from 'react';
import type { User } from '../../types/index.ts';
import { Mic, Sparkles } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        <button
          type="button"
          onClick={() => onNavigateSection(currentUser ? 'meeting-workspace' : 'hero')}
          className="flex items-center gap-2 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-1 shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            SmartMeeting
          </span>
        </button>

        {!currentUser && (
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <button
              type="button"
              onClick={() => onNavigateSection('features')}
              className="hover:text-cyan-300 transition-colors whitespace-nowrap"
            >
              Funcionalidades
            </button>
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenRecorder}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Nova Reunião</span>
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-slate-200">{currentUser.name}</div>
                  <div className="text-slate-400 text-[11px]">{currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-2.5 sm:px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors whitespace-nowrap"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 rounded-lg transition-all whitespace-nowrap"
              >
                <span>Criar Conta<span className="hidden sm:inline"> Grátis</span></span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
