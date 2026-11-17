import type { MeetingRecording } from '../types/index.ts';

export function buildMeetingContextText(meeting: MeetingRecording): string {
  const decisionsList = meeting.summary.keyDecisions.length > 0
    ? meeting.summary.keyDecisions.map((d, i) => `${i + 1}. ${d}`).join('\n')
    : 'Nenhuma decisão registada.';

  const blockersList = meeting.summary.blockersAndRisks.length > 0
    ? meeting.summary.blockersAndRisks.map((b, i) => `${i + 1}. ${b}`).join('\n')
    : 'Nenhum bloqueio ou risco registado.';

  const nextStepsList = meeting.summary.nextSteps.length > 0
    ? meeting.summary.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : 'Nenhum próximo passo registado.';

  const tasksList = meeting.tasks.length > 0
    ? meeting.tasks
        .map((t, i) => {
          const estadoMap: Record<string, string> = {
            pending_approval: 'Pendente de aprovação',
            approved: 'Aprovada',
            modified: 'Editada e aprovada',
            rejected: 'Rejeitada',
          };
          const estadoLabel = estadoMap[t.status] || t.status;
          const parts = [
            `[Tarefa ${i + 1}] ${t.title}`,
            `  - Descrição: ${t.description}`,
            `  - Responsável: ${t.assignee.name} (${t.assignee.role})`,
            `  - Prazo de entrega: ${t.dueDate}`,
            `  - Prioridade: ${t.priority}`,
            `  - Estado atual: ${estadoLabel}`,
          ];
          if (t.estimatedHours !== undefined) {
            parts.push(`  - Estimativa: ${t.estimatedHours}h`);
          }
          if (t.contextSnippet) {
            parts.push(`  - Trecho de origem: ${t.contextSnippet}`);
          }
          return parts.join('\n');
        })
        .join('\n\n')
    : 'Nenhuma tarefa extraída.';

  const transcriptText = meeting.transcript && meeting.transcript.length > 0
    ? meeting.transcript
        .map(entry => `[${entry.time}] ${entry.speaker}: ${entry.text}`)
        .join('\n')
    : 'Transcrição literal indisponível.';

  return [
    `TÍTULO DA REUNIÃO: ${meeting.title}`,
    `DATA: ${meeting.date}`,
    `FICHEIRO: ${meeting.fileName}`,
    '',
    'RESUMO EXECUTIVO:',
    meeting.summary.executiveSummary,
    '',
    'DECISÕES-CHAVE:',
    decisionsList,
    '',
    'BLOQUEIOS E RISCOS:',
    blockersList,
    '',
    'PRÓXIMOS PASSOS:',
    nextStepsList,
    '',
    'MAPA DE DISTRIBUIÇÃO DE TAREFAS:',
    tasksList,
    '',
    'TRANSCRIÇÃO COMPLETA DA REUNIÃO:',
    transcriptText,
  ].join('\n');
}

export function buildMeetingSystemInstruction(meeting: MeetingRecording): string {
  const contextText = buildMeetingContextText(meeting);

  return [
    'És o Assistente Conversacional do SmartMeeting. A tua única função é esclarecer dúvidas dos utilizadores em linguagem natural sobre o histórico da reunião fornecida abaixo.',
    '',
    'REGRAS ESTRITAS DE COMPORTAMENTO:',
    '1. Baseia todas as tuas respostas exclusivamente na transcrição, resumo, decisões, bloqueios e tarefas desta reunião.',
    '2. Nunca inventes factos, prazos, nomes, valores ou decisões que não estejam explicitamente registados no contexto da reunião.',
    '3. Se o utilizador perguntar sobre qualquer assunto, pessoa ou detalhe que não foi mencionado na reunião, responde educadamente e de forma exata: "Esse tópico não foi abordado no histórico desta reunião."',
    '4. Sempre que possível, indica quem mencionou a informação e a marcação de tempo (timestamp) correspondente da transcrição.',
    '5. Responde de forma clara, objetiva, profissional e em Português.',
    '',
    '=== HISTÓRICO DA REUNIÃO ===',
    contextText,
    '=== FIM DO HISTÓRICO ===',
  ].join('\n');
}
