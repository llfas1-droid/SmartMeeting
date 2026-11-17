import React from 'react';

interface FooterProps {
  showFeaturesLink?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ showFeaturesLink = false }) => {
  return (
    <footer className="py-8 bg-slate-950 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">SmartMeeting</span>
          <span>· 100% gratuito para equipas ágeis</span>
        </div>

        <div className="flex items-center gap-6">
          {showFeaturesLink && (
            <a href="#features" className="hover:text-slate-300 transition-colors">
              Funcionalidades
            </a>
          )}
          <span>© 2026 SmartMeeting</span>
        </div>
      </div>
    </footer>
  );
};
