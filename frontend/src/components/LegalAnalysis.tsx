import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LegalAnalysis {
  id: string;
  paragraph: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface LegalAnalysisProps {
  streamId: string;
}

const LegalAnalysis: React.FC<LegalAnalysisProps> = ({ streamId }) => {
  const [analyses, setAnalyses] = useState<LegalAnalysis[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/moderation/legal-analysis/${streamId}`);
        if (!response.ok) throw new Error('Fehler beim Laden der Analysen');
        const data = await response.json();
        setAnalyses(data);
      } catch (err) {
        setError('Fehler beim Laden der rechtlichen Analysen');
      }
    };

    fetchAnalyses();
    const interval = setInterval(fetchAnalyses, 30000); // Aktualisiere alle 30 Sekunden

    return () => clearInterval(interval);
  }, [streamId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'Hoch';
      case 'medium':
        return 'Mittel';
      case 'low':
        return 'Niedrig';
      default:
        return 'Unbekannt';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Analysis Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Rechtliche Analyse</h3>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700">
                {error}
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              {analyses.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  Keine rechtlich relevanten Aussagen gefunden
                </div>
              ) : (
                analyses.map((analysis) => (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 border-b hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${getSeverityColor(analysis.severity)}`}>
                        {getSeverityText(analysis.severity)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(analysis.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{analysis.paragraph}</p>
                    <p className="text-sm text-gray-600">{analysis.description}</p>
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

export default LegalAnalysis; 