import React, { useState } from 'react';
import { User, MeetingRecording, TaskItem } from './types/index.ts';
import { INITIAL_MEETINGS } from './data/mockMeetings.ts';
import { Navbar } from './components/layout/Navbar.tsx';
import { HeroSection } from './components/landing/HeroSection.tsx';
import { FeaturesSection } from './components/landing/FeaturesSection.tsx';
import { ArchitectureComparison } from './components/landing/ArchitectureComparison.tsx';
import { PricingAndFooter } from './components/landing/PricingAndFooter.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { MediaRecorderDropzone } from './components/media/MediaRecorderDropzone.tsx';
import { TaskManagerModal } from './components/governance/TaskManagerModal.tsx';
import { MeetingChatbotDrawer } from './components/chat/MeetingChatbotDrawer.tsx';
import { MeetingAssistantPanel } from './components/chat/MeetingAssistantPanel.tsx';
import { GoogleWorkspaceModal } from './components/google/GoogleWorkspaceModal.tsx';
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  FileText, 
  Layers, 
  ListTodo,
  RotateCcw,
  Trash2,
  Upload
} from 'lucide-react';
import { computeTaskApprovalStatus, formatDuration, formatFileSize } from './lib/meetingUtils.ts';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'user_pm_default',
    name: 'Rita Silveira',
    email: 'rita.silveira@agilecorp.com',
    role: 'project_manager',
    organization: 'Fintech Velocity Squad'
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Meetings Database
  const [meetings, setMeetings] = useState<MeetingRecording[]>(INITIAL_MEETINGS);
  const [activeMeeting, setActiveMeeting] = useState<MeetingRecording | null>(INITIAL_MEETINGS[0]);

  // Modal / Drawer states
  const [showRecorderModal, setShowRecorderModal] = useState(false);
  const [showTaskManagerModal, setShowTaskManagerModal] = useState(false);
  const [showChatbotDrawer, setShowChatbotDrawer] = useState(false);
  const [showGoogleWorkspaceModal, setShowGoogleWorkspaceModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Sessão iniciada como ${user.name} (${user.role.replace('_', ' ')})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Sessão terminada.');
  };

  const handleMeetingProcessed = (newMeeting: MeetingRecording) => {
    setMeetings(prev => [newMeeting, ...prev]);
    setActiveMeeting(newMeeting);
    setShowRecorderModal(false);
    setShowTaskManagerModal(true);
    showToast('Reunião processada! Abra o Mapa de Tarefas para aprovação.');
  };

  const handleUpdateMeetingTasks = (meetingId: string, updatedTasks: TaskItem[]) => {
    const updatedStatus = computeTaskApprovalStatus(updatedTasks);
    setMeetings(prev => prev.map(m => {
      if (m.id === meetingId) {
        return {
          ...m,
          tasks: updatedTasks,
          managerApprovalStatus: updatedStatus
        };
      }
      return m;
    }));

    setActiveMeeting((prev) => {
      if (!prev || prev.id !== meetingId) return prev;
      return {
        ...prev,
        tasks: updatedTasks,
        managerApprovalStatus: updatedStatus,
      };
    });
  };

  const handleClearMeeting = () => {
    setActiveMeeting(null);
    setShowTaskManagerModal(false);
    setShowGoogleWorkspaceModal(false);
    showToast('Reunião removida do painel. Carregue uma reunião para ativar o assistente.');
  };

  const handleLoadSampleMeeting = () => {
    const sample = meetings[0] ?? INITIAL_MEETINGS[0];
    setActiveMeeting(sample);
    showToast(`Reunião "${sample.title}" carregada.`);
  };

  const handleOpenGovernanceSafely = () => {
    if (!activeMeeting) {
      const sample = meetings[0] ?? INITIAL_MEETINGS[0];
      setActiveMeeting(sample);
    }
    setShowTaskManagerModal(true);
  };

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const approvalState = activeMeeting
    ? computeTaskApprovalStatus(activeMeeting.tasks)
    : 'pending';
  const pendingCount = activeMeeting
    ? activeMeeting.tasks.filter((t) => t.status === 'pending_approval').length
    : 0;
  const approvedCount = activeMeeting
    ? activeMeeting.tasks.filter((t) => t.status === 'approved' || t.status === 'modified').length
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3.5 bg-slate-900 border border-cyan-500/50 rounded-xl shadow-xl flex items-center gap-2.5 text-xs text-white animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenRecorder={() => setShowRecorderModal(true)}
        onNavigateSection={handleNavigateSection}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Landing Page Hero Section */}
        <HeroSection
          onStartRecording={() => setShowRecorderModal(true)}
          onExploreDemo={handleOpenGovernanceSafely}
        />

        {/* Interactive Workspace Live Demo Strip */}
        <section id="meeting-workspace" className="py-12 bg-slate-900/60 border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                  <Layers className="w-4 h-4" />
                  <span>Espaço de Trabalho Interativo · Governança Ágil</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {activeMeeting
                    ? 'Reunião Selecionada para Governança'
                    : 'Nenhuma Reunião Carregada'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeMeeting
                    ? 'Consulte o resumo, valide tarefas, exporte para Google Tasks ou Docs e coloque dúvidas ao Assistente da Reunião.'
                    : 'Carregue ou grave um ficheiro de reunião para gerar o resumo, o mapa de tarefas e ativar o Assistente da Reunião.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {activeMeeting ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowGoogleWorkspaceModal(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#EA4335" d="M12 5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.9 2 14.6 1.2 12 1.2 7.5 1.2 3.7 3.8 1.8 7.5l3.4 2.6C6.1 7.2 8.8 5 12 5z"/>
                        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.9-2.2-6.8-5.1L1.8 16.6C3.7 20.3 7.5 23.8 12 23.8z"/>
                      </svg>
                      <span>Google Tasks & Docs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChatbotDrawer(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Assistente em Gaveta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTaskManagerModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md shadow-cyan-500/20"
                    >
                      <ListTodo className="w-4 h-4" />
                      <span>
                        Rever Mapa de Tarefas ({pendingCount > 0 ? `${pendingCount} Pendentes` : 'Aprovado'})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearMeeting}
                      aria-label="Limpar reunião atual"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Limpar Reunião</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRecorderModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md shadow-cyan-500/20"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Carregar ou Gravar Reunião</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSampleMeeting}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Carregar Reunião de Exemplo</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Meeting Detail Card or Empty State */}
            {activeMeeting ? (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-800/80">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                      <span className="text-slate-300 font-semibold">{activeMeeting.date}</span>
                      <span>·</span>
                      <span>{formatDuration(activeMeeting.durationSeconds)}</span>
                      <span>·</span>
                      <span>{formatFileSize(activeMeeting.fileSizeBytes)}</span>
                      <span>·</span>
                      <span className="text-cyan-400">{activeMeeting.fileName}</span>
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      {activeMeeting.title}
                    </h4>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      {activeMeeting.summary.executiveSummary}
                    </p>
                  </div>

                  {/* Manager Governance Status Capsule */}
                  <div className="lg:text-right shrink-0 p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                    <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                      Portão de Aprovação
                    </div>
                    <div className="flex items-center lg:justify-end gap-1.5 font-semibold">
                      {approvalState === 'fully_approved' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Totalmente Aprovado
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {pendingCount} Itens Pendentes
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {approvedCount} de {activeMeeting.tasks.length} tarefas autorizadas
                    </div>
                  </div>
                </div>

                {/* Decisions & Transcript Snippets Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      Decisões & Acordos-Chave
                    </h5>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {activeMeeting.summary.keyDecisions.map((dec, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{dec}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 pt-4 border-t border-slate-900">
                      <h5 className="text-xs font-semibold text-rose-400 mb-2">Bloqueios & Riscos</h5>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {activeMeeting.summary.blockersAndRisks.map((risk, i) => (
                          <li key={i}>⚠ {risk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Speaker Transcript Stream */}
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      Trechos de Voz Diarizados
                    </h5>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2 text-xs">
                      {activeMeeting.transcript?.map((t, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                          <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                            <span className="font-semibold text-cyan-300">{t.speaker}</span>
                            <span className="text-slate-500">{t.time}</span>
                          </div>
                          <p className="text-slate-300">{t.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-2xl border border-dashed border-slate-800 p-5 text-center">
                <p className="text-sm font-semibold text-slate-200">
                  Ainda não existe nenhuma reunião selecionada nesta sessão
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto">
                  Carregue um ficheiro de áudio/vídeo ou carregue a reunião de exemplo para visualizar o resumo executivo, as decisões, os trechos diarizados e desbloquear o Assistente da Reunião abaixo.
                </p>
              </div>
            )}

            {/* Integrated Conversational Meeting Assistant */}
            <MeetingAssistantPanel
              meeting={activeMeeting}
              variant="inline"
              onRequestLoadMeeting={() => setShowRecorderModal(true)}
            />
          </div>
        </section>

        {/* Core Capabilities Bento Section */}
        <FeaturesSection
          onOpenRecorder={() => setShowRecorderModal(true)}
          onExploreGovernance={handleOpenGovernanceSafely}
        />

        {/* Comparison Section */}
        <ArchitectureComparison />

        {/* Footer */}
        <PricingAndFooter />
      </main>

      {/* MODAL 1: MEDIA RECORDER & DROPZONE */}
      {showRecorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setShowRecorderModal(false)}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 rounded-lg transition-colors"
            >
              ✕
            </button>
            <MediaRecorderDropzone
              onMeetingProcessed={handleMeetingProcessed}
              onClose={() => setShowRecorderModal(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: TASK MANAGER & GOVERNANCE */}
      {activeMeeting && (
        <TaskManagerModal
          key={activeMeeting.id}
          meeting={activeMeeting}
          isOpen={showTaskManagerModal}
          onClose={() => setShowTaskManagerModal(false)}
          onUpdateMeetingTasks={handleUpdateMeetingTasks}
          onOpenGoogleWorkspace={() => {
            setShowTaskManagerModal(false);
            setShowGoogleWorkspaceModal(true);
          }}
        />
      )}

      {/* MODAL 3: GOOGLE WORKSPACE (TASKS & DOCS) */}
      {activeMeeting && (
        <GoogleWorkspaceModal
          key={`google-${activeMeeting.id}`}
          isOpen={showGoogleWorkspaceModal}
          onClose={() => setShowGoogleWorkspaceModal(false)}
          meeting={activeMeeting}
        />
      )}

      {/* MODAL 4: MEETING CHATBOT DRAWER */}
      <MeetingChatbotDrawer
        meeting={activeMeeting}
        isOpen={showChatbotDrawer}
        onClose={() => setShowChatbotDrawer(false)}
        onRequestLoadMeeting={() => {
          setShowChatbotDrawer(false);
          setShowRecorderModal(true);
        }}
      />

      {/* MODAL 5: AUTHENTICATION (LOGIN / REGISTER) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
