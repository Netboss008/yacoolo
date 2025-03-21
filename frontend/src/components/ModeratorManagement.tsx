import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Moderator {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  rank: 'silver' | 'gold';
  permissions: string[];
  createdAt: string;
}

interface ModeratorManagementProps {
  streamId: string;
  isHost: boolean;
}

const ModeratorManagement: React.FC<ModeratorManagementProps> = ({ streamId, isHost }) => {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newModerator, setNewModerator] = useState({
    username: '',
    rank: 'silver' as const,
    permissions: [] as string[]
  });

  const availablePermissions = [
    { id: 'chat_moderation', label: 'Chat moderieren' },
    { id: 'user_timeout', label: 'User timeouten' },
    { id: 'user_ban', label: 'User bannen' },
    { id: 'stream_takeover', label: 'Stream übernehmen' },
    { id: 'stream_settings', label: 'Stream-Einstellungen ändern' }
  ];

  useEffect(() => {
    if (isVisible) {
      fetchModerators();
    }
  }, [isVisible, streamId]);

  const fetchModerators = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/moderators/${streamId}/moderators`);
      if (!response.ok) throw new Error('Fehler beim Laden der Moderatoren');
      const data = await response.json();
      setModerators(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleAddModerator = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/moderators/${streamId}/moderators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModerator)
      });

      if (!response.ok) throw new Error('Fehler beim Hinzufügen des Moderators');
      
      await fetchModerators();
      setNewModerator({
        username: '',
        rank: 'silver',
        permissions: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Hinzufügen aufgetreten');
    }
  };

  const handleUpdateModerator = async (moderatorId: string, updates: Partial<Moderator>) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/moderators/${streamId}/moderators/${moderatorId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) throw new Error('Fehler beim Aktualisieren des Moderators');
      
      await fetchModerators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Aktualisieren aufgetreten');
    }
  };

  const handleRemoveModerator = async (moderatorId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/moderators/${streamId}/moderators/${moderatorId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Fehler beim Entfernen des Moderators');
      
      await fetchModerators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Entfernen aufgetreten');
    }
  };

  if (!isHost) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
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

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 left-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Moderator-Verwaltung</h3>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700">
                {error}
              </div>
            )}

            {/* Neuer Moderator */}
            <div className="p-4 border-b">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Neuer Moderator</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newModerator.username}
                  onChange={(e) => setNewModerator({ ...newModerator, username: e.target.value })}
                  placeholder="Benutzername"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newModerator.rank}
                  onChange={(e) => setNewModerator({ ...newModerator, rank: e.target.value as 'silver' | 'gold' })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="silver">Silber-Moderator</option>
                  <option value="gold">Gold-Moderator</option>
                </select>
                <div className="space-y-1">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newModerator.permissions.includes(permission.id)}
                        onChange={(e) => {
                          const newPermissions = e.target.checked
                            ? [...newModerator.permissions, permission.id]
                            : newModerator.permissions.filter(p => p !== permission.id);
                          setNewModerator({ ...newModerator, permissions: newPermissions });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{permission.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleAddModerator}
                  className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Moderator hinzufügen
                </button>
              </div>
            </div>

            {/* Moderator-Liste */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                moderators.map((moderator) => (
                  <motion.div
                    key={moderator.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 border-b hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <img
                          src={moderator.user.avatar}
                          alt={moderator.user.username}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <span className="font-medium">{moderator.user.username}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        moderator.rank === 'gold'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {moderator.rank === 'gold' ? 'Gold' : 'Silber'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {moderator.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {availablePermissions.find(p => p.id === permission)?.label}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleUpdateModerator(moderator.id, {
                          rank: moderator.rank === 'gold' ? 'silver' : 'gold'
                        })}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Rang ändern
                      </button>
                      <button
                        onClick={() => handleRemoveModerator(moderator.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Entfernen
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModeratorManagement; 