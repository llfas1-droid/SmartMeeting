import React, { useState } from 'react';
import { MeetingRecording, TaskItem } from '../../types/index.ts';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Send, 
  Clock, 
  User as UserIcon, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  CheckCheck,
  Quote,
  Sparkles,
  ExternalLink,
  CheckSquare
} from 'lucide-react';
import { computeTaskApprovalStatus } from '../../lib/meetingUtils.ts';

interface TaskManagerModalProps {
  meeting: MeetingRecording;
  isOpen: boolean;
  onClose: () => void;
  onUpdateMeetingTasks: (meetingId: string, updatedTasks: TaskItem[]) => void;
  onOpenGoogleWorkspace?: () => void;
}

export const TaskManagerModal: React.FC<TaskManagerModalProps> = ({
  meeting,
  isOpen,
  onClose,
  onUpdateMeetingTasks,
  onOpenGoogleWorkspace,
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
    priority: 'medium'
  });
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApprove = (taskId: string) => {
    const updated = tasks.map(t => 
      t.id === taskId ? { ...t, status: 'approved' as const } : t
    );
    setTasks(updated);
    onUpdateMeetingTasks(meeting.id, updated);
  };

  const handleReject = (taskId: string) => {
    const updated = tasks.map(t => 
      t.id === taskId ? { ...t, status: 'rejected' as const } : t
    );
    setTasks(updated);
    onUpdateMeetingTasks(meeting.id, updated);
  };

  const handleStartEdit = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      assigneeName: task.assignee.name,
      dueDate: task.dueDate,
      priority: task.priority
    });
  };

  const handleSaveEdit = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          title: editForm.title,
          dueDate: editForm.dueDate,
          priority: editForm.priority,
          assignee: {
            ...t.assignee,
            name: editForm.assigneeName
          },
          status: 'modified' as const
        };
      }
      return t;
    });
    setTasks(updated);
    onUpdateMeetingTasks(meeting.id, updated);
    setEditingTaskId(null);
  };

  const handleApproveAll = () => {
    const updated: TaskItem[] = tasks.map(t => ({
      ...t,
      status: (t.status === 'rejected' ? 'rejected' : 'approved') as TaskItem['status']
    }));
    setTasks(updated);
    onUpdateMeetingTasks(meeting.id, updated);
  };

  const handleDispatchNotifications = () => {
    setDispatchSuccess(true);
    setTimeout(() => {
      setDispatchSuccess(false);
      onClose();
    }, 2200);
  };

  const approvedCount = tasks.filter(t => t.status === 'approved' || t.status === 'modified').length;
  const rejectedCount = tasks.filter(t => t.status === 'rejected').length;
  const pendingCount = tasks.filter(t => t.status === 'pending_approval').length;
  const approvalState = computeTaskApprovalStatus(tasks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
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
              Reunião: <span className="text-slate-200 font-medium">{meeting.title}</span> · A equipa <strong className="text-cyan-300">só recebe notificações</strong> após a sua autorização expressa.
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
          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Total: <strong className="text-white tabular-nums">{tasks.length}</strong>
            </span>
            <span>·</span>
            <span>
              Aprovadas: <strong className="text-emerald-400 tabular-nums">{approvedCount}</strong>
            </span>
            <span>·</span>
            <span>
              Pendentes: <strong className="text-amber-400 tabular-nums">{pendingCount}</strong>
            </span>
            <span>·</span>
            <span>
              Rejeitadas: <strong className="text-rose-400 tabular-nums">{rejectedCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAll}
              className="px-2.5 py-1 text-[11px] font-sans font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              Aprovar Todas Pendentes
            </button>
          </div>
        </div>

        {/* Task List (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {tasks.map((task, index) => {
            const isEditing = editingTaskId === task.id;

            return (
              <div 
                key={task.id}
                className={`p-4 rounded-xl border transition-all ${
                  task.status === 'approved' || task.status === 'modified'
                    ? 'bg-slate-950/60 border-emerald-500/30'
                    : task.status === 'rejected'
                    ? 'bg-slate-950/30 border-rose-900/30 opacity-60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isEditing ? (
                  /* INLINE EDIT MODE */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Título da Tarefa</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Responsável</label>
                        <input
                          type="text"
                          value={editForm.assigneeName}
                          onChange={(e) => setEditForm({ ...editForm, assigneeName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Prazo de Entrega</label>
                        <input
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Prioridade</label>
                        <select
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskItem['priority'] })}
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
                          <h4 className="text-sm font-semibold text-white">
                            {task.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges with Typographic Discipline */}
                      <div className="flex items-center gap-2 self-start shrink-0">
                        <span className={`text-[11px] font-semibold ${
                          task.priority === 'urgent' ? 'text-rose-400' :
                          task.priority === 'high' ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className={`text-[11px] font-medium ${
                          task.status === 'approved' ? 'text-emerald-400 font-semibold' :
                          task.status === 'modified' ? 'text-cyan-400 font-semibold' :
                          task.status === 'rejected' ? 'text-rose-400 line-through' :
                          'text-amber-300'
                        }`}>
                          {task.status === 'approved' ? 'Aprovada' :
                           task.status === 'modified' ? 'Editada & Aprovada' :
                           task.status === 'rejected' ? 'Rejeitada' :
                           'Aguardando Gestor'}
                        </span>
                      </div>
                    </div>

                    {/* Context Snippet (Proof from audio transcript) */}
                    {task.contextSnippet && (
                      <div className="my-2.5 p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-start gap-2">
                        <Quote className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className="italic text-[11px]">{task.contextSnippet}</span>
                      </div>
                    )}

                    {/* Assignee, Due Date & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-900">
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-slate-200 font-medium">{task.assignee.name}</span>
                          <span className="text-[11px] text-slate-500">({task.assignee.role})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Entrega: <strong className="text-slate-200 font-mono">{task.dueDate}</strong></span>
                        </div>
                        {task.estimatedHours && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedHours}h est.</span>
                          </div>
                        )}
                      </div>

                      {/* Manager Decision Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Editar tarefa ou reatribuir"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
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
                          onClick={() => handleApprove(task.id)}
                          className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                            task.status === 'approved' || task.status === 'modified'
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {task.status === 'approved' || task.status === 'modified' ? 'Aprovado' : 'Aprovar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer with Dispatch Action */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            {pendingCount > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Ainda tem <strong className="tabular-nums font-mono">{pendingCount}</strong> tarefa(s) pendente(s) de aprovação.
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
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Fechar
            </button>
            <button
              onClick={handleDispatchNotifications}
              disabled={dispatchSuccess || approvedCount === 0}
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
                  <span>Disparar Tarefas ({approvedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
