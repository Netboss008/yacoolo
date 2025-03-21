import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LegalAnalysisOverlay from './LegalAnalysisOverlay';
import ChatModerationOverlay from './ChatModerationOverlay';

interface StreamModerationOverlayProps {
  streamId: string;
  isStreamer: boolean;
}

const StreamModerationOverlay: React.FC<StreamModerationOverlayProps> = ({ streamId, isStreamer }) => {
  const [showLegalAnalysis, setShowLegalAnalysis] = useState(false);
  const [showChatModeration, setShowChatModeration] = useState(false);

  if (!isStreamer) {
    return null;
  }

  return (
    <>
      {/* Rechtliche Analyse Overlay */}
      <LegalAnalysisOverlay streamId={streamId} />

      {/* Chat-Moderation Overlay */}
      <ChatModerationOverlay streamId={streamId} />

      {/* Hauptmenü */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex gap-2">
          <button
            onClick={() => setShowLegalAnalysis(!showLegalAnalysis)}
            className={`p-3 rounded-full shadow-lg transition-colors ${
              showLegalAnalysis ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700'
            }`}
            title="Rechtliche Analyse"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowChatModeration(!showChatModeration)}
            className={`p-3 rounded-full shadow-lg transition-colors ${
              showChatModeration ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700'
            }`}
            title="Chat-Moderation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default StreamModerationOverlay; 