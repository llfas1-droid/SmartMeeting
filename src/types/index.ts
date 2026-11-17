export interface User {
  id: string;
  name: string;
  email: string;
  role: 'project_manager' | 'scrum_master' | 'developer' | 'designer';
  avatar?: string;
  organization: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours?: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'modified';
  managerNotes?: string;
  contextSnippet?: string; // Trecho da transcrição que originou a tarefa
}

export interface MeetingSummary {
  executiveSummary: string;
  keyDecisions: string[];
  blockersAndRisks: string[];
  nextSteps: string[];
}

export interface MeetingRecording {
  id: string;
  title: string;
  date: string;
  durationSeconds: number;
  fileType: 'audio/mp3' | 'audio/wav' | 'video/mp4' | 'direct_recording';
  fileName: string;
  fileSizeBytes: number;
  summary: MeetingSummary;
  tasks: TaskItem[];
  transcript?: {
    speaker: string;
    time: string;
    text: string;
  }[];
  managerApprovalStatus: 'pending' | 'partially_approved' | 'fully_approved';
}

export type ProcessingStep = 
  | 'idle'
  | 'uploading'
  | 'extracting_audio'
  | 'transcribing'
  | 'extracting_tasks'
  | 'ready_for_review';
