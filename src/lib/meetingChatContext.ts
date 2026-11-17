import type { MeetingRecording } from '../types/index.ts';

export interface ChatHistoryEntry {
  role: 'user' | 'model';
  text: string;
}

export function buildMeetingContextText(meeting: MeetingRecording): string {
  const lines: string[] = [];

  lines.push(`TÍTULO DA REUNIÃO: ${meeting.title}`);
  lines.push(`DATA: ${meeting.date}`);
  lines.push(`FICHEIRO: ${meeting.fileName}`);
  lines.push('');

  lines.push('RESUMO EXECUTIVO:');
  lines.push(meeting.summary.executiveSummary || 'Não disponível.');
  lines.push('');

  lines.push('DECISÕES-CHAVE:');
  if (meeting.summary.keyDecisions.length > 0) {
    meeting.summary.keyDecisions.forEach((dec, idx) => {
      lines.push(`${idx + 1}. ${dec}`);
    });
  } else {
    lines.push('Nenhuma decisão registada.');
  }
  lines.push('');

  lines.push('BLOQUEIOS E RISCOS:');
  if (meeting.summary.blockersAndRisks.length > 0) {
    meeting.summary.blockersAndRisks.forEach((risk, idx) => {
      lines.push(`${idx + 1}. ${risk}`);
    });
  } else {
    lines.push('Nenhum bloqueio registado.');
  }
  lines.push('');

  lines.push('PRÓXIMOS PASSOS:');
  if (meeting.summary.nextSteps.length > 0) {
    meeting.summary.nextSteps.forEach((step, idx) => {
      lines.push(`${idx + 1}. ${step}`);
    });
  } else {
    lines.push('Nenhum próximo passo registado.');
  }
  lines.push('');

  lines.push('MAPA DE TAREFAS ATRIBUÍDAS:');
  if (meeting.tasks.length > 0) {
    meeting.tasks.forEach((task, idx) => {
      const statusLabel =
        task.status === 'approved'
          ? 'Aprovada'
          : task.status === 'modified'
          ? 'Editada e Aprovada'
          : task.status === 'rejected'
          ? 'Rejeitada'
          : 'Pendente de aprovação';

      lines.push(
        `${idx + 1}. [${task.priority.toUpperCase()}] ${task.title} | Responsável: ${task.assignee.name} (${task.assignee.role}) | Prazo: ${task.dueDate} | Estado: ${statusLabel}`
      );
      if (task.description) {
        lines.push(`   Descrição: ${task.description}`);
      }
      if (task.estimatedHours !== undefined) {
        lines.push(`   Estimativa: ${task.estimatedHours} horas`);
      }
      if (task.contextSnippet) {
        lines.push(`   Trecho de contexto: ${task.contextSnippet}`);
      }
    });
  } else {
    lines.push('Nenhuma tarefa identificada.');
  }
  lines.push('');

  lines.push('TRANSCRIÇÃO DA REUNIÃO:');
  if (meeting.transcript && meeting.transcript.length > 0) {
    meeting.transcript.forEach((entry) => {
      lines.push(`[${entry.time}] ${entry.speaker}: ${entry.text}`);
    });
  } else {
    lines.push('Transcrição detalhada não disponível.');
  }

  return lines.join('\n');
}

export function buildMeetingChatSystemInstruction(meeting: MeetingRecording): string {
  const contextText = buildMeetingContextText(meeting);

  return [
    'És o Assistente da Reunião do SmartMeeting, um especialista em produtividade ágil.',
    'A tua função é responder a perguntas dos utilizadores sobre a reunião atualmente carregada.',
    '',
    'REGRAS ESTRITAS DE RESPOSTA (ANTI-ALUCINAÇÃO):',
    '1. Responde EXCLUSIVAMENTE com base nos factos presentes no CONTEXTO DA REUNIÃO abaixo.',
    '2. NÃO inventes nomes, datas, prazos, decisões, métricas ou informações que não estejam explicitamente no contexto.',
    '3. Se o utilizador perguntar algo que não foi discutido ou mencionado nesta reunião, responde educadamente em Português que esse tema não foi abordado na reunião carregada e sugere perguntar sobre os tópicos, decisões ou tarefas registadas.',
    '4. Sempre que possível, cita os intervenientes, horários (timestamps) ou tarefas específicas para fundamentar a resposta.',
    '5. Responde sempre em Português claro, objetivo e estruturado.',
    '',
    '=== CONTEXTO DA REUNIÃO ===',
    contextText,
    '=== FIM DO CONTEXTO ===',
  ].join('\n');
}

export function validateChatPayload(
  body: unknown
):
  | { valid: true; message: string; meeting: MeetingRecording; history: ChatHistoryEntry[] }
  | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corpo da requisição inválido.' };
  }

  const payload = body as Record<string, unknown>;
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!message) {
    return { valid: false, error: 'A pergunta não pode estar vazia.' };
  }

  const meeting = payload.meeting as MeetingRecording | undefined;
  if (!meeting || typeof meeting !== 'object' || !meeting.title || !meeting.summary) {
    return { valid: false, error: 'Nenhuma reunião válida foi fornecida como contexto.' };
  }

  const rawHistory = Array.isArray(payload.history) ? payload.history : [];
  const history: ChatHistoryEntry[] = rawHistory
    .filter(
      (item): item is ChatHistoryEntry =>
        Boolean(item) &&
        typeof item === 'object' &&
        ((item as ChatHistoryEntry).role === 'user' || (item as ChatHistoryEntry).role === 'model') &&
        typeof (item as ChatHistoryEntry).text === 'string' &&
        (item as ChatHistoryEntry).text.trim().length > 0
    )
    .map((item) => ({
      role: item.role,
      text: item.text.trim(),
    }));

  return { valid: true, message, meeting, history };
}
