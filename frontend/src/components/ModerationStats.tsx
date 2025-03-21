import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ModerationStatsProps {
  streamId: string;
  isModerator: boolean;
}

interface Stats {
  totalModerations: number;
  warnings: number;
  timeouts: number;
  bans: number;
  blockedWords: number;
  legalAnalyses: number;
  moderationHistory: {
    date: string;
    count: number;
  }[];
}

const ModerationStats: React.FC<ModerationStatsProps> = ({ streamId, isModerator }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    if (isVisible) {
      fetchStats();
    }
  }, [isVisible, streamId, timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/moderation/stats/${streamId}?timeRange=${timeRange}`
      );
      if (!response.ok) throw new Error('Fehler beim Laden der Statistiken');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  if (!isModerator) return null;

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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 left-0 w-[600px] bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Moderations-Statistiken</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeRange('day')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      timeRange === 'day'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Heute
                  </button>
                  <button
                    onClick={() => setTimeRange('week')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      timeRange === 'week'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Woche
                  </button>
                  <button
                    onClick={() => setTimeRange('month')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      timeRange === 'month'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monat
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : stats ? (
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Gesamtmoderationen</h4>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalModerations}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Verwarnungen</h4>
                    <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-orange-800 mb-1">Timeouts</h4>
                    <p className="text-2xl font-bold text-orange-600">{stats.timeouts}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 mb-1">Banns</h4>
                    <p className="text-2xl font-bold text-red-600">{stats.bans}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Moderationsverlauf</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.moderationHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return timeRange === 'day'
                              ? date.toLocaleTimeString()
                              : date.toLocaleDateString();
                          }}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleString();
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#3B82F6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-1">Blockierte Wörter</h4>
                    <p className="text-2xl font-bold text-green-600">{stats.blockedWords}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-800 mb-1">Rechtliche Analysen</h4>
                    <p className="text-2xl font-bold text-purple-600">{stats.legalAnalyses}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModerationStats; 