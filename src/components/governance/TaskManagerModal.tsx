import React, { useEffect, useState } from 'react';
import { MeetingRecording, TaskItem } from '../../types/index.ts';
import {
  X,
  CheckCircle2,
  Edit3,
  Send,
  Clock,
  User as UserIcon,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  CheckCheck,
  Quote,
  Sparkles,
  CheckSquare,
  Plus,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { computeTaskMapMetrics } from '../../lib/meetingUtils.ts';

interface TaskManagerModalProps {
  meeting: MeetingRecording;
  isOpen: boolean;
  onClose: () => void;
  onUpdateMeetingTasks: (meetingId: string, updatedTasks: TaskItem[]) => void;
  onOpenGoogleWorkspace?: () => void;
  onExtractTasksWithAI?: () => Promise<void>;
  isExtractingTasks?: boolean;
}

export const TaskManagerModal: React.FC<TaskManagerModalProps> = ({
  meeting,
  isOpen,
  onClose,
  onUpdateMeetingTasks,
  onOpenGoogleWorkspace,
  onExtractTasksWithAI,
  isExtractingTasks = false,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>(meeting.tasks);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    assigneeName: string;
    dueDate: string;
    priority: TaskItem['priority'];
  }>({
    title: '',
    assigneeName: '',
    dueDate: '',
    priority: 'medium',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<{
    title: string;
    assigneeName: string;
    dueDate: string;
    priority: TaskItem['priority'];
  }>({
    title: '',
    assigneeName: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
  });
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  useEffect(() => {
    setTasks(meeting.tasks);
  }, [meeting.id, meeting.tasks]);

  useEffect(() => {
    if (!isOpen) {
      setEditingTaskId(null);
      setShowAddForm(false);
      setDispatchSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commitTasks = (updated: TaskItem[]) => {
    setTasks(updated);
    onUpdateMeetingTasks(meeting.id, updated);
  };

  const handleApprove = (taskId: string) => {
    commitTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, status: 'approved' as const } : t))
    );
  };

  const handleReject = (taskId: string) => {
    commitTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, status: 'rejected' as const } : t))
    );
  };

  const handleSetPending = (taskId: string) => {
    commitTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'pending_approval' as const } : t
      )
    );
  };

  const handleStartEdit = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      assigneeName: task.assignee.name,
      dueDate: task.dueDate,
      priority: task.priority,
    });
  };

  const handleSaveEdit = (taskId: string) => {
    commitTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            title: editForm.title.trim() || t.title,
            dueDate: editForm.dueDate || t.dueDate,
            priority: editForm.priority,
            assignee: {
              ...t.assignee,
              name: editForm.assigneeName.trim() || t.assignee.name,
            },
            status: 'modified' as const,
          };
        }
        return t;
      })
    );
    setEditingTaskId(null);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedTitle = newTaskForm.title.trim();
    if (!cleanedTitle) return;

    const assigneeName = newTaskForm.assigneeName.trim() || 'Equipa';
    const emailSlug = assigneeName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');

    const created: TaskItem = {
      id: `task_manual_${Date.now()}`,
      title: cleanedTitle,
      description: 'Tarefa adicionada manualmente ao Mapa de Tarefas.',
      assignee: {
        name: assigneeName,
        email: emailSlug ? `${emailSlug}@empresa.com` : 'equipa@empresa.com',
        role: 'Participante',
      },
      dueDate: newTaskForm.dueDate || new Date().toISOString().split('T')[0],
      priority: newTaskForm.priority,
      status: 'pending_approval',
    };

    commitTasks([...tasks, created]);
    setNewTaskForm({
      title: '',
      assigneeName: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
    });
    setShowAddForm(false);
  };

  const handleApproveAll = () => {
    const updated: TaskItem[] = tasks.map((t) => ({
      ...t,
      status: (t.status === 'rejected' ? 'rejected' : 'approved') as TaskItem['status'],
    }));
    commitTasks(updated);
  };

  const handleDispatchNotifications = () => {
    setDispatchSuccess(true);
    setTimeout(() => {
      setDispatchSuccess(false);
      onClose();
    }, 2200);
  };

  const metrics = computeTaskMapMetrics(tasks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mapa de Distribuição de Tarefas"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Governança Manager-in-the-Loop</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Mapa de Distribuição de Tarefas
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Reunião: <span className="text-slate-200 font-medium">{meeting.title}</span> · A equipa{' '}
              <strong className="text-cyan-300">só recebe notificações</strong> após a sua autorização expressa.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Metrics Strip */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>
              Total:{' '}
              <strong data-testid="modal-metric-total" className="text-white tabular-nums">
                {metrics.total}
              </strong>
            </span>
            <span>·</span>
            <span>
              Aprovadas:{' '}
              <strong data-testid="modal-metric-approved" className="text-emerald-400 tabular-nums">
                {metrics.approved}
              </strong>
            </span>
            <span>·</span>
            <span>
              Pendentes:{' '}
              <strong data-testid="modal-metric-pending" className="text-amber-400 tabular-nums">
                {metrics.pending}
              </strong>
            </span>
            <span>·</span>
            <span>
              Rejeitadas:{' '}
              <strong data-testid="modal-metric-rejected" className="text-rose-400 tabular-nums">
                {metrics.rejected}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-sans">
            {onExtractTasksWithAI && (
              <button
                type="button"
                onClick={() => void onExtractTasksWithAI()}
                disabled={isExtractingTasks}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded transition-colors disabled:opacity-50"
              >
                {isExtractingTasks ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{isExtractingTasks ? 'A extrair...' : 'Extrair com IA'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Nova Tarefa</span>
            </button>

            {metrics.pending > 0 && (
              <button
                type="button"
                onClick={handleApproveAll}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors font-semibold"
              >
                Aprovar Todas Pendentes
              </button>
            )}
          </div>
        </div>

        {/* Task List (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {showAddForm && (
            <form
              onSubmit={handleAddTask}
              className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3"
            >
              <div className="text-xs font-semibold text-cyan-300">
                Adicionar Nova Tarefa ao Mapa
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="Ex: Validar protótipo final com a equipa"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.assigneeName}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, assigneeName: e.target.value })
                    }
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Prazo de Entrega
                  </label>
                  <input
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        priority: e.target.value as TaskItem['priority'],
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md"
                >
                  Adicionar Tarefa
                </button>
              </div>
            </form>
          )}

          {tasks.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-center space-y-3">
              <p className="text-sm font-semibold text-white">
                Nenhuma tarefa registada neste Mapa de Tarefas
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Extraia automaticamente as tarefas discutidas na transcrição com a IA ou adicione uma nova tarefa manualmente.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {onExtractTasksWithAI && (
                  <button
                    type="button"
                    onClick={() => void onExtractTasksWithAI()}
                    disabled={isExtractingTasks}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isExtractingTasks ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isExtractingTasks ? 'A extrair tarefas...' : 'Extrair Tarefas com IA'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Tarefa Manual</span>
                </button>
              </div>
            </div>
          ) : (
            tasks.map((task, index) => {
              const isEditing = editingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    task.status === 'approved' || task.status === 'modified'
                      ? 'bg-slate-950/60 border-emerald-500/30'
                      : task.status === 'rejected'
                      ? 'bg-slate-950/30 border-rose-900/30 opacity-65'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isEditing ? (
                    /* INLINE EDIT MODE */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Título da Tarefa
                        </label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Responsável
                          </label>
                          <input
                            type="text"
                            value={editForm.assigneeName}
                            onChange={(e) =>
                              setEditForm({ ...editForm, assigneeName: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Prazo de Entrega
                          </label>
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Prioridade
                          </label>
                          <select
                            value={editForm.priority}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                priority: e.target.value as TaskItem['priority'],
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          className="px-3.5 py-1 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xs font-mono text-slate-500 mt-0.5">
                            #{index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start shrink-0">
                          <span
                            className={`text-[11px] font-semibold ${
                              task.priority === 'urgent'
                                ? 'text-rose-400'
                                : task.priority === 'high'
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span
                            className={`text-[11px] font-medium ${
                              task.status === 'approved'
                                ? 'text-emerald-400 font-semibold'
                                : task.status === 'modified'
                                ? 'text-cyan-400 font-semibold'
                                : task.status === 'rejected'
                                ? 'text-rose-400 line-through'
                                : 'text-amber-300'
                            }`}
                          >
                            {task.status === 'approved'
                              ? 'Aprovada'
                              : task.status === 'modified'
                              ? 'Editada & Aprovada'
                              : task.status === 'rejected'
                              ? 'Rejeitada'
                              : 'Pendente'}
                          </span>
                        </div>
                      </div>

                      {task.contextSnippet && (
                        <div className="my-2.5 p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-start gap-2">
                          <Quote className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="italic text-[11px]">{task.contextSnippet}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-900">
                        <div className="flex flex-wrap items-center gap-4 text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-slate-200 font-medium">{task.assignee.name}</span>
                            <span className="text-[11px] text-slate-500">({task.assignee.role})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Entrega:{' '}
                              <strong className="text-slate-200 font-mono">{task.dueDate}</strong>
                            </span>
                          </div>
                          {task.estimatedHours && (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{task.estimatedHours}h est.</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(task)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Editar tarefa ou reatribuir"
                            aria-label={`Editar ${task.title}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {task.status !== 'pending_approval' && (
                            <button
                              type="button"
                              onClick={() => handleSetPending(task.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                              title="Voltar para pendente"
                              aria-label={`Marcar ${task.title} como pendente`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleReject(task.id)}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                              task.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
                            }`}
                          >
                            Rejeitar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(task.id)}
                            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                              task.status === 'approved' || task.status === 'modified'
                                ? 'bg-emerald-500 text-slate-950 font-bold'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {task.status === 'approved' || task.status === 'modified'
                              ? 'Aprovado'
                              : 'Aprovar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Dispatch Action */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {metrics.total === 0 ? (
              <span className="flex items-center gap-1.5 text-slate-400">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                Adicione ou extraia tarefas antes de enviar notificações.
              </span>
            ) : metrics.pending > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Ainda tem <strong className="tabular-nums font-mono">{metrics.pending}</strong> tarefa(s) pendente(s) de aprovação.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCheck className="w-4 h-4 shrink-0" />
                Todas as tarefas foram revistas pelo Gestor. Seguro para disparar.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenGoogleWorkspace && (
              <button
                type="button"
                onClick={onOpenGoogleWorkspace}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors shadow-sm"
              >
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Tasks & Docs</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleDispatchNotifications}
              disabled={dispatchSuccess || metrics.approved === 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 disabled:opacity-50 rounded-lg transition-all shadow-md shadow-cyan-500/20 focus:outline-none"
            >
              {dispatchSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Notificações Disparadas com Sucesso!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Disparar Tarefas ({metrics.approved})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
