import React, { useState } from 'react';
import { MeetingRecording } from '../../types/index.ts';
import { X, Send, Bot, User, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';

interface MeetingChatbotDrawerProps {
  meeting: MeetingRecording;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const MeetingChatbotDrawer: React.FC<MeetingChatbotDrawerProps> = ({
  meeting,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Olá! Sou o assistente de contexto do SmartMeeting para a reunião "${meeting.title}". Pode perguntar-me sobre prazos acordados, decisões técnicas ou responsabilidades discutidas pelos participantes.`,
      timestamp: 'Agora'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputText.toLowerCase();
    setInputText('');
    setIsTyping(true);

    // Smart contextual response based on actual meeting data
    setTimeout(() => {
      let reply = '';

      if (query.includes('prazo') || query.includes('data') || query.includes('quando') || query.includes('entrega')) {
        const tasksSummary = meeting.tasks.map(t => `• ${t.title}: Entrega em ${t.dueDate} por ${t.assignee.name}`).join('\n');
        reply = `De acordo com as decisões registadas na reunião, estes foram os prazos estipulados:\n\n${tasksSummary}\n\nNota de Governança: Lembre-se de aprovar no Mapa de Tarefas antes do disparo das notificações.`;
      } else if (query.includes('bernardo') || query.includes('backend') || query.includes('api') || query.includes('adyen') || query.includes('pagamento')) {
        reply = `O Bernardo Costa (Senior Backend) ficou encarregue de desenhar o adapter unificado para Stripe e Adyen com fallback para latências superiores a 800ms. O prazo inicial discutido foi 27/10/2026.`;
      } else if (query.includes('margarida') || query.includes('qa') || query.includes('teste')) {
        reply = `A Margarida Vale (QA Lead) mencionou que só iniciará os testes E2E e simulações de 3D Secure após a definição dos contratos de API pelo Bernardo.`;
      } else if (query.includes('bloqueio') || query.includes('risco')) {
        reply = `Os principais riscos levantados foram:\n1. ${meeting.summary.blockersAndRisks.join('\n2. ')}`;
      } else if (query.includes('decis') || query.includes('acordo') || query.includes('definido')) {
        reply = `As decisões-chave aprovadas foram:\n${meeting.summary.keyDecisions.map(d => `• ${d}`).join('\n')}`;
      } else {
        reply = `Com base na transcrição da reunião, foram discutidos ${meeting.tasks.length} itens de ação principais com o objetivo de manter a governança ágil. Quer que detalhe os pontos de algum membro da equipa em específico?`;
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Chatbot de Histórico
            </h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {meeting.title}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-cyan-500 text-slate-950 font-medium'
                  : 'bg-slate-950 border border-slate-800 text-slate-200'
              }`}
            >
              {msg.text}
              <div className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-slate-800' : 'text-slate-500'}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
            <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="italic">A consultar a transcrição da reunião...</span>
          </div>
        )}
      </div>

      {/* Suggested quick questions */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex gap-2 overflow-x-auto text-[11px]">
        <button
          onClick={() => setInputText('Quais são os prazos de entrega acordados?')}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap shrink-0 transition-colors"
        >
          Quais são os prazos?
        </button>
        <button
          onClick={() => setInputText('O que ficou atribuído ao Bernardo?')}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap shrink-0 transition-colors"
        >
          Tarefas do Bernardo
        </button>
        <button
          onClick={() => setInputText('Quais os bloqueios principais?')}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap shrink-0 transition-colors"
        >
          Bloqueios e Riscos
        </button>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pergunte sobre qualquer momento da reunião..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
