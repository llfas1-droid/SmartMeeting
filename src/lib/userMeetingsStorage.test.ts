import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMeetingFromTranscriptText,
  getUserStorageKey,
  loadUserMeetings,
  mergeExtractedTasks,
  saveUserMeetings,
} from './userMeetingsStorage.ts';

describe('userMeetingsStorage pure unit tests', () => {
  test('new accounts always start with an empty meetings array', () => {
    const memory = new Map<string, string>();
    const fakeStorage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
    };

    const joanaMeetings = loadUserMeetings('joana@empresa.com', fakeStorage);
    assert.deepEqual(joanaMeetings, []);
    assert.equal(getUserStorageKey('Joana@Empresa.com '), 'smartmeeting_user_meetings_v1:joana@empresa.com');
  });

  test('saveUserMeetings isolates meeting history per user email', () => {
    const memory = new Map<string, string>();
    const fakeStorage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
    };

    const joanaMeeting = buildMeetingFromTranscriptText({
      title: 'Alinhamento Produto',
      transcriptText: 'Joana: Vamos lançar na sexta.\nCarlos: Eu preparo o relatório.',
      managerName: 'Joana',
      managerEmail: 'joana@empresa.com',
    });

    saveUserMeetings('joana@empresa.com', [joanaMeeting], fakeStorage);

    assert.equal(loadUserMeetings('joana@empresa.com', fakeStorage).length, 1);
    assert.equal(loadUserMeetings('outro@empresa.com', fakeStorage).length, 0);
  });

  test('buildMeetingFromTranscriptText extracts both explicit tasks and natural speaker commitments', () => {
    const meeting = buildMeetingFromTranscriptText({
      title: 'Sync Semanal',
      transcriptText:
        'Joana: Precisamos validar o novo fluxo até quinta.\nCarlos: Eu preparo os testes amanhã.\nTarefa: Enviar ata final aos clientes',
      managerName: 'Joana',
      managerEmail: 'joana@empresa.com',
    });

    assert.equal(meeting.title, 'Sync Semanal');
    assert.equal(meeting.transcript?.length, 3);
    assert.equal(meeting.tasks.length, 3);
    assert.equal(meeting.tasks[0].assignee.name, 'Joana');
    assert.equal(meeting.tasks[1].assignee.name, 'Carlos');
    assert.equal(meeting.tasks[1].status, 'pending_approval');
    assert.equal(meeting.tasks[2].title, 'Enviar ata final aos clientes');
  });

  test('mergeExtractedTasks preserves approved/rejected tasks and avoids duplicates', () => {
    const initial = buildMeetingFromTranscriptText({
      title: 'Sync',
      transcriptText: 'Carlos: Eu preparo os testes amanhã.',
    });
    const approvedExisting = [{ ...initial.tasks[0], status: 'approved' as const }];
    const incoming = [
      { ...initial.tasks[0], id: 'dup', status: 'pending_approval' as const },
      { ...initial.tasks[0], id: 'new_1', title: 'Publicar especificação da API' },
    ];

    const merged = mergeExtractedTasks(approvedExisting, incoming);
    assert.equal(merged.length, 2);
    assert.equal(merged[0].status, 'approved');
    assert.equal(merged[1].title, 'Publicar especificação da API');
  });
});
