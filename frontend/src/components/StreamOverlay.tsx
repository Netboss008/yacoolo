import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatModerationOverlay from './ChatModerationOverlay';
import LegalAnalysisOverlay from './LegalAnalysisOverlay';
import StreamTakeover from './StreamTakeover';
import ModerationStats from './ModerationStats';
import ModerationSettings from './ModerationSettings';

interface StreamOverlayProps {
  streamId: string;
  isStreamer: boolean;
  isModerator: boolean;
  moderatorRank?: 'silver' | 'gold';
  moderatorPermissions?: string[];
}

const StreamOverlay: React.FC<StreamOverlayProps> = ({
  streamId,
  isStreamer,
  isModerator,
  moderatorRank,
  moderatorPermissions
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showChatModeration, setShowChatModeration] = useState(false);
  const [showLegalAnalysis, setShowLegalAnalysis] = useState(false);
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Moderation Stats */}
      <div className="pointer-events-auto">
        <ModerationStats
          streamId={streamId}
          isModerator={isModerator}
        />
      </div>

      {/* Stream Takeover */}
      {isModerator && moderatorRank && moderatorPermissions && (
        <div className="pointer-events-auto">
          <StreamTakeover
            streamId={streamId}
            isModerator={isModerator}
            moderatorRank={moderatorRank}
            moderatorPermissions={moderatorPermissions}
          />
        </div>
      )}

      {/* Chat Moderation */}
      {isModerator && (
        <div className="pointer-events-auto">
          <ChatModerationOverlay
            streamId={streamId}
            isVisible={showChatModeration}
            onToggle={() => setShowChatModeration(!showChatModeration)}
          />
        </div>
      )}

      {/* Legal Analysis */}
      {isModerator && (
        <div className="pointer-events-auto">
          <LegalAnalysisOverlay
            streamId={streamId}
            isVisible={showLegalAnalysis}
            onToggle={() => setShowLegalAnalysis(!showLegalAnalysis)}
          />
        </div>
      )}

      {/* Moderation Settings */}
      {isStreamer && (
        <div className="pointer-events-auto">
          <ModerationSettings
            streamId={streamId}
            isVisible={showSettings}
            onToggle={() => setShowSettings(!showSettings)}
          />
        </div>
      )}

      {/* Main Menu */}
      {(isStreamer || isModerator) && (
        <div className="fixed bottom-4 right-4 pointer-events-auto">
          <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
            {isStreamer && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettings
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Moderations-Einstellungen"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}

            {isModerator && (
              <>
                <button
                  onClick={() => setShowChatModeration(!showChatModeration)}
                  className={`p-2 rounded-lg transition-colors ${
                    showChatModeration
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setShowLegalAnalysis(!showLegalAnalysis)}
                  className={`p-2 rounded-lg transition-colors ${
                    showLegalAnalysis
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setShowStats(!showStats)}
                  className={`p-2 rounded-lg transition-colors ${
                    showStats
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Moderations-Statistiken"
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamOverlay; 