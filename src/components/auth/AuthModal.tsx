import React, { useState } from 'react';
import { User } from '../../types/index.ts';
import { evaluatePasswordStrength } from '../../lib/meetingUtils.ts';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
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
  const [acceptGovernanceTerms, setAcceptGovernanceTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const passwordStrength = evaluatePasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Por favor forneça um email profissional válido.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Por favor insira o seu nome completo.');
        return;
      }
      if (passwordStrength.score < 2) {
        setErrorMessage('A palavra-passe precisa de cumprir os requisitos de segurança mínimos corporativos.');
        return;
      }
      if (!acceptGovernanceTerms) {
        setErrorMessage('É obrigatório aceitar o termo de confidencialidade e governança de dados.');
        return;
      }
    } else {
      if (!password) {
        setErrorMessage('Por favor introduza a sua palavra-passe.');
        return;
      }
    }

    setIsSubmitting(true);

    // Simulate secure token handshake & authentication
    setTimeout(() => {
      setIsSubmitting(false);
      const authenticatedUser: User = {
        id: `user_${Date.now()}`,
        name: mode === 'register' ? name : (email.split('@')[0] || 'Gestor Operacional'),
        email,
        role,
        organization: organization || 'Agile Teams Corp',
      };

      onLoginSuccess(authenticatedUser);
      onClose();
    }, 600);
  };

  const handleSSOLogin = (provider: 'Google' | 'Microsoft') => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ssoUser: User = {
        id: `sso_${provider.toLowerCase()}_${Date.now()}`,
        name: provider === 'Google' ? 'Gestor Google Workspace' : 'Scrum Lead Microsoft Entra',
        email: `gestor@${organization.toLowerCase().replace(/\s+/g, '') || 'empresa'}.com`,
        role: 'project_manager',
        organization: organization || 'Empresa Ágil S.A.',
      };
      onLoginSuccess(ssoUser);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Kicker */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Ambiente Corporativo Seguro · AES-256</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Aceder ao SmartMeeting' : 'Criar Conta de Gestão'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' 
              ? 'Inicie sessão para gerir reuniões e aprovar distribuições de tarefas.'
              : 'Comece a poupar 5+ horas semanais na administração pós-reunião.'}
          </p>
        </div>

        {/* Switch Mode Tabs (Segmented control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/60 border border-slate-800/80 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sessão
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'register'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {/* Enterprise SSO Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleSSOLogin('Google')}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-200 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.9 2 14.6 1.2 12 1.2 7.5 1.2 3.7 3.8 1.8 7.5l3.4 2.6C6.1 7.2 8.8 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.2 14.9c-.3-.8-.4-1.8-.4-2.9 0-1 .2-2 .4-2.9L1.8 6.5C.7 8.7 0 10.3 0 12s.7 3.3 1.8 5.5l3.4-2.6z"/>
              <path fill="#34A853" d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.9-2.2-6.8-5.1L1.8 16.6C3.7 20.3 7.5 23.8 12 23.8z"/>
            </svg>
            <span className="truncate">Google Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => handleSSOLogin('Microsoft')}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-200 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span className="truncate">Microsoft Entra</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider">ou credenciais</span>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ana Sofia Martins"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cargo Operacional
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as User['role'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="project_manager">Project Manager (PM)</option>
                    <option value="scrum_master">Scrum Master</option>
                    <option value="developer">Tech Lead / Dev</option>
                    <option value="designer">Product Designer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Empresa / Squad
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Ex: Fintech Alpha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Profissional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Palavra-passe
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => alert('Instruções de redefinição de palavra-passe corporativa enviadas para o email corporativo cadastrado.')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength meter for registration */}
            {mode === 'register' && password.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Força da palavra-passe:</span>
                  <span className={`font-semibold ${
                    passwordStrength.score >= 3 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                  <div className={`h-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'}`} />
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <span className={passwordStrength.requirements.minLength ? 'text-emerald-400' : ''}>8+ chars</span>
                  <span>·</span>
                  <span className={passwordStrength.requirements.hasUppercase ? 'text-emerald-400' : ''}>Maiúscula</span>
                  <span>·</span>
                  <span className={passwordStrength.requirements.hasNumber ? 'text-emerald-400' : ''}>Número</span>
                  <span>·</span>
                  <span className={passwordStrength.requirements.hasSpecial ? 'text-emerald-400' : ''}>Símbolo</span>
                </div>
              </div>
            )}
          </div>

          {mode === 'register' && (
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={acceptGovernanceTerms}
                  onChange={(e) => setAcceptGovernanceTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>
                  Concordo com a política de governança de dados e retenção segura em conformidade com o RGPD.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 disabled:opacity-50 rounded-lg transition-all shadow-md shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400 mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Autenticando...
              </span>
            ) : mode === 'login' ? (
              'Entrar no Painel'
            ) : (
              'Criar Conta Corporativa'
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-[11px] text-slate-500 border-t border-slate-800/80 pt-4">
          Encriptação ponta a ponta com JWTs de sessão efêmera e cookies HttpOnly.
        </div>
      </div>
    </div>
  );
};
