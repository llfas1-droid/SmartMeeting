import type { MeetingRecording, TaskItem } from '../types/index.ts';

const STORAGE_PREFIX = 'smartmeeting_user_meetings_v1:';

export function getUserStorageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

export function loadUserMeetings(
  email: string,
  storage?: Pick<Storage, 'getItem'> | null
): MeetingRecording[] {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!targetStorage) return [];

  try {
    const raw = targetStorage.getItem(getUserStorageKey(normalized));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MeetingRecording[]) : [];
  } catch {
    return [];
  }
}

export function saveUserMeetings(
  email: string,
  meetings: MeetingRecording[],
  storage?: Pick<Storage, 'setItem'> | null
): void {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!targetStorage) return;

  try {
    targetStorage.setItem(getUserStorageKey(normalized), JSON.stringify(meetings));
  } catch {
    // Ignore storage quota errors safely
  }
}

const EXPLICIT_TASK_PREFIX = /^(todo:|tarefa:|ação:|acao:|- \[ \])/i;
const COMMITMENT_PATTERN =
  /\b(eu\s+(preparo|faço|faco|trato|envio|atualizo|crio|reviso|valido|configuro|assumo|vou)|vou\s+(preparar|fazer|enviar|atualizar|criar|rever|validar|configurar|entregar|finalizar)|precisamos\s+(de\s+)?(validar|fechar|enviar|atualizar|criar|rever|configurar|finalizar)|fic[ao]u?\s+respons[áa]vel|respons[áa]vel\s+por|assumo\s+|ficou\s+combinado|entregar\s+at[ée])\b/i;

function inferPriorityFromLine(line: string): TaskItem['priority'] {
  if (/\b(urgente|cr[íi]tico|imediato|hoje|bloqueio)\b/i.test(line)) {
    return 'urgent';
  }
  if (/\b(amanh[ãa]|priorit[áa]rio|alta|importante|quinta|sexta)\b/i.test(line)) {
    return 'high';
  }
  return 'medium';
}

export function extractTasksFromTranscriptLines(
  lines: string[],
  managerName?: string,
  managerEmail?: string
): TaskItem[] {
  const today = new Date().toISOString().split('T')[0];
  const tasks: TaskItem[] = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) return;

    const isExplicit = EXPLICIT_TASK_PREFIX.test(line);
    const isCommitment = COMMITMENT_PATTERN.test(line);
    if (!isExplicit && !isCommitment) return;

    const colonIdx = line.indexOf(':');
    const hasSpeaker = !isExplicit && colonIdx > 1 && colonIdx < 40;
    const speaker = hasSpeaker ? line.slice(0, colonIdx).trim() : '';
    const rawBody = isExplicit
      ? line.replace(EXPLICIT_TASK_PREFIX, '').trim()
      : hasSpeaker
      ? line.slice(colonIdx + 1).trim()
      : line;

    if (!rawBody) return;

    const assigneeName = speaker || managerName?.trim() || 'Equipa';
    const assigneeEmail =
      speaker && managerName && speaker.toLowerCase() === managerName.trim().toLowerCase()
        ? managerEmail?.trim() || 'equipa@empresa.com'
        : speaker
        ? `${speaker.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@empresa.com`
        : managerEmail?.trim() || 'equipa@empresa.com';

    const cleanTitle = rawBody.replace(/\.$/, '');
    tasks.push({
      id: `task_${Date.now()}_${idx + 1}`,
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      description: 'Extraído da transcrição da reunião para aprovação no Mapa de Tarefas.',
      assignee: {
        name: assigneeName,
        email: assigneeEmail,
        role: speaker ? 'Participante' : 'Responsável',
      },
      dueDate: today,
      priority: inferPriorityFromLine(line),
      status: 'pending_approval',
      contextSnippet: line,
    });
  });

  return tasks;
}

export function mergeExtractedTasks(
  existing: TaskItem[],
  incoming: TaskItem[]
): TaskItem[] {
  const normalizedExistingTitles = new Set(
    existing.map((t) => t.title.trim().toLowerCase())
  );
  const newOnes = incoming.filter(
    (t) => !normalizedExistingTitles.has(t.title.trim().toLowerCase())
  );
  return [...existing, ...newOnes];
}

export function buildMeetingFromTranscriptText(params: {
  title?: string;
  transcriptText: string;
  managerName?: string;
  managerEmail?: string;
}): MeetingRecording {
  const cleaned = params.transcriptText.trim();
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const meetingId = `rec_text_${Date.now()}`;
  const today = new Date().toISOString().split('T')[0];

  const transcript: NonNullable<MeetingRecording['transcript']> = lines.map((line, idx) => {
    const colonIdx = line.indexOf(':');
    const minutes = Math.floor(idx * 1.5);
    const secs = ((idx * 30) % 60).toString().padStart(2, '0');
    const timeLabel = `${minutes.toString().padStart(2, '0')}:${secs}`;

    if (colonIdx > 1 && colonIdx < 40) {
      return {
        speaker: line.slice(0, colonIdx).trim(),
        time: timeLabel,
        text: line.slice(colonIdx + 1).trim(),
      };
    }

    return {
      speaker: params.managerName?.trim() || 'Participante',
      time: timeLabel,
      text: line,
    };
  });

  const tasks = extractTasksFromTranscriptLines(
    lines,
    params.managerName,
    params.managerEmail
  );

  const firstPreview = lines.slice(0, 2).join(' ');
  const summaryPreview =
    firstPreview.length > 220 ? `${firstPreview.slice(0, 217)}...` : firstPreview;

  return {
    id: meetingId,
    title: params.title?.trim() || `Reunião em Texto (${today})`,
    date: today,
    durationSeconds: Math.max(60, lines.length * 45),
    fileType: 'audio/mp3',
    fileName: 'transcricao_texto.txt',
    fileSizeBytes: new TextEncoder().encode(cleaned).length,
    managerApprovalStatus: 'pending',
    summary: {
      executiveSummary:
        summaryPreview || 'Transcrição textual carregada e pronta para consulta no Assistente da Reunião.',
      keyDecisions:
        lines.length > 0
          ? [`Conteúdo registado com ${lines.length} blocos de diálogo.`]
          : ['Transcrição pronta para consulta.'],
      blockersAndRisks: [],
      nextSteps:
        tasks.length > 0
          ? ['Rever e aprovar as tarefas identificadas antes de notificar a equipa.']
          : ['Extrair ou adicionar tarefas no Mapa de Tarefas para distribuição.'],
    },
    tasks,
    transcript,
  };
}
