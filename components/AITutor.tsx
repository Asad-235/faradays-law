import React, { useState } from 'react';
import { explainPhysics } from '../services/gemini';
import { Sparkles, MessageSquare } from 'lucide-react';

interface AITutorProps {
  emf: number;
  flux: number;
  velocity: number;
  turns: number;
}

export const AITutor: React.FC<AITutorProps> = ({ emf, flux, velocity, turns }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    const text = await explainPhysics(emf, flux, velocity, turns);
    setExplanation(text);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          AI Physics Tutor
        </h3>
      </div>
      
      {explanation ? (
        <div className="bg-white p-3 rounded-lg text-sm text-slate-700 leading-relaxed shadow-sm border border-indigo-50 animate-in fade-in slide-in-from-bottom-2">
          {explanation}
          <button 
            onClick={() => setExplanation(null)}
            className="block mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 mb-3">
            Confused? Ask Gemini to explain what's happening right now in the simulation.
          </p>
          <button
            onClick={handleAsk}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors
              ${loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
          >
            {loading ? (
              <span className="animate-pulse">Thinking...</span>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                Explain This Moment
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
