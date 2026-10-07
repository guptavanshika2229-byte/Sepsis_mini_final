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
  Sparkles
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
      <div className="glass-card p-12 text-center text-slate-400 animate-shimmer rounded-xl">
        Calculating SHAP attributions for {patientId} at {selectedTimestamp}...
      </div>
    );
  }

  const topRiskDrivers = explanation.top_features.filter(f => f.direction === 'increases_risk');
  const protectiveFactors = explanation.top_features.filter(f => f.direction === 'decreases_risk');
  const maxAbsContribution = Math.max(...explanation.top_features.map(f => Math.abs(f.contribution)), 0.01);

  return (
    <div className="flex flex-col gap-6">
      {/* Panel Header & Timestamp Selector */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-rose-500" />
              Multimodal SHAP Feature Explainability
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono font-semibold">
              {patientId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantifying physiological feature contributions to the deep model's deterioration risk score.
          </p>
        </div>

        {/* Timestamp Selection Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3.5 py-2 rounded-xl text-xs">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="text-slate-300 font-medium">Trajectory Time:</span>
          <select
            value={selectedTimestamp}
            onChange={(e) => setSelectedTimestamp(e.target.value)}
            className="bg-slate-800 text-slate-100 border border-slate-700 rounded px-2.5 py-1 font-mono text-xs focus:outline-none focus:border-rose-500"
          >
            {timestampOptions.map((ts) => (
              <option key={ts} value={ts}>
                {ts}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Feature Attribution Graph Card */}
      <div className="glass-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Top Feature Contributions at {selectedTimestamp}
            </h3>
            <p className="text-xs text-slate-400">
              Red bars increase deterioration risk; Emerald bars exert protective effect.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-rose-500" />
              <span className="text-slate-300">Increases Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500" />
              <span className="text-slate-300">Decreases Risk</span>
            </div>
          </div>
        </div>

        {/* SHAP Horizontal Bars */}
        <div className="space-y-4">
          {explanation.top_features.map((item, idx) => {
            const isIncrease = item.direction === 'increases_risk';
            const barWidthPct = Math.round((Math.abs(item.contribution) / maxAbsContribution) * 100);
            const formattedVal = item.value || 'N/A';

            return (
              <div key={idx} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{item.feature}</span>
                    <span className="font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Value: {formattedVal}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-extrabold ${isIncrease ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isIncrease ? `+${item.contribution.toFixed(2)}` : `${item.contribution.toFixed(2)}`}
                    </span>
                    <span className={`clinical-badge ${isIncrease ? 'badge-high' : 'badge-low'}`}>
                      {isIncrease ? 'Increases Risk' : 'Protective'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isIncrease ? 'bg-rose-500 shadow-lg shadow-rose-500/40' : 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
                    }`}
                    style={{ width: `${barWidthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Narrative & What-If Action Gateway */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Info className="h-5 w-5 text-rose-400" />
              Clinical Interpretability Summary
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              At <strong className="text-white font-mono">{selectedTimestamp}</strong>, patient <strong className="text-white font-mono">{patientId}</strong> demonstrates acute risk elevation driven primarily by:
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {topRiskDrivers.slice(0, 3).map((driver, i) => (
                <li key={i} className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">{driver.feature}</strong> ({driver.value}): Contributes{' '}
                    <strong className="text-rose-400 font-mono">+{driver.contribution.toFixed(2)}</strong> to total risk score.
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>SHAP explanations are computed using background reference distributions from 120 ICU patient trajectories.</span>
          </div>
        </div>

        {/* What-If Simulator Action Card */}
        <div className="glass-card p-6 flex flex-col justify-between gap-4 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 border-rose-500/20">
          <div>
            <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 w-fit mb-3">
              <Sliders className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-white">Test Counterfactual Intervention</h4>
            <p className="text-xs text-slate-400 mt-1">
              Simulate how altering key risk drivers (e.g. restoring MAP +10 mmHg) dynamically reduces predicted deterioration risk.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('counterfactual')}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
          >
            Open What-If Simulator <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
