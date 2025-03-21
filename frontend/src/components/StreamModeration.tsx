import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LegalAnalysis from './LegalAnalysis';
import ChatModeration from './ChatModeration';
import ModerationStats from './ModerationStats';

interface StreamModerationProps {
  streamId: string;
  isStreamer: boolean;
}

const StreamModeration: React.FC<StreamModerationProps> = ({ streamId, isStreamer }) => {
  const [showStats, setShowStats] = useState(false);
  const [showLegalAnalysis, setShowLegalAnalysis] = useState(false);
  const [showChatModeration, setShowChatModeration] = useState(false);

  if (!isStreamer) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Hauptmenü */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowStats(!showStats)}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            showStats ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
          title="Statistiken"
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>

        <button
          onClick={() => setShowLegalAnalysis(!showLegalAnalysis)}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            showLegalAnalysis ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
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
            showChatModeration ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
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

      {/* Statistiken */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-[800px] bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <ModerationStats streamId={streamId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rechtliche Analyse */}
      <AnimatePresence>
        {showLegalAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <LegalAnalysis streamId={streamId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat-Moderation */}
      <AnimatePresence>
        {showChatModeration && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <ChatModeration streamId={streamId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreamModeration; 