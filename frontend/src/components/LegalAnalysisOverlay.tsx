import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LegalAnalysis {
  id: string;
  paragraph: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

interface LegalAnalysisOverlayProps {
  streamId: string;
  isVisible: boolean;
  onToggle: () => void;
}

const LegalAnalysisOverlay: React.FC<LegalAnalysisOverlayProps> = ({ streamId, isVisible, onToggle }) => {
  const [analyses, setAnalyses] = useState<LegalAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/legal-analysis/${streamId}`);
        if (!response.ok) {
          throw new Error('Fehler beim Laden der rechtlichen Analysen');
        }
        const data = await response.json();
        setAnalyses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchAnalyses, 5000);
    return () => clearInterval(interval);
  }, [streamId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
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
            <h3 className="text-lg font-semibold text-gray-800">Rechtliche Analyse</h3>
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
            {analyses.map((analysis) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(analysis.severity)}`} />
                  <div>
                    <p className="text-sm text-gray-600">{analysis.paragraph}</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{analysis.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(analysis.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LegalAnalysisOverlay; 