import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  buildMeetingContextText,
  buildMeetingChatSystemInstruction,
  validateChatPayload,
} from './meetingChatContext.ts';
import type { MeetingRecording } from '../types/index.ts';

const sampleMeeting: MeetingRecording = {
  id: 'rec-test-1',
  title: 'Sprint 44 Planning',
  date: '2026-11-17',
  durationSeconds: 900,
  fileType: 'audio/mp3',
  fileName: 'sprint44.mp3',
  fileSizeBytes: 1024 * 1024,
  managerApprovalStatus: 'pending',
  summary: {
    executiveSummary: 'Alinhamento de pagamentos e prazos.',
    keyDecisions: ['Usar Stripe e Adyen com fallback.'],
    blockersAndRisks: ['Sandbox Adyen indisponível até quarta.'],
    nextSteps: ['Validar mapa de tarefas.'],
  },
  tasks: [
    {
      id: 't1',
      title: 'Implementar adapter de pagamentos',
      description: 'Suporte multi-moeda.',
      assignee: {
        name: 'Bernardo Costa',
        email: 'bernardo@empresa.com',
        role: 'Backend Engineer',
      },
      dueDate: '2026-11-20',
      priority: 'high',
      status: 'pending_approval',
      contextSnippet: 'Bernardo confirmou entrega na sexta.',
    },
  ],
  transcript: [
    {
      speaker: 'Bernardo',
      time: '01:15',
      text: 'Consigo entregar o adapter até dia 20.',
    },
  ],
};

describe('meetingChatContext pure unit tests', () => {
  test('buildMeetingContextText serializes summary, tasks, and transcript', () => {
    const ctx = buildMeetingContextText(sampleMeeting);
    assert.match(ctx, /Sprint 44 Planning/);
    assert.match(ctx, /Alinhamento de pagamentos e prazos/);
    assert.match(ctx, /Usar Stripe e Adyen com fallback/);
    assert.match(ctx, /Bernardo Costa/);
    assert.match(ctx, /2026-11-20/);
    assert.match(ctx, /\[01:15\] Bernardo: Consigo entregar o adapter até dia 20\./);
  });

  test('buildMeetingChatSystemInstruction enforces anti-hallucination rules', () => {
    const instruction = buildMeetingChatSystemInstruction(sampleMeeting);
    assert.match(instruction, /ANTI-ALUCINAÇÃO/);
    assert.match(instruction, /EXCLUSIVAMENTE com base nos factos/);
    assert.match(instruction, /não foi abordado na reunião/);
    assert.match(instruction, /Sprint 44 Planning/);
  });

  test('validateChatPayload rejects empty messages or missing meetings', () => {
    const emptyMsg = validateChatPayload({ message: '   ', meeting: sampleMeeting });
    assert.strictEqual(emptyMsg.valid, false);

    const missingMeeting = validateChatPayload({ message: 'Quais as decisões?' });
    assert.strictEqual(missingMeeting.valid, false);

    const valid = validateChatPayload({
      message: 'Quais foram as principais decisões?',
      meeting: sampleMeeting,
      history: [
        { role: 'user', text: 'Olá' },
        { role: 'model', text: 'Olá! Em que posso ajudar?' },
      ],
    });
    assert.strictEqual(valid.valid, true);
    if (valid.valid) {
      assert.strictEqual(valid.history.length, 2);
      assert.strictEqual(valid.message, 'Quais foram as principais decisões?');
    }
  });
});
