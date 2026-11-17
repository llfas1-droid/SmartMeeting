import React from 'react';
import type { MeetingRecording } from '../../types/index.ts';
import { MeetingAssistantPanel } from './MeetingAssistantPanel.tsx';

interface MeetingChatbotDrawerProps {
  meeting: MeetingRecording | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestLoadMeeting?: () => void;
}

export const MeetingChatbotDrawer: React.FC<MeetingChatbotDrawerProps> = ({
  meeting,
  isOpen,
  onClose,
  onRequestLoadMeeting,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assistente da Reunião"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
    >
      <MeetingAssistantPanel
        meeting={meeting}
        variant="drawer"
        onClose={onClose}
        onRequestLoadMeeting={onRequestLoadMeeting}
      />
    </div>
  );
};
