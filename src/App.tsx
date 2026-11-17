import React, { useState } from 'react';
import type { MeetingRecording, MeetingSummary, TaskItem, User } from './types/index.ts';
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
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileAudio,
  FileText,
  Layers,
  ListTodo,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  User as UserIcon,
  XCircle,
} from 'lucide-react';
import {
  computeTaskApprovalStatus,
  computeTaskMapMetrics,
  formatDuration,
  formatFileSize,
} from './lib/meetingUtils.ts';
import {
  extractTasksFromTranscriptLines,
  loadUserMeetings,
  mergeExtractedTasks,
  saveUserMeetings,
} from './lib/userMeetingsStorage.ts';

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

  // Task Map sync & quick-add states
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [taskSyncError, setTaskSyncError] = useState<string | null>(null);
  const [showQuickAddTask, setShowQuickAddTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskAssignee, setQuickTaskAssignee] = useState('');
  const [quickTaskDueDate, setQuickTaskDueDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [quickTaskPriority, setQuickTaskPriority] =
    useState<TaskItem['priority']>('medium');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
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
    setTaskSyncError(null);
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
    setTaskSyncError(null);
    showToast('Sessão terminada.');
  };

  const handleMeetingProcessed = (newMeeting: MeetingRecording) => {
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    setActiveMeeting(newMeeting);
    setTaskSyncError(null);
    if (currentUser) {
      saveUserMeetings(currentUser.email, updated);
    }
    setShowRecorderModal(false);
    if (newMeeting.tasks.length > 0) {
      showToast(
        `Reunião processada! ${newMeeting.tasks.length} tarefa(s) adicionada(s) ao Mapa de Tarefas.`
      );
    } else {
      showToast('Reunião adicionada ao seu painel.');
    }
  };

  const handleUpdateMeetingTasks = (
    meetingId: string,
    updatedTasks: TaskItem[],
    updatedSummary?: MeetingSummary
  ) => {
    const updatedStatus = computeTaskApprovalStatus(updatedTasks);
    const updatedMeetings = meetings.map((m) =>
      m.id === meetingId
        ? {
            ...m,
            tasks: updatedTasks,
            summary: updatedSummary ?? m.summary,
            managerApprovalStatus: updatedStatus,
          }
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
        summary: updatedSummary ?? prev.summary,
        managerApprovalStatus: updatedStatus,
      };
    });
  };

  const handleExtractTasksForActiveMeeting = async () => {
    if (!activeMeeting || isSyncingTasks) return;

    setTaskSyncError(null);
    setIsSyncingTasks(true);
    try {
      const response = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: activeMeeting.title,
          transcript: activeMeeting.transcript,
          managerName: currentUser?.name,
          managerEmail: currentUser?.email,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        summary?: MeetingSummary;
        tasks?: TaskItem[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível extrair tarefas da reunião com IA neste momento.'
        );
      }

      const incomingTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const merged = mergeExtractedTasks(activeMeeting.tasks, incomingTasks);
      const addedCount = merged.length - activeMeeting.tasks.length;

      handleUpdateMeetingTasks(activeMeeting.id, merged, data.summary);
      if (addedCount > 0) {
        showToast(
          `${addedCount} nova(s) tarefa(s) sincronizada(s) no Mapa de Tarefas.`
        );
      } else {
        showToast('Mapa de Tarefas atualizado com o resumo da reunião.');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erro ao sincronizar tarefas com o servidor.';
      setTaskSyncError(msg);
    } finally {
      setIsSyncingTasks(false);
    }
  };

  const handleExtractTasksLocallyForActiveMeeting = () => {
    if (!activeMeeting) return;
    setTaskSyncError(null);
    const transcriptLines = (activeMeeting.transcript ?? []).map(
      (entry) => `${entry.speaker}: ${entry.text}`
    );
    const localTasks = extractTasksFromTranscriptLines(
      transcriptLines,
      currentUser?.name,
      currentUser?.email
    );
    const merged = mergeExtractedTasks(activeMeeting.tasks, localTasks);
    const addedCount = merged.length - activeMeeting.tasks.length;
    handleUpdateMeetingTasks(activeMeeting.id, merged);
    showToast(
      addedCount > 0
        ? `${addedCount} tarefa(s) extraída(s) localmente para o Mapa de Tarefas.`
        : 'Nenhuma tarefa adicional encontrada na transcrição.'
    );
  };

  const handleSetTaskStatus = (
    taskId: string,
    status: TaskItem['status']
  ) => {
    if (!activeMeeting) return;
    const updatedTasks = activeMeeting.tasks.map((t) =>
      t.id === taskId ? { ...t, status } : t
    );
    handleUpdateMeetingTasks(activeMeeting.id, updatedTasks);
  };

  const handleApproveAllPending = () => {
    if (!activeMeeting) return;
    const updatedTasks: TaskItem[] = activeMeeting.tasks.map((t) => ({
      ...t,
      status: t.status === 'rejected' ? 'rejected' : 'approved',
    }));
    handleUpdateMeetingTasks(activeMeeting.id, updatedTasks);
    showToast('Todas as tarefas pendentes foram aprovadas.');
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMeeting) return;
    const cleanedTitle = quickTaskTitle.trim();
    if (!cleanedTitle) return;

    const assigneeName = quickTaskAssignee.trim() || currentUser?.name || 'Equipa';
    const slug = assigneeName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');

    const newTask: TaskItem = {
      id: `task_dash_${Date.now()}`,
      title: cleanedTitle,
      description: 'Adicionada diretamente no Mapa de Tarefas do Dashboard.',
      assignee: {
        name: assigneeName,
        email: slug ? `${slug}@empresa.com` : currentUser?.email || 'equipa@empresa.com',
        role: 'Participante',
      },
      dueDate: quickTaskDueDate || new Date().toISOString().split('T')[0],
      priority: quickTaskPriority,
      status: 'pending_approval',
    };

    handleUpdateMeetingTasks(activeMeeting.id, [...activeMeeting.tasks, newTask]);
    setQuickTaskTitle('');
    setQuickTaskAssignee('');
    setShowQuickAddTask(false);
    showToast('Tarefa adicionada ao Mapa de Tarefas.');
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
    setTaskSyncError(null);
    showToast('Reunião removida do seu histórico.');
  };

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeTasks = activeMeeting?.tasks ?? [];
  const metrics = computeTaskMapMetrics(activeTasks);
  const approvalState = activeMeeting
    ? computeTaskApprovalStatus(activeTasks)
    : 'pending';

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
                        Mapa de Tarefas ({metrics.total} · {metrics.pending > 0 ? `${metrics.pending} Pendentes` : `${metrics.approved} Aprovadas`})
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
                    onClick={() => {
                      setActiveMeeting(m);
                      setTaskSyncError(null);
                    }}
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
                      {metrics.total === 0 ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <ListTodo className="w-4 h-4" /> Sem tarefas extraídas
                        </span>
                      ) : approvalState === 'fully_approved' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Aprovado
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {metrics.pending} Pendentes
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                      {metrics.approved} aprovadas · {metrics.rejected} rejeitadas · {metrics.total} total
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

                {/* Live Mapa de Tarefas Dashboard Section */}
                <section
                  aria-label="Mapa de Tarefas"
                  className="mt-6 pt-6 border-t border-slate-800 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-cyan-400" />
                        <span>Mapa de Tarefas</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Aprove, rejeite ou adicione tarefas extraídas desta reunião antes de notificar a equipa.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleExtractTasksForActiveMeeting()}
                        disabled={isSyncingTasks}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSyncingTasks ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{isSyncingTasks ? 'A extrair...' : 'Extrair com IA'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowQuickAddTask((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nova Tarefa</span>
                      </button>

                      {metrics.pending > 0 && (
                        <button
                          type="button"
                          onClick={handleApproveAllPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar Pendentes</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowTaskManagerModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                      >
                        <span>Gerir Completo</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Live Counters: Total, Aprovadas, Pendentes, Rejeitadas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Total
                      </div>
                      <div
                        data-testid="dashboard-metric-total"
                        className="text-xl font-bold text-white tabular-nums mt-0.5 font-mono"
                      >
                        {metrics.total}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20">
                      <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                        Aprovadas
                      </div>
                      <div
                        data-testid="dashboard-metric-approved"
                        className="text-xl font-bold text-emerald-400 tabular-nums mt-0.5 font-mono"
                      >
                        {metrics.approved}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/20">
                      <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
                        Pendentes
                      </div>
                      <div
                        data-testid="dashboard-metric-pending"
                        className="text-xl font-bold text-amber-400 tabular-nums mt-0.5 font-mono"
                      >
                        {metrics.pending}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/20">
                      <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">
                        Rejeitadas
                      </div>
                      <div
                        data-testid="dashboard-metric-rejected"
                        className="text-xl font-bold text-rose-400 tabular-nums mt-0.5 font-mono"
                      >
                        {metrics.rejected}
                      </div>
                    </div>
                  </div>

                  {taskSyncError && (
                    <div
                      role="alert"
                      className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200 space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <p>{taskSyncError}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-6">
                        <button
                          type="button"
                          onClick={() => void handleExtractTasksForActiveMeeting()}
                          className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-[11px] font-semibold text-rose-100"
                        >
                          Tentar novamente
                        </button>
                        <button
                          type="button"
                          onClick={handleExtractTasksLocallyForActiveMeeting}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-slate-200"
                        >
                          Extrair localmente (sem IA)
                        </button>
                      </div>
                    </div>
                  )}

                  {showQuickAddTask && (
                    <form
                      onSubmit={handleQuickAddTask}
                      className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3"
                    >
                      <div className="text-xs font-semibold text-cyan-300">
                        Adicionar Tarefa ao Mapa
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Descrição da Tarefa
                          </label>
                          <input
                            type="text"
                            required
                            value={quickTaskTitle}
                            onChange={(e) => setQuickTaskTitle(e.target.value)}
                            placeholder="Ex: Enviar relatório semanal ao cliente"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Responsável
                          </label>
                          <input
                            type="text"
                            value={quickTaskAssignee}
                            onChange={(e) => setQuickTaskAssignee(e.target.value)}
                            placeholder="Ex: Carlos"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Prazo
                            </label>
                            <input
                              type="date"
                              value={quickTaskDueDate}
                              onChange={(e) => setQuickTaskDueDate(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Prioridade
                            </label>
                            <select
                              value={quickTaskPriority}
                              onChange={(e) =>
                                setQuickTaskPriority(e.target.value as TaskItem['priority'])
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                            >
                              <option value="low">Baixa</option>
                              <option value="medium">Média</option>
                              <option value="high">Alta</option>
                              <option value="urgent">Urgente</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowQuickAddTask(false)}
                          className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                        >
                          Guardar Tarefa
                        </button>
                      </div>
                    </form>
                  )}

                  {activeTasks.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2.5">
                      <p className="text-xs font-semibold text-slate-200">
                        Nenhuma tarefa registada no Mapa de Tarefas desta reunião.
                      </p>
                      <p className="text-xs text-slate-400 max-w-lg mx-auto">
                        Clique em &ldquo;Extrair com IA&rdquo; para identificar automaticamente as ações da transcrição ou adicione uma tarefa manualmente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeTasks.map((task, idx) => (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors ${
                            task.status === 'approved' || task.status === 'modified'
                              ? 'bg-slate-950/70 border-emerald-500/30'
                              : task.status === 'rejected'
                              ? 'bg-slate-950/40 border-rose-900/40 opacity-70'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono text-slate-500">
                                #{idx + 1}
                              </span>
                              <span
                                className={`text-xs sm:text-sm font-semibold ${
                                  task.status === 'rejected'
                                    ? 'text-slate-400 line-through'
                                    : 'text-white'
                                }`}
                              >
                                {task.title}
                              </span>
                              <span
                                className={`text-[11px] font-semibold ${
                                  task.status === 'approved'
                                    ? 'text-emerald-400'
                                    : task.status === 'modified'
                                    ? 'text-cyan-400'
                                    : task.status === 'rejected'
                                    ? 'text-rose-400'
                                    : 'text-amber-300'
                                }`}
                              >
                                ·{' '}
                                {task.status === 'approved'
                                  ? 'Aprovada'
                                  : task.status === 'modified'
                                  ? 'Editada & Aprovada'
                                  : task.status === 'rejected'
                                  ? 'Rejeitada'
                                  : 'Pendente'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                <UserIcon className="w-3 h-3 text-cyan-400" />
                                <strong className="text-slate-200 font-medium">
                                  {task.assignee.name}
                                </strong>
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {task.dueDate}
                              </span>
                              <span
                                className={`uppercase font-semibold ${
                                  task.priority === 'urgent'
                                    ? 'text-rose-400'
                                    : task.priority === 'high'
                                    ? 'text-amber-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {task.status !== 'pending_approval' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetTaskStatus(task.id, 'pending_approval')
                                }
                                title="Marcar como pendente"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-amber-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Pendente</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSetTaskStatus(task.id, 'rejected')}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                                task.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'text-slate-300 hover:text-rose-300 bg-slate-900 hover:bg-slate-800 border border-slate-700'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejeitar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetTaskStatus(task.id, 'approved')}
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                task.status === 'approved' || task.status === 'modified'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {task.status === 'approved' || task.status === 'modified'
                                  ? 'Aprovado'
                                  : 'Aprovar'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Integrated Conversational Meeting Assistant (disabled when activeMeeting is null) */}
            <MeetingAssistantPanel
              meeting={activeMeeting}
              variant="inline"
              onRequestLoadMeeting={() => setShowRecorderModal(true)}
              onSyncTasksFromAI={handleExtractTasksForActiveMeeting}
              isSyncingTasks={isSyncingTasks}
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
          onExtractTasksWithAI={handleExtractTasksForActiveMeeting}
          isExtractingTasks={isSyncingTasks}
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
          onSyncTasksFromAI={handleExtractTasksForActiveMeeting}
          isSyncingTasks={isSyncingTasks}
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
