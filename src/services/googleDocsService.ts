import { MeetingRecording } from '../types/index.ts';

export interface ExportedGoogleDoc {
  id: string;
  title: string;
  webViewLink: string;
  createdTime?: string;
}

// Create a Google Doc with structured meeting minutes
export async function createMeetingGoogleDoc(
  accessToken: string,
  meeting: MeetingRecording
): Promise<ExportedGoogleDoc> {
  const docTitle = `SmartMeeting - Ata: ${meeting.title} (${meeting.date})`;

  // 1. Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle,
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Erro ao criar documento no Google Docs (${createRes.status}): ${errorText}`);
  }

  const createdDoc = await createRes.json();
  const documentId = createdDoc.documentId;

  // 2. Build structured meeting text content
  const lines: string[] = [];

  lines.push(`SMARTMEETING · ATA EXECUTIVA DE REUNIÃO`);
  lines.push(`=====================================================\n`);
  lines.push(`Reunião: ${meeting.title}`);
  lines.push(`Data: ${meeting.date}`);
  lines.push(`Ficheiro de Áudio: ${meeting.fileName} (${(meeting.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB)`);
  lines.push(`Governança: Validação Efetuada · Sem Bots Intrusivos na Chamada\n`);

  lines.push(`1. RESUMO EXECUTIVO`);
  lines.push(`-----------------------------------------------------`);
  lines.push(`${meeting.summary.executiveSummary}\n`);

  lines.push(`2. DECISÕES-CHAVE TOMADAS`);
  lines.push(`-----------------------------------------------------`);
  meeting.summary.keyDecisions.forEach((dec, idx) => {
    lines.push(`  ${idx + 1}. ${dec}`);
  });
  lines.push('\n');

  lines.push(`3. BLOQUEIOS E RISCOS OPERACIONAIS`);
  lines.push(`-----------------------------------------------------`);
  meeting.summary.blockersAndRisks.forEach((risk, idx) => {
    lines.push(`  • ${risk}`);
  });
  lines.push('\n');

  lines.push(`4. MAPA DE DISTRIBUIÇÃO DE TAREFAS`);
  lines.push(`-----------------------------------------------------`);
  meeting.tasks.forEach((task, idx) => {
    lines.push(`  [${idx + 1}] ${task.title}`);
    lines.push(`      • Responsável: ${task.assignee.name} (${task.assignee.role}) - ${task.assignee.email}`);
    lines.push(`      • Prazo de Entrega: ${task.dueDate} | Prioridade: ${task.priority.toUpperCase()}`);
    if (task.estimatedHours) {
      lines.push(`      • Estimativa: ${task.estimatedHours} horas`);
    }
    lines.push(`      • Estado de Validação: ${task.status.toUpperCase()}`);
    if (task.contextSnippet) {
      lines.push(`      • Contexto Identificado: "${task.contextSnippet}"`);
    }
    lines.push('');
  });

  if (meeting.transcript && meeting.transcript.length > 0) {
    lines.push(`5. EXTRATO DE TRANSCRIÇÃO DIARIZADA`);
    lines.push(`-----------------------------------------------------`);
    meeting.transcript.forEach(t => {
      lines.push(`  [${t.time}] ${t.speaker}: ${t.text}`);
    });
    lines.push('\n');
  }

  lines.push(`Gerado automaticamente pelo SmartMeeting AI Platform · ${new Date().toLocaleString('pt-PT')}`);

  const fullText = lines.join('\n');

  // 3. Insert text into document via batchUpdate
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: fullText,
          },
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    console.warn('Document batch update notice:', await updateRes.text());
  }

  const webViewLink = `https://docs.google.com/document/d/${documentId}/edit`;

  return {
    id: documentId,
    title: docTitle,
    webViewLink,
    createdTime: new Date().toISOString(),
  };
}

// List existing meeting docs from Google Drive
export async function listMeetingGoogleDocs(accessToken: string): Promise<ExportedGoogleDoc[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.document' and name contains 'SmartMeeting' and trashed=false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,createdTime)&pageSize=10`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      title: f.name,
      webViewLink: f.webViewLink || `https://docs.google.com/document/d/${f.id}/edit`,
      createdTime: f.createdTime,
    }));
  } catch (err) {
    console.warn('Could not list drive docs:', err);
    return [];
  }
}
