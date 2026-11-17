import React, { useEffect, useRef, useState } from 'react';
import type { MeetingRecording } from '../../types/index.ts';
import type { ChatHistoryEntry } from '../../lib/meetingChatContext.ts';
import {
  AlertCircle,
  Bot,
  ListTodo,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';

interface MeetingAssistantPanelProps {
  meeting: MeetingRecording | null;
  variant?: 'inline' | 'drawer';
  onClose?: () => void;
  onRequestLoadMeeting?: () => void;
  onSyncTasksFromAI?: () => Promise<void>;
  isSyncingTasks?: boolean;
}

interface UIMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'Quais foram as principais decisões?',
  'Que tarefas ficaram pendentes?',
  'O que foi discutido sobre prazos?',
] as const;

export const MeetingAssistantPanel: React.FC<MeetingAssistantPanelProps> = ({
  meeting,
  variant = 'inline',
  onClose,
  onRequestLoadMeeting,
  onSyncTasksFromAI,
  isSyncingTasks = false,
}) => {
  const [messagesByMeeting, setMessagesByMeeting] = useState<Record<string, UIMessage[]>>({});
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const activeMessages: UIMessage[] = meeting ? messagesByMeeting[meeting.id] ?? [] : [];
  const isDisabled = !meeting || isLoading;

  useEffect(() => {
    setErrorMessage(null);
    setFailedQuestion(null);
  }, [meeting?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [activeMessages.length, isLoading, errorMessage]);

  const sendQuestion = async (rawQuestion: string) => {
    if (!meeting || isLoading) return;
    const question = rawQuestion.trim();
    if (!question) return;

    const meetingId = meeting.id;
    const isRetry = failedQuestion === question;
    const existingMessages = messagesByMeeting[meetingId] ?? [];
    const priorMessages = isRetry
      ? existingMessages.slice(0, -1)
      : existingMessages;
    const historyPayload: ChatHistoryEntry[] = priorMessages.map((msg) => ({
      role: msg.role,
      text: msg.text,
    }));

    if (!isRetry) {
      const nowLabel = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const userMsg: UIMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'user',
        text: question,
        timestamp: nowLabel,
      };

      setMessagesByMeeting((prev) => ({
        ...prev,
        [meetingId]: [...(prev[meetingId] ?? []), userMsg],
      }));
    }

    setInputText('');
    setErrorMessage(null);
    setFailedQuestion(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/meeting-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          meeting,
          history: historyPayload,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || !data.reply) {
        throw new Error(
          data.error ||
            'Não foi possível obter uma resposta do Assistente da Reunião. Tente novamente.'
        );
      }

      const assistantMsg: UIMessage = {
        id: `model-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessagesByMeeting((prev) => ({
        ...prev,
        [meetingId]: [...(prev[meetingId] ?? []), assistantMsg],
      }));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erro de comunicação ao analisar a reunião.';
      setErrorMessage(msg);
      setFailedQuestion(question);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuestion(inputText);
  };

  const handleClearChat = () => {
    if (!meeting || isLoading) return;
    setMessagesByMeeting((prev) => ({
      ...prev,
      [meeting.id]: [],
    }));
    setErrorMessage(null);
  };

  const isDrawer = variant === 'drawer';

  return (
    <section
      aria-label="Assistente da Reunião"
      className={
        isDrawer
          ? 'flex flex-col h-full bg-slate-900'
          : 'mt-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col'
      }
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Assistente da Reunião</span>
            </h4>
            <p className="text-xs text-slate-400 truncate">
              {meeting
                ? `Contexto ativo: ${meeting.title}`
                : 'Aguarda carregamento de uma reunião para iniciar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {meeting && onSyncTasksFromAI && (
            <button
              type="button"
              onClick={() => void onSyncTasksFromAI()}
              disabled={isSyncingTasks || isLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-colors disabled:opacity-40"
            >
              {isSyncingTasks ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ListTodo className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isSyncingTasks ? 'A sincronizar...' : 'Atualizar Mapa de Tarefas'}
              </span>
            </button>
          )}
          {meeting && activeMessages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              disabled={isLoading}
              aria-label="Limpar histórico de conversa"
              title="Limpar conversa"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar conversa</span>
            </button>
          )}
          {isDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar Assistente da Reunião"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages History Area */}
      <div
        ref={messagesContainerRef}
        data-testid="meeting-chat-messages"
        className={
          isDrawer
            ? 'flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-900/60'
            : meeting
            ? 'p-5 h-80 overflow-y-auto space-y-4 text-xs bg-slate-900/40'
            : 'p-5 h-56 overflow-y-auto space-y-4 text-xs bg-slate-900/40'
        }
      >
        {!meeting ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-6">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-200 max-w-md">
              Nenhuma reunião carregada
            </p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-md leading-relaxed">
              Carregue ou processe primeiro um ficheiro de reunião (áudio, vídeo ou transcrição) para ativar o Assistente da Reunião e colocar dúvidas sobre os tópicos abordados.
            </p>
            {onRequestLoadMeeting && (
              <button
                type="button"
                onClick={onRequestLoadMeeting}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Carregar ou Gravar Reunião</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grounded Welcome Message */}
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="max-w-[85%] rounded-xl p-3.5 bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed">
                <p>
                  Olá! Estou conectado ao histórico completo da reunião{' '}
                  <span className="font-semibold text-white">"{meeting.title}"</span>.
                </p>
                <p className="mt-1.5 text-slate-400">
                  Pode perguntar sobre decisões tomadas, tarefas pendentes, responsáveis ou prazos. Respondo exclusivamente com base no conteúdo registado nesta reunião.
                </p>
              </div>
            </div>

            {activeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-cyan-400 text-slate-950 font-medium shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  <div>{msg.text}</div>
                  <div
                    className={`text-[10px] mt-1.5 font-mono ${
                      msg.role === 'user' ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2.5 justify-start py-1"
              >
                <div className="w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-medium">
                  A analisar a reunião...
                </div>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200"
              >
                <div className="flex items-start gap-2.5 flex-1">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">{errorMessage}</div>
                </div>
                {failedQuestion && (
                  <button
                    type="button"
                    onClick={() => void sendQuestion(failedQuestion)}
                    className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-[11px] font-semibold text-rose-100 shrink-0 transition-colors"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 3 Suggested Quick-Question Buttons */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500 mr-1">
          Sugestões:
        </span>
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            disabled={isDisabled}
            onClick={() => void sendQuestion(question)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
          >
            {question}
          </button>
        ))}
      </div>

      {/* Natural Language Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2.5"
      >
        <label htmlFor={`meeting-chat-input-${variant}`} className="sr-only">
          Perguntar ao Assistente da Reunião
        </label>
        <input
          id={`meeting-chat-input-${variant}`}
          type="text"
          value={inputText}
          disabled={isDisabled}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            meeting
              ? 'Escreva a sua dúvida sobre a reunião (ex: quem ficou responsável pelo backend?)...'
              : 'Carregue uma reunião para ativar o assistente...'
          }
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isDisabled || !inputText.trim()}
          aria-label="Enviar pergunta"
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-semibold rounded-lg transition-colors shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </section>
  );
};
