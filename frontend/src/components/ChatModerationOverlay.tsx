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
  moderationAction?: 'warn' | 'timeout' | 'ban';
}

interface ChatModerationOverlayProps {
  streamId: string;
  isVisible: boolean;
  onToggle: () => void;
}

const ChatModerationOverlay: React.FC<ChatModerationOverlayProps> = ({ streamId, isVisible, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [moderationAction, setModerationAction] = useState<'warn' | 'timeout' | 'ban'>('warn');
  const [timeoutDuration, setTimeoutDuration] = useState(300); // 5 Minuten in Sekunden

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/moderation/chat/${streamId}`);
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Chat-Nachrichten');
        }
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [streamId]);

  const handleModeration = async () => {
    if (!selectedMessage) return;

    try {
      const response = await fetch(`http://localhost:3001/api/moderation/chat/${streamId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          action: moderationAction,
          duration: timeoutDuration,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Moderation');
      }

      // Aktualisiere die Nachrichtenliste
      setMessages(messages.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, isModerated: true, moderationAction, moderationReason: 'Verstoß gegen Chatregeln' }
          : msg
      ));

      setSelectedMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist bei der Moderation aufgetreten');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 right-4 w-96 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-4 z-50"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Chat-Moderation</h3>
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-colors ${
                  selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{message.username}</p>
                    <p className="text-sm text-gray-600">{message.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {message.isModerated && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${
                      message.moderationAction === 'ban' ? 'bg-red-500' :
                      message.moderationAction === 'timeout' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}>
                      {message.moderationAction === 'ban' ? 'Gebannt' :
                       message.moderationAction === 'timeout' ? 'Timeout' :
                       'Verwarnung'}
                    </span>
                    <span className="text-xs text-gray-500">{message.moderationReason}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {selectedMessage && !selectedMessage.isModerated && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setModerationAction('warn')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    moderationAction === 'warn'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Verwarnen
                </button>
                <button
                  onClick={() => setModerationAction('timeout')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    moderationAction === 'timeout'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Timeout
                </button>
                <button
                  onClick={() => setModerationAction('ban')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    moderationAction === 'ban'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Bannen
                </button>
              </div>

              {moderationAction === 'timeout' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Dauer (Sekunden):</label>
                  <input
                    type="number"
                    value={timeoutDuration}
                    onChange={(e) => setTimeoutDuration(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    min="1"
                    max="3600"
                  />
                </div>
              )}

              <button
                onClick={handleModeration}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Maßnahme anwenden
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatModerationOverlay; 