import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { fetchPatientExplanation } from '../api/client';

export default function ExplanationPanel({ patientId, onNavigateTab }) {
  const [selectedTimestamp, setSelectedTimestamp] = useState('Hour 18');
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExplanation() {
      setLoading(true);
      const data = await fetchPatientExplanation(patientId, selectedTimestamp);
      setExplanation(data);
      setLoading(false);
    }
    loadExplanation();
  }, [patientId, selectedTimestamp]);

  const timestampOptions = Array.from({ length: 24 }, (_, i) => `Hour ${i + 1}`);

  if (loading || !explanation) {
    return (
      <div className="p-12 text-center text-slate-500 animate-shimmer rounded-xl">
        Analyzing key risk factor drivers...
      </div>
    );
  }

  const topRiskDrivers = explanation.top_features.filter(f => f.direction === 'increases_risk');
  const protectiveFactors = explanation.top_features.filter(f => f.direction === 'decreases_risk');
  const maxAbsContribution = Math.max(...explanation.top_features.map(f => Math.abs(f.contribution)), 0.01);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-indigo-600" />
            Why is Patient {patientId}'s Risk High?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Key physiological factors contributing to the AI model's predicted sepsis risk.
          </p>
        </div>

        {/* Timestamp Selector */}
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className="text-slate-600 font-semibold">Timeline Hour:</span>
          <select
            value={selectedTimestamp}
            onChange={(e) => setSelectedTimestamp(e.target.value)}
            className="bg-white text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 font-bold focus:outline-none focus:border-indigo-500"
          >
            {timestampOptions.map((ts) => (
              <option key={ts} value={ts}>{ts}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 High Risk Reasons Cards */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Top Factors Increasing Sepsis Risk:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topRiskDrivers.slice(0, 3).map((item, idx) => (
            <div key={idx} className="bg-rose-50 border border-rose-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                <span className="text-sm">{item.feature}</span>
                <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full font-mono text-xs">
                  +{item.contribution.toFixed(2)} Risk
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-mono">
                {item.value}
              </div>
              <p className="text-xs text-rose-800">
                Significantly elevates patient deterioration risk at {selectedTimestamp}.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Factor Contribution List */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="text-sm font-bold text-slate-900">
          All Evaluated Vitals & Lab Drivers ({selectedTimestamp})
        </div>

        <div className="space-y-3">
          {explanation.top_features.map((item, idx) => {
            const isIncrease = item.direction === 'increases_risk';
            const barWidthPct = Math.round((Math.abs(item.contribution) / maxAbsContribution) * 100);

            return (
              <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.feature}</span>
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Value: {item.value || 'N/A'}
                    </span>
                  </div>

                  <span className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                    isIncrease ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isIncrease ? `+${item.contribution.toFixed(2)} (Increases Risk)` : `${item.contribution.toFixed(2)} (Protective)`}
                  </span>
                </div>

                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full rounded-full ${isIncrease ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${barWidthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
