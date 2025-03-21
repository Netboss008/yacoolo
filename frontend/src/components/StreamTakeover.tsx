import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamTakeoverProps {
  streamId: string;
  isModerator: boolean;
  moderatorRank: 'silver' | 'gold';
  moderatorPermissions: string[];
}

interface Takeover {
  id: string;
  moderatorId: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed' | 'cancelled';
  reason: string;
}

const StreamTakeover: React.FC<StreamTakeoverProps> = ({
  streamId,
  isModerator,
  moderatorRank,
  moderatorPermissions
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTakeover, setActiveTakeover] = useState<Takeover | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isVisible) {
      checkActiveTakeover();
    }
  }, [isVisible, streamId]);

  const checkActiveTakeover = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/moderators/${streamId}/takeover`);
      if (!response.ok) throw new Error('Fehler beim Abrufen der Stream-Übernahme');
      const data = await response.json();
      setActiveTakeover(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    }
  };

  const handleStartTakeover = async () => {
    if (!reason.trim()) {
      setError('Bitte geben Sie einen Grund für die Übernahme an');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/moderators/${streamId}/takeover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error('Fehler beim Starten der Stream-Übernahme');
      
      await checkActiveTakeover();
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Starten der Übernahme aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTakeover = async () => {
    if (!activeTakeover) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/moderators/${streamId}/takeover/${activeTakeover.id}/end`,
        { method: 'PUT' }
      );

      if (!response.ok) throw new Error('Fehler beim Beenden der Stream-Übernahme');
      
      await checkActiveTakeover();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Beenden der Übernahme aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  if (!isModerator || moderatorRank !== 'gold' || !moderatorPermissions.includes('stream_takeover')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
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
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Stream-Übernahme</h3>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700">
                {error}
              </div>
            )}

            {activeTakeover ? (
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Grund:</p>
                  <p className="font-medium">{activeTakeover.reason}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Start:</p>
                  <p className="font-medium">
                    {new Date(activeTakeover.startTime).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleEndTakeover}
                  disabled={loading}
                  className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Wird beendet...' : 'Übernahme beenden'}
                </button>
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grund für die Übernahme
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Geben Sie einen Grund für die Stream-Übernahme an..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleStartTakeover}
                  disabled={loading || !reason.trim()}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Wird gestartet...' : 'Stream übernehmen'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreamTakeover; 