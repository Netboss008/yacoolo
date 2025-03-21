import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StreamOverlay from './StreamOverlay';

const ModerationDemo: React.FC = () => {
  const [role, setRole] = useState<'viewer' | 'moderator' | 'streamer'>('viewer');
  const [moderatorRank, setModeratorRank] = useState<'silver' | 'gold'>('silver');

  const mockStreamId = 'demo-stream-123';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Controls */}
      <div className="fixed top-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Demo Controls</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rolle
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'viewer' | 'moderator' | 'streamer')}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">Zuschauer</option>
              <option value="moderator">Moderator</option>
              <option value="streamer">Streamer</option>
            </select>
          </div>

          {role === 'moderator' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moderator-Rang
              </label>
              <select
                value={moderatorRank}
                onChange={(e) => setModeratorRank(e.target.value as 'silver' | 'gold')}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="silver">Silber</option>
                <option value="gold">Gold</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stream Preview */}
      <div className="relative w-full h-screen bg-black">
        {/* Mock Stream Content */}
        <div className="absolute inset-0 flex items-center justify-center text-white text-2xl">
          Stream Vorschau
        </div>

        {/* Stream Overlay */}
        <StreamOverlay
          streamId={mockStreamId}
          isStreamer={role === 'streamer'}
          isModerator={role === 'moderator'}
          moderatorRank={role === 'moderator' ? moderatorRank : undefined}
          moderatorPermissions={role === 'moderator' ? [
            'chat_moderation',
            'legal_analysis',
            ...(moderatorRank === 'gold' ? ['stream_takeover'] : [])
          ] : undefined}
        />
      </div>

      {/* Role Info */}
      <div className="fixed bottom-4 left-4 z-50 bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Aktuelle Rolle</h3>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Rolle:</span>{' '}
            {role === 'viewer' && 'Zuschauer'}
            {role === 'moderator' && 'Moderator'}
            {role === 'streamer' && 'Streamer'}
          </p>
          {role === 'moderator' && (
            <p className="text-sm">
              <span className="font-medium">Rang:</span>{' '}
              {moderatorRank === 'silver' ? 'Silber' : 'Gold'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationDemo; 