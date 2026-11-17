import React, { useState } from 'react';
import type { MeetingRecording, TaskItem, User } from './types/index.ts';
import { Navbar } from './components/layout/Navbar.tsx';
import { HeroSection } from './components/landing/HeroSection.tsx';
import { FeaturesSection } from './components/landing/FeaturesSection.tsx';
import { Footer } from './components/landing/Footer.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { MediaRecorderDropzone } from './components/media/MediaRecorderDropzone.tsx';
import { TaskManagerModal } from './components/governance/TaskManagerModal.tsx';
import { MeetingChatbotDrawer } from './components/chat/MeetingChatbotDrawer.tsx';
import { MeetingAssistantPanel } from './components/chat/MeetingAssistantPanel.tsx';
import { GoogleWorkspaceModal } from './components/google/GoogleWorkspaceModal.tsx';
import {
  CheckCircle2,
  Clock,
  FileAudio,
  FileText,
  Layers,
  ListTodo,
  MessageSquare,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { computeTaskApprovalStatus, formatDuration, formatFileSize } from './lib/meetingUtils.ts';
import { loadUserMeetings, saveUserMeetings } from './lib/userMeetingsStorage.ts';

export default function App() {
  // Unauthenticated by default: landing page strictly gates workspace behind login/register
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // User-scoped meetings (always empty for newly created accounts)
  const [meetings, setMeetings] = useState<MeetingRecording[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<MeetingRecording | null>(null);

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
    const userMeetings = loadUserMeetings(user.email);
    setCurrentUser(user);
    setMeetings(userMeetings);
    setActiveMeeting(userMeetings[0] ?? null);
    showToast(`Bem-vindo(a), ${user.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMeetings([]);
    setActiveMeeting(null);
    setShowRecorderModal(false);
    setShowTaskManagerModal(false);
    setShowChatbotDrawer(false);
    setShowGoogleWorkspaceModal(false);
    showToast('Sessão terminada.');
  };

  const handleMeetingProcessed = (newMeeting: MeetingRecording) => {
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    setActiveMeeting(newMeeting);
    if (currentUser) {
      saveUserMeetings(currentUser.email, updated);
    }
    setShowRecorderModal(false);
    if (newMeeting.tasks.length > 0) {
      setShowTaskManagerModal(true);
      showToast('Reunião adicionada! Reveja o mapa de tarefas antes de notificar.');
    } else {
      showToast('Reunião adicionada ao seu painel.');
    }
  };

  const handleUpdateMeetingTasks = (meetingId: string, updatedTasks: TaskItem[]) => {
    const updatedStatus = computeTaskApprovalStatus(updatedTasks);
    const updatedMeetings = meetings.map((m) =>
      m.id === meetingId
        ? { ...m, tasks: updatedTasks, managerApprovalStatus: updatedStatus }
        : m
    );
    setMeetings(updatedMeetings);
    if (currentUser) {
      saveUserMeetings(currentUser.email, updatedMeetings);
    }

    setActiveMeeting((prev) => {
      if (!prev || prev.id !== meetingId) return prev;
      return {
        ...prev,
        tasks: updatedTasks,
        managerApprovalStatus: updatedStatus,
      };
    });
  };

  const handleDeleteActiveMeeting = () => {
    if (!activeMeeting) return;
    const remaining = meetings.filter((m) => m.id !== activeMeeting.id);
    setMeetings(remaining);
    setActiveMeeting(remaining[0] ?? null);
    if (currentUser) {
      saveUserMeetings(currentUser.email, remaining);
    }
    setShowTaskManagerModal(false);
    setShowGoogleWorkspaceModal(false);
    showToast('Reunião removida do seu histórico.');
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
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-slate-900 border border-cyan-500/50 rounded-xl shadow-xl flex items-center gap-2.5 text-xs text-white"
        >
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenRecorder={() => setShowRecorderModal(true)}
        onNavigateSection={handleNavigateSection}
      />

      {!currentUser ? (
        /* UNAUTHENTICATED LANDING PAGE: Product presentation + Login/Register only */
        <main className="flex-1">
          <HeroSection
            onOpenRegister={() => handleOpenAuth('register')}
            onOpenLogin={() => handleOpenAuth('login')}
          />
          <FeaturesSection onOpenRegister={() => handleOpenAuth('register')} />
        </main>
      ) : (
        /* AUTHENTICATED DASHBOARD: Strictly scoped to currentUser's own meetings */
        <main id="meeting-workspace" className="flex-1 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
                  <Layers className="w-4 h-4" />
                  <span>Painel de Reuniões · {currentUser.name}</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {activeMeeting ? activeMeeting.title : 'As Minhas Reuniões'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {activeMeeting ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowGoogleWorkspaceModal(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <span>Google Tasks & Docs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChatbotDrawer(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Assistente em Gaveta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTaskManagerModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                    >
                      <ListTodo className="w-4 h-4" />
                      <span>
                        Mapa de Tarefas ({pendingCount > 0 ? `${pendingCount} Pendentes` : 'Aprovado'})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteActiveMeeting}
                      aria-label="Remover reunião atual"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Remover</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRecorderModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Carregar Áudio ou Texto</span>
                  </button>
                )}
              </div>
            </div>

            {/* Meeting Switcher Strip when user has multiple meetings */}
            {meetings.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {meetings.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMeeting(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                      activeMeeting?.id === m.id
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowRecorderModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-dashed border-slate-700 text-slate-300 hover:border-cyan-500 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            )}

            {/* Empty State OR Active Meeting Report */}
            {!activeMeeting ? (
              <div
                data-testid="empty-meetings-state"
                className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                  <FileAudio className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  Ainda não tens reuniões. Carrega o teu primeiro áudio ou texto para começar
                </h2>
                <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Carregue um ficheiro de áudio/vídeo, grave diretamente ou cole uma transcrição para gerar o resumo, validar tarefas e ativar o assistente.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRecorderModal(true)}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Carregar Primeiro Áudio ou Texto</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-800">
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
                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                      {activeMeeting.summary.executiveSummary}
                    </p>
                  </div>

                  <div className="lg:text-right shrink-0 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                      Estado das Tarefas
                    </div>
                    <div className="flex items-center lg:justify-end gap-1.5 font-semibold">
                      {approvalState === 'fully_approved' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Aprovado
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {pendingCount} Pendentes
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {approvedCount} de {activeMeeting.tasks.length} tarefas validadas
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      Decisões & Pontos-Chave
                    </h2>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {activeMeeting.summary.keyDecisions.map((dec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold shrink-0">•</span>
                          <span>{dec}</span>
                        </li>
                      ))}
                    </ul>

                    {activeMeeting.summary.blockersAndRisks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80">
                        <h3 className="text-xs font-semibold text-rose-400 mb-2">Bloqueios</h3>
                        <ul className="space-y-1 text-xs text-slate-400">
                          {activeMeeting.summary.blockersAndRisks.map((risk, i) => (
                            <li key={i}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      Transcrição
                    </h2>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2 text-xs">
                      {activeMeeting.transcript?.map((t, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
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
            )}

            {/* Integrated Conversational Meeting Assistant (disabled when activeMeeting is null) */}
            <MeetingAssistantPanel
              meeting={activeMeeting}
              variant="inline"
              onRequestLoadMeeting={() => setShowRecorderModal(true)}
            />
          </div>
        </main>
      )}

      <Footer showFeaturesLink={!currentUser} />

      {/* Authenticated Modals */}
      {currentUser && showRecorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <button
              type="button"
              aria-label="Fechar janela de carregamento"
              onClick={() => setShowRecorderModal(false)}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 rounded-lg transition-colors"
            >
              ✕
            </button>
            <MediaRecorderDropzone
              onMeetingProcessed={handleMeetingProcessed}
              onClose={() => setShowRecorderModal(false)}
              managerName={currentUser.name}
              managerEmail={currentUser.email}
            />
          </div>
        </div>
      )}

      {currentUser && activeMeeting && (
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

      {currentUser && activeMeeting && (
        <GoogleWorkspaceModal
          key={`google-${activeMeeting.id}`}
          isOpen={showGoogleWorkspaceModal}
          onClose={() => setShowGoogleWorkspaceModal(false)}
          meeting={activeMeeting}
        />
      )}

      {currentUser && (
        <MeetingChatbotDrawer
          meeting={activeMeeting}
          isOpen={showChatbotDrawer}
          onClose={() => setShowChatbotDrawer(false)}
          onRequestLoadMeeting={() => {
            setShowChatbotDrawer(false);
            setShowRecorderModal(true);
          }}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
