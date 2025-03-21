import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  isModerated: boolean;
  moderationReason?: string;
}

interface ChatModerationProps {
  streamId: string;
}

const ChatModeration: React.FC<ChatModerationProps> = ({ streamId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [moderationAction, setModerationAction] = useState<'warn' | 'timeout' | 'ban'>('warn');
  const [duration, setDuration] = useState<number>(5);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/moderation/logs/${streamId}`);
        if (!response.ok) throw new Error('Fehler beim Laden der Nachrichten');
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        setError('Fehler beim Laden der Chat-Nachrichten');
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Aktualisiere alle 5 Sekunden

    return () => clearInterval(interval);
  }, [streamId]);

  const handleModeration = async () => {
    if (!selectedMessage) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/moderation/moderate-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          message: selectedMessage.message,
          userId: selectedMessage.userId,
          action: moderationAction,
          duration: moderationAction === 'timeout' ? duration : undefined
        })
      });

      if (!response.ok) throw new Error('Fehler bei der Moderation');
      
      setMessages(prev => prev.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, isModerated: true, moderationReason: `${moderationAction} - ${duration} Minuten` }
          : msg
      ));

      setSelectedMessage(null);
    } catch (err) {
      setError('Fehler bei der Moderation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>

      {/* Moderation Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 left-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Chat-Moderation</h3>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700">
                {error}
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  Keine Nachrichten zum Moderieren
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                      selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{message.username}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.message}</p>
                    {message.isModerated && (
                      <p className="text-sm text-red-600 mt-1">
                        Moderiert: {message.moderationReason}
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Moderation Actions */}
            {selectedMessage && !selectedMessage.isModerated && (
              <div className="p-4 border-t bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moderations-Aktion
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModerationAction('warn')}
                        className={`px-3 py-1 rounded ${
                          moderationAction === 'warn'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Verwarnen
                      </button>
                      <button
                        onClick={() => setModerationAction('timeout')}
                        className={`px-3 py-1 rounded ${
                          moderationAction === 'timeout'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Timeout
                      </button>
                      <button
                        onClick={() => setModerationAction('ban')}
                        className={`px-3 py-1 rounded ${
                          moderationAction === 'ban'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        Bannen
                      </button>
                    </div>
                  </div>

                  {moderationAction === 'timeout' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout-Dauer (Minuten)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleModeration}
                    disabled={loading}
                    className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Wird moderiert...' : 'Moderieren'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatModeration; 