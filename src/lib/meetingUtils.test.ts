import { test, describe } from 'node:test';
import assert from 'node:assert';
import { 
  validateMediaFile, 
  evaluatePasswordStrength, 
  computeTaskApprovalStatus,
  computeTaskMapMetrics,
  formatDuration,
  formatFileSize 
} from './meetingUtils.ts';
import type { TaskItem } from '../types/index.ts';

describe('meetingUtils pure unit tests', () => {
  test('validateMediaFile correctly validates allowed formats', () => {
    const validMp3 = validateMediaFile({ name: 'meeting_sprint_42.mp3', size: 15 * 1024 * 1024 });
    assert.strictEqual(validMp3.valid, true);
    assert.strictEqual(validMp3.detectedFormat, 'MP3');

    const validWav = validateMediaFile({ name: 'board_sync.wav', size: 50 * 1024 * 1024 });
    assert.strictEqual(validWav.valid, true);
    assert.strictEqual(validWav.detectedFormat, 'WAV');

    const validMp4 = validateMediaFile({ name: 'screen_recording.mp4', size: 100 * 1024 * 1024 });
    assert.strictEqual(validMp4.valid, true);
    assert.strictEqual(validMp4.detectedFormat, 'MP4');

    const invalidPdf = validateMediaFile({ name: 'notes.pdf', size: 1024 });
    assert.strictEqual(invalidPdf.valid, false);
    assert.match(invalidPdf.error || '', /não suportado/);

    const zeroBytes = validateMediaFile({ name: 'empty.mp3', size: 0 });
    assert.strictEqual(zeroBytes.valid, false);

    const oversized = validateMediaFile({ name: 'huge.mp4', size: 600 * 1024 * 1024 });
    assert.strictEqual(oversized.valid, false);
    assert.match(oversized.error || '', /excede o limite/);
  });

  test('evaluatePasswordStrength validates corporate grade requirements', () => {
    const weak = evaluatePasswordStrength('abc');
    assert.strictEqual(weak.score, 0);
    assert.strictEqual(weak.label, 'Fraca');

    const moderate = evaluatePasswordStrength('Password123'); // len >= 8, upper, number, no special => 3
    assert.strictEqual(moderate.score, 3);
    assert.strictEqual(moderate.label, 'Boa');

    const strong = evaluatePasswordStrength('P@ssw0rdEnterprise!'); // all 4 criteria
    assert.strictEqual(strong.score, 4);
    assert.strictEqual(strong.label, 'Excelente');
  });

  test('computeTaskApprovalStatus and computeTaskMapMetrics track total, approved, pending, rejected', () => {
    const sampleTask = (status: TaskItem['status']): TaskItem => ({
      id: '1',
      title: 'Setup CI/CD',
      description: 'Deploy pipeline',
      assignee: { name: 'Lucas', email: 'lucas@empresa.com', role: 'Dev' },
      dueDate: '2026-11-01',
      priority: 'high',
      status,
    });

    const allPending = [sampleTask('pending_approval'), sampleTask('pending_approval')];
    assert.strictEqual(computeTaskApprovalStatus(allPending), 'pending');

    const partial = [sampleTask('approved'), sampleTask('pending_approval')];
    assert.strictEqual(computeTaskApprovalStatus(partial), 'partially_approved');

    const allApproved = [sampleTask('approved'), sampleTask('modified')];
    assert.strictEqual(computeTaskApprovalStatus(allApproved), 'fully_approved');

    const mixed = [
      sampleTask('approved'),
      sampleTask('modified'),
      sampleTask('pending_approval'),
      sampleTask('rejected'),
    ];
    assert.deepStrictEqual(computeTaskMapMetrics(mixed), {
      total: 4,
      approved: 2,
      pending: 1,
      rejected: 1,
    });
    assert.deepStrictEqual(computeTaskMapMetrics([]), {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    });
  });

  test('formatDuration formats seconds accurately', () => {
    assert.strictEqual(formatDuration(0), '00:00');
    assert.strictEqual(formatDuration(65), '01:05');
    assert.strictEqual(formatDuration(3600), '60:00');
  });

  test('formatFileSize formats bytes cleanly', () => {
    assert.strictEqual(formatFileSize(0), '0 B');
    assert.strictEqual(formatFileSize(1024), '1 KB');
    assert.strictEqual(formatFileSize(1024 * 1024 * 5.5), '5.5 MB');
  });
});
