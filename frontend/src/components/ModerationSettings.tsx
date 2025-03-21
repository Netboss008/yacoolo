import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ModerationSettingsProps {
  streamId: string;
  isVisible: boolean;
  onToggle: () => void;
}

interface StreamerSettings {
  legalAnalysisEnabled: boolean;
  chatModerationEnabled: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
  blockedWords: { id: string; word: string }[];
}

const ModerationSettings: React.FC<ModerationSettingsProps> = ({ streamId, isVisible, onToggle }) => {
  const [settings, setSettings] = useState<StreamerSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBlockedWord, setNewBlockedWord] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [streamId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/moderation/settings/${streamId}`);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Einstellungen');
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof StreamerSettings, value: any) => {
    if (!settings) return;

    try {
      const updatedSettings = {
        ...settings,
        [key]: value,
      };

      const response = await fetch(`http://localhost:3001/api/moderation/settings/${streamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Einstellungen');
      }

      setSettings(updatedSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Aktualisieren aufgetreten');
    }
  };

  const handleAddBlockedWord = async () => {
    if (!newBlockedWord.trim() || !settings) return;

    try {
      const updatedBlockedWords = [
        ...settings.blockedWords,
        { id: Date.now().toString(), word: newBlockedWord.trim() },
      ];

      const response = await fetch(`http://localhost:3001/api/moderation/settings/${streamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          blockedWords: updatedBlockedWords.map(({ word }) => word),
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Hinzufügen des blockierten Wortes');
      }

      setSettings({
        ...settings,
        blockedWords: updatedBlockedWords,
      });
      setNewBlockedWord('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Hinzufügen aufgetreten');
    }
  };

  const handleRemoveBlockedWord = async (wordId: string) => {
    if (!settings) return;

    try {
      const updatedBlockedWords = settings.blockedWords.filter(({ id }) => id !== wordId);

      const response = await fetch(`http://localhost:3001/api/moderation/settings/${streamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          blockedWords: updatedBlockedWords.map(({ word }) => word),
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen des blockierten Wortes');
      }

      setSettings({
        ...settings,
        blockedWords: updatedBlockedWords,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist beim Entfernen aufgetreten');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Moderations-Einstellungen</h2>

      {/* Rechtliche Analyse */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Rechtliche Analyse</h3>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.legalAnalysisEnabled}
              onChange={(e) => handleSettingChange('legalAnalysisEnabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Rechtliche Analyse aktivieren
            </span>
          </label>
        </div>
      </div>

      {/* Chat-Moderation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Chat-Moderation</h3>
        <div className="flex items-center mb-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.chatModerationEnabled}
              onChange={(e) => handleSettingChange('chatModerationEnabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Chat-Moderation aktivieren
            </span>
          </label>
        </div>

        {/* Sensitivitäts-Level */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sensitivitäts-Level
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleSettingChange('sensitivityLevel', level)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  settings.sensitivityLevel === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {level === 'low' ? 'Niedrig' : level === 'medium' ? 'Mittel' : 'Hoch'}
              </button>
            ))}
          </div>
        </div>

        {/* Blockierte Wörter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blockierte Wörter
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newBlockedWord}
              onChange={(e) => setNewBlockedWord(e.target.value)}
              placeholder="Neues Wort hinzufügen"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddBlockedWord}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Hinzufügen
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.blockedWords.map(({ id, word }) => (
              <span
                key={id}
                className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {word}
                <button
                  onClick={() => handleRemoveBlockedWord(id)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
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
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModerationSettings; 