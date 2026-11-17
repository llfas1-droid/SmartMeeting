import React, { useState, useEffect } from 'react';
import { MeetingRecording, TaskItem } from '../../types/index.ts';
import { 
  signInWithGoogleWorkspace, 
  getGoogleAccessToken, 
  logoutGoogleWorkspace,
  initGoogleAuth 
} from '../../services/googleAuth.ts';
import { 
  fetchGoogleTaskLists, 
  createGoogleTaskList, 
  syncApprovedTasksToGoogleList, 
  fetchTasksFromList,
  GoogleTaskList, 
  GoogleTask 
} from '../../services/googleTasksService.ts';
import { 
  createMeetingGoogleDoc, 
  listMeetingGoogleDocs, 
  ExportedGoogleDoc 
} from '../../services/googleDocsService.ts';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  FileText, 
  CheckSquare, 
  Plus, 
  RefreshCw, 
  LogOut, 
  Sparkles,
  Layers,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingRecording;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  meeting,
}) => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'docs'>('tasks');

  // Google Tasks state
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [newListName, setNewListName] = useState<string>(`SmartMeeting - ${meeting.title}`);
  const [showCreateListInput, setShowCreateListInput] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [tasksInSelectedList, setTasksInSelectedList] = useState<GoogleTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskSyncSuccess, setTaskSyncSuccess] = useState<string | null>(null);

  // Google Docs state
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [recentDocs, setRecentDocs] = useState<ExportedGoogleDoc[]>([]);
  const [lastCreatedDoc, setLastCreatedDoc] = useState<ExportedGoogleDoc | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docExportSuccess, setDocExportSuccess] = useState<string | null>(null);

  // General error banner
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation dialog state (mandatory for mutating workspace operations)
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: 'Confirmar',
    onConfirm: () => {},
  });

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        loadGoogleData(token);
      },
      () => {
        // Not authenticated
        setGoogleUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // When modal opens, refresh token and load data
  useEffect(() => {
    if (isOpen) {
      getGoogleAccessToken().then(token => {
        if (token) {
          setAccessToken(token);
          loadGoogleData(token);
        }
      });
    }
  }, [isOpen]);

  const loadGoogleData = async (token: string) => {
    try {
      setErrorMessage(null);
      // Load Task Lists
      const lists = await fetchGoogleTaskLists(token);
      setTaskLists(lists);
      if (lists.length > 0 && !selectedListId) {
        setSelectedListId(lists[0].id);
        loadTasksFromList(token, lists[0].id);
      }

      // Load Recent Docs
      setIsLoadingDocs(true);
      const docs = await listMeetingGoogleDocs(token);
      setRecentDocs(docs);
      setIsLoadingDocs(false);
    } catch (err: any) {
      console.warn('Error loading Google data:', err);
      // If unauthorized, token might need refresh
      if (err.message?.includes('401')) {
        setAccessToken(null);
        setGoogleUser(null);
      }
    }
  };

  const loadTasksFromList = async (token: string, listId: string) => {
    try {
      setIsLoadingTasks(true);
      const tasks = await fetchTasksFromList(token, listId);
      setTasksInSelectedList(tasks);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      setErrorMessage(null);
      const res = await signInWithGoogleWorkspace();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        await loadGoogleData(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Falha na autenticação com o Google Workspace.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogleWorkspace();
    setGoogleUser(null);
    setAccessToken(null);
    setTaskLists([]);
    setTasksInSelectedList([]);
  };

  // Google Tasks: Create new list
  const handleCreateNewList = async () => {
    if (!accessToken || !newListName.trim()) return;
    try {
      setErrorMessage(null);
      const newList = await createGoogleTaskList(accessToken, newListName.trim());
      setTaskLists(prev => [newList, ...prev]);
      setSelectedListId(newList.id);
      setShowCreateListInput(false);
      setNewListName('');
      loadTasksFromList(accessToken, newList.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao criar lista no Google Tasks.');
    }
  };

  // Prompt confirmation to sync tasks
  const promptSyncTasks = () => {
    const approvedTasks = meeting.tasks.filter(t => t.status === 'approved' || t.status === 'modified');
    const tasksToSync = approvedTasks.length > 0 ? approvedTasks : meeting.tasks;

    setConfirmationDialog({
      isOpen: true,
      title: 'Sincronizar com Google Tasks?',
      description: `Esta ação irá criar ${tasksToSync.length} tarefa(s) na sua lista do Google Tasks com os prazos, descrições e responsáveis acordados na reunião.`,
      actionLabel: 'Sincronizar Agora',
      onConfirm: () => executeSyncTasks(tasksToSync),
    });
  };

  const executeSyncTasks = async (tasksToSync: TaskItem[]) => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
    if (!accessToken || !selectedListId) return;

    try {
      setIsSyncingTasks(true);
      setErrorMessage(null);
      setTaskSyncSuccess(null);

      const result = await syncApprovedTasksToGoogleList(
        accessToken,
        selectedListId,
        tasksToSync,
        meeting.title
      );

      setTaskSyncSuccess(`${result.successCount} tarefas sincronizadas com sucesso para o Google Tasks!`);
      // Reload tasks
      await loadTasksFromList(accessToken, selectedListId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao sincronizar tarefas com o Google Tasks.');
    } finally {
      setIsSyncingTasks(false);
    }
  };

  // Prompt confirmation to export doc
  const promptExportDoc = () => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Gerar Ata no Google Docs?',
      description: `Será criado um novo documento formatado na sua conta Google contendo o resumo executivo, decisões, mapa de tarefas e transcrição da reunião "${meeting.title}".`,
      actionLabel: 'Criar Documento',
      onConfirm: executeExportDoc,
    });
  };

  const executeExportDoc = async () => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
    if (!accessToken) return;

    try {
      setIsExportingDoc(true);
      setErrorMessage(null);
      setDocExportSuccess(null);

      const created = await createMeetingGoogleDoc(accessToken, meeting);
      setLastCreatedDoc(created);
      setRecentDocs(prev => [created, ...prev]);
      setDocExportSuccess('Ata gerada com sucesso no Google Docs!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao gerar documento no Google Docs.');
    } finally {
      setIsExportingDoc(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                <span>Google Workspace Integration</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Google Tasks & Google Docs
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Auth Bar */}
          {!accessToken ? (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Conectar Conta Google
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                Inicie sessão para sincronizar tarefas diretamente com o <strong className="text-slate-200">Google Tasks</strong> e exportar atas de reunião formatadas para o <strong className="text-slate-200">Google Docs</strong>.
              </p>

              {/* Official Google Sign-in button */}
              <div>
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="inline-flex items-center gap-3 px-5 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.9 2 14.6 1.2 12 1.2 7.5 1.2 3.7 3.8 1.8 7.5l3.4 2.6C6.1 7.2 8.8 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.9-2.2-6.8-5.1L1.8 16.6C3.7 20.3 7.5 23.8 12 23.8z"/>
                  </svg>
                  <span>{isAuthenticating ? 'A conectar ao Google...' : 'Sign in with Google'}</span>
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    setAccessToken('demo_access_token');
                    setGoogleUser({
                      email: 'equipa@agilecorp.com',
                      displayName: 'Líder da Squad',
                    } as any);
                    setTaskLists([
                      { id: 'list-1', title: `SmartMeeting: ${meeting.title}`, updated: new Date().toISOString() },
                      { id: 'list-2', title: 'Tarefas da Squad (Sprint)', updated: new Date().toISOString() }
                    ]);
                    setSelectedListId('list-1');
                    setTasksInSelectedList([
                      { id: 'gt-1', title: '[HIGH] Criar spec técnica para adapter de pagamentos', status: 'needsAction', due: '2026-10-27T00:00:00.000Z' },
                      { id: 'gt-2', title: '[URGENT] Configurar monitor no Datadog para transações', status: 'needsAction', due: '2026-10-26T00:00:00.000Z' }
                    ]);
                    setRecentDocs([
                      {
                        id: 'doc-demo-1',
                        title: `SmartMeeting - Ata: ${meeting.title} (${meeting.date})`,
                        webViewLink: 'https://docs.google.com/document/u/0/',
                        createdTime: new Date().toISOString()
                      }
                    ]);
                  }}
                  className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  Modo de Demonstração (Pré-visualizar Workspace)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Connected User Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-400">Conectado como:</span>
                  <span className="font-semibold text-white">{googleUser?.email || 'Conta Google Ativa'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadGoogleData(accessToken)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Atualizar dados"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Desconectar</span>
                  </button>
                </div>
              </div>

              {/* Segmented Control Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'tasks'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Google Tasks ({meeting.tasks.length} Tarefas)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('docs')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'docs'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Google Docs (Ata da Reunião)</span>
                </button>
              </div>

              {/* TAB 1: GOOGLE TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {taskSyncSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{taskSyncSuccess}</span>
                    </div>
                  )}

                  {/* List Selector & Create List */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-white">Lista de Destino no Google Tasks</label>
                      <button
                        type="button"
                        onClick={() => setShowCreateListInput(!showCreateListInput)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nova Lista</span>
                      </button>
                    </div>

                    {showCreateListInput && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          placeholder="Nome da nova lista..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={handleCreateNewList}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg"
                        >
                          Criar
                        </button>
                      </div>
                    )}

                    <select
                      value={selectedListId}
                      onChange={(e) => {
                        setSelectedListId(e.target.value);
                        if (accessToken) loadTasksFromList(accessToken, e.target.value);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {taskLists.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tasks to Sync Summary */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-semibold text-white">Tarefas Prontas para Exportar</span>
                      <span className="text-slate-400 font-mono">{meeting.tasks.length} itens</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                      {meeting.tasks.map(t => (
                        <div key={t.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{t.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {t.assignee.name} · Prazo: {t.dueDate}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                            t.priority === 'urgent' ? 'bg-rose-500/10 text-rose-400' :
                            t.priority === 'high' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Cada tarefa incluirá os snippets de contexto e dados do responsável.
                      </span>

                      <button
                        type="button"
                        onClick={promptSyncTasks}
                        disabled={isSyncingTasks || !selectedListId}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-all shadow-sm shadow-cyan-500/20"
                      >
                        {isSyncingTasks ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                            <span>A sincronizar...</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Exportar para Google Tasks</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tasks currently in list */}
                  {tasksInSelectedList.length > 0 && (
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                        <span>Tarefas existentes na lista selecionada:</span>
                        <span>{tasksInSelectedList.length} itens</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                        {tasksInSelectedList.map(t => (
                          <div key={t.id} className="p-2 rounded bg-slate-900/60 border border-slate-850 flex items-center justify-between">
                            <span className={t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-300'}>
                              {t.title}
                            </span>
                            {t.due && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(t.due).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: GOOGLE DOCS */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  {docExportSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{docExportSuccess}</span>
                      </div>
                      {lastCreatedDoc && (
                        <a
                          href={lastCreatedDoc.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-emerald-200 underline"
                        >
                          <span>Abrir no Google Docs</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Generate Document Card */}
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Gerar Ata Executiva no Google Docs
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Cria um novo documento formal no seu Google Drive com resumo executivo, acordos da equipa, tabela de tarefas atribuídas e extratos da conversa com timestamps.
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                      <div className="text-slate-400">Título: <span className="text-white">SmartMeeting - Ata: {meeting.title} ({meeting.date})</span></div>
                      <div className="text-slate-400">Conteúdo: <span className="text-cyan-400">Resumo + Decisões + Tarefas + Diarização</span></div>
                    </div>

                    <button
                      type="button"
                      onClick={promptExportDoc}
                      disabled={isExportingDoc}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 disabled:opacity-50 rounded-lg transition-all shadow-md shadow-cyan-500/20"
                    >
                      {isExportingDoc ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                          <span>A criar documento no Google Docs...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          <span>Gerar Documento no Google Docs</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Recently Exported Docs */}
                  {recentDocs.length > 0 && (
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                      <h5 className="text-xs font-semibold text-slate-300 mb-2">
                        Atas Exportadas Recentemente no Google Drive
                      </h5>
                      <div className="space-y-2 text-xs">
                        {recentDocs.map(doc => (
                          <div key={doc.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                              <span className="text-slate-200 truncate">{doc.title}</span>
                            </div>
                            <a
                              href={doc.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 shrink-0"
                            >
                              <span>Abrir</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Tokens OAuth geridos em memória com permissões de utilizador.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Explicit Confirmation Dialog (Mandatory per Workspace Integration Skill) */}
      {confirmationDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              {confirmationDialog.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {confirmationDialog.description}
            </p>
            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmationDialog.onConfirm}
                className="px-4 py-2 font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm"
              >
                {confirmationDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
