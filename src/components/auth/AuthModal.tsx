import React, { useEffect, useState } from 'react';
import type { User } from '../../types/index.ts';
import { evaluatePasswordStrength } from '../../lib/meetingUtils.ts';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<User['role']>('project_manager');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setInfoMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const passwordStrength = evaluatePasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Indique um email válido.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Indique o seu nome.');
        return;
      }
      if (passwordStrength.score < 2) {
        setErrorMessage('Escolha uma palavra-passe com pelo menos 8 caracteres e letras/números.');
        return;
      }
    } else if (!password) {
      setErrorMessage('Introduza a sua palavra-passe.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const authenticatedUser: User = {
        id: `user_${Date.now()}`,
        name: mode === 'register' ? name.trim() : email.split('@')[0] || 'Utilizador',
        email: email.trim(),
        role,
        organization: organization.trim() || 'Equipa SmartMeeting',
      };

      onLoginSuccess(authenticatedUser);
      onClose();
    }, 350);
  };

  const handleSSOLogin = (provider: 'Google' | 'Microsoft') => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setTimeout(() => {
      setIsSubmitting(false);
      const ssoUser: User = {
        id: `sso_${provider.toLowerCase()}_${Date.now()}`,
        name: provider === 'Google' ? 'Conta Google' : 'Conta Microsoft',
        email: `conta.${provider.toLowerCase()}@empresa.com`,
        role: 'project_manager',
        organization: organization.trim() || 'Equipa SmartMeeting',
      };
      onLoginSuccess(ssoUser);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 relative"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'login' ? 'Iniciar Sessão' : 'Criar Conta Gratuita'}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SmartMeeting · 100% Gratuito</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Iniciar Sessão' : 'Criar Conta Gratuita'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Entre para aceder às suas reuniões e tarefas.'
              : 'Crie a sua conta para começar com um painel limpo.'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950/60 border border-slate-800/80 rounded-lg mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'register'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleSSOLogin('Google')}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-200 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.9 2 14.6 1.2 12 1.2 7.5 1.2 3.7 3.8 1.8 7.5l3.4 2.6C6.1 7.2 8.8 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.2 14.9c-.3-.8-.4-1.8-.4-2.9 0-1 .2-2 .4-2.9L1.8 6.5C.7 8.7 0 10.3 0 12s.7 3.3 1.8 5.5l3.4-2.6z"/>
              <path fill="#34A853" d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.9-2.2-6.8-5.1L1.8 16.6C3.7 20.3 7.5 23.8 12 23.8z"/>
            </svg>
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleSSOLogin('Microsoft')}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-200 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 23 23" aria-hidden="true">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span>Microsoft</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center mb-4">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500">ou com email</span>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div role="status" className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-start gap-2 text-xs text-cyan-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="auth-name" className="block text-xs font-medium text-slate-300 mb-1">
                  Nome
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Joana Mendes"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="auth-role" className="block text-xs font-medium text-slate-300 mb-1">
                    Função
                  </label>
                  <select
                    id="auth-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as User['role'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="project_manager">Gestor de Projeto</option>
                    <option value="scrum_master">Scrum Master</option>
                    <option value="developer">Tech Lead / Dev</option>
                    <option value="designer">Product Designer</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="auth-org" className="block text-xs font-medium text-slate-300 mb-1">
                    Equipa
                  </label>
                  <input
                    id="auth-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Ex: Produto"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="auth-password" className="text-xs font-medium text-slate-300">
                Palavra-passe
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() =>
                    setInfoMessage(
                      'Se esqueceu a palavra-passe, introduza o seu email e solicite redefinição.'
                    )
                  }
                  className="text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  Esqueceu?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar caracteres' : 'Exibir caracteres'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === 'register' && password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="grid grid-cols-4 gap-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'}`} />
                </div>
                <div className="text-[10px] text-slate-500">
                  Mínimo 8 caracteres com maiúscula ou número.
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 disabled:opacity-50 rounded-lg transition-all mt-2"
          >
            {isSubmitting
              ? 'A entrar...'
              : mode === 'login'
              ? 'Entrar no Painel'
              : 'Criar Conta Gratuita'}
          </button>
        </form>
      </div>
    </div>
  );
};
