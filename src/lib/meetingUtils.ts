import type { TaskItem } from '../types/index.ts';

export const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.mp4', '.m4a', '.webm'];
export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedFormat?: string;
}

export function validateMediaFile(file: { name: string; size: number; type?: string }): FileValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'Ficheiro não especificado.' };
  }

  const nameLower = file.name.toLowerCase();
  const matchedExt = ALLOWED_EXTENSIONS.find(ext => nameLower.endsWith(ext));

  if (!matchedExt) {
    return { 
      valid: false, 
      error: `Formato de ficheiro não suportado. Por favor utilize ${ALLOWED_EXTENSIONS.join(', ')}.` 
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'O ficheiro está vazio (0 bytes).' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { 
      valid: false, 
      error: `O ficheiro excede o limite máximo permitido de 500MB (${(file.size / (1024 * 1024)).toFixed(1)}MB detetados).` 
    };
  }

  return {
    valid: true,
    detectedFormat: matchedExt.replace('.', '').toUpperCase(),
  };
}

export interface PasswordScoreResult {
  score: number; // 0 a 4
  label: 'Fraca' | 'Razoável' | 'Boa' | 'Excelente';
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordScoreResult {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let passed = 0;
  if (minLength) passed++;
  if (hasUppercase) passed++;
  if (hasNumber) passed++;
  if (hasSpecial) passed++;

  let label: PasswordScoreResult['label'] = 'Fraca';
  let color = 'bg-rose-500';

  if (passed === 2) {
    label = 'Razoável';
    color = 'bg-amber-500';
  } else if (passed === 3) {
    label = 'Boa';
    color = 'bg-blue-500';
  } else if (passed === 4) {
    label = 'Excelente';
    color = 'bg-emerald-500';
  }

  return {
    score: passed,
    label,
    color,
    requirements: {
      minLength,
      hasUppercase,
      hasNumber,
      hasSpecial
    }
  };
}

export function computeTaskApprovalStatus(tasks: TaskItem[]): 'pending' | 'partially_approved' | 'fully_approved' {
  if (!tasks || tasks.length === 0) return 'fully_approved';
  
  const approvedCount = tasks.filter(t => t.status === 'approved' || t.status === 'modified').length;
  
  if (approvedCount === 0) return 'pending';
  if (approvedCount === tasks.length) return 'fully_approved';
  return 'partially_approved';
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
