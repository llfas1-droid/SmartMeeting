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

  const actionPrefixes = /^(todo:|tarefa:|ação:|acao:|- \[ \])/i;
  const tasks: TaskItem[] = lines
    .filter((l) => actionPrefixes.test(l))
    .map((l, idx) => ({
      id: `task_${Date.now()}_${idx + 1}`,
      title: l.replace(actionPrefixes, '').trim(),
      description: 'Extraído diretamente do texto da reunião carregado.',
      assignee: {
        name: params.managerName?.trim() || 'Equipa',
        email: params.managerEmail?.trim() || 'equipa@empresa.com',
        role: 'Responsável',
      },
      dueDate: today,
      priority: 'medium',
      status: 'pending_approval',
      contextSnippet: l,
    }));

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
    managerApprovalStatus: tasks.length > 0 ? 'pending' : 'fully_approved',
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
          : ['Colocar dúvidas ao Assistente da Reunião para extrair detalhes.'],
    },
    tasks,
    transcript,
  };
}
