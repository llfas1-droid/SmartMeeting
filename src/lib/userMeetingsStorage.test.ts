import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMeetingFromTranscriptText,
  getUserStorageKey,
  loadUserMeetings,
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

  test('buildMeetingFromTranscriptText parses speakers and explicit tasks cleanly', () => {
    const meeting = buildMeetingFromTranscriptText({
      title: 'Sync Semanal',
      transcriptText:
        'Joana: Fechamos a entrega para quinta.\nTarefa: Enviar ata final aos clientes',
      managerName: 'Joana',
      managerEmail: 'joana@empresa.com',
    });

    assert.equal(meeting.title, 'Sync Semanal');
    assert.equal(meeting.transcript?.length, 2);
    assert.equal(meeting.transcript?.[0].speaker, 'Joana');
    assert.equal(meeting.tasks.length, 1);
    assert.equal(meeting.tasks[0].title, 'Enviar ata final aos clientes');
    assert.equal(meeting.tasks[0].status, 'pending_approval');
  });
});
