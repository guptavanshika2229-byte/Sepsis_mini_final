import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ArrowRight, 
  TrendingDown, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw,
  Activity,
  Heart,
  Droplet,
  CheckCircle2
} from 'lucide-react';
import { runCounterfactualSimulation } from '../api/client';

export default function InterventionSimulator({ patientId, onNavigateTab }) {
  const [selectedVariable, setSelectedVariable] = useState('MAP'); // 'MAP' | 'lactate'
  const [deltaValue, setDeltaValue] = useState(10);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function runSim() {
      setLoading(true);
      const res = await runCounterfactualSimulation(patientId, {
        variable: selectedVariable,
        delta: deltaValue,
        timestamp: 'Hour 18'
      });
      setSimulationResult(res);
      setLoading(false);
    }
    runSim();
  }, [patientId, selectedVariable, deltaValue]);

  const handlePreset = (variable, delta) => {
    setSelectedVariable(variable);
    setDeltaValue(delta);
  };

  const handleReset = () => {
    setSelectedVariable('MAP');
    setDeltaValue(10);
  };

  const origRiskPct = simulationResult ? Math.round(simulationResult.original_risk * 100) : 88;
  const newRiskPct = simulationResult ? Math.round(simulationResult.new_risk * 100) : 63;
  const riskDeltaPct = simulationResult ? Math.round(simulationResult.risk_delta * 100) : -25;

  return (
    <div className="space-y-6">
      {/* App Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            Interactive Treatment Simulator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Test how hypothetical clinical interventions (e.g. giving IV fluids or vasopressors) reduce sepsis risk in real time.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 w-fit border border-slate-200"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset Treatment
        </button>
      </div>

      {/* Preset Treatment Protocols */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          One-Click Treatment Protocols:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handlePreset('MAP', 10)}
            className={`p-3.5 rounded-xl border text-left transition ${
              selectedVariable === 'MAP' && deltaValue === 10
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between">
              <span>IV Fluid Resuscitation</span>
              <span className="text-indigo-600 font-mono font-extrabold">+10 MAP</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">30 mL/kg saline bolus</p>
          </button>

          <button
            onClick={() => handlePreset('MAP', 20)}
            className={`p-3.5 rounded-xl border text-left transition ${
              selectedVariable === 'MAP' && deltaValue === 20
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between">
              <span>Vasopressor Titration</span>
              <span className="text-indigo-600 font-mono font-extrabold">+20 MAP</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Norepinephrine infusion</p>
          </button>

          <button
            onClick={() => handlePreset('lactate', -1.5)}
            className={`p-3.5 rounded-xl border text-left transition ${
              selectedVariable === 'lactate' && deltaValue === -1.5
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="font-bold text-xs flex items-center justify-between">
              <span>Antibiotic Source Control</span>
              <span className="text-amber-600 font-mono font-extrabold">-1.5 Lactate</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Broad-spectrum IV antibiotics</p>
          </button>
        </div>
      </div>

      {/* Main Interactive Slider & Before/After Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Slider Control Box */}
        <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5">
          <div className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
            Adjust Parameter Slider
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Select Parameter:</label>
            <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => { setSelectedVariable('MAP'); setDeltaValue(10); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectedVariable === 'MAP'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Heart className="h-3.5 w-3.5" /> MAP (mmHg)
              </button>
              <button
                onClick={() => { setSelectedVariable('lactate'); setDeltaValue(-1.5); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectedVariable === 'lactate'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Droplet className="h-3.5 w-3.5" /> Lactate (mmol/L)
              </button>
            </div>
          </div>

          {/* Slider */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">Treatment Amount:</span>
              <span className="font-mono font-extrabold text-indigo-600 text-base">
                {selectedVariable === 'MAP' ? (deltaValue > 0 ? `+${deltaValue} mmHg` : `${deltaValue} mmHg`) : `${deltaValue} mmol/L`}
              </span>
            </div>

            <input
              type="range"
              min={selectedVariable === 'MAP' ? -20 : -3.0}
              max={selectedVariable === 'MAP' ? 30 : 1.0}
              step={selectedVariable === 'MAP' ? 5 : 0.5}
              value={deltaValue}
              onChange={(e) => setDeltaValue(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>{selectedVariable === 'MAP' ? '-20 mmHg' : '-3.0 mmol/L'}</span>
              <span>Baseline (0)</span>
              <span>{selectedVariable === 'MAP' ? '+30 mmHg' : '+1.0 mmol/L'}</span>
            </div>
          </div>
        </div>

        {/* Right Before -> After Output Box */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="font-bold text-sm text-slate-900">Live Risk Shift Result</div>
            {loading && <span className="text-xs text-amber-600 font-bold animate-pulse">Calculating AI Model...</span>}
          </div>

          {/* Before -> After Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase">Original Risk</div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">{origRiskPct}%</div>
              <div className="text-[11px] text-slate-400">Before intervention</div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-1">
              <div className="text-xs font-bold text-emerald-800 uppercase flex items-center justify-between">
                <span>New Risk</span>
                <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {riskDeltaPct}%
                </span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 font-mono">{newRiskPct}%</div>
              <div className="text-[11px] text-emerald-800 font-semibold">After intervention</div>
            </div>
          </div>

          {/* Outcome Summary Callout */}
          <div className="bg-emerald-500 text-white p-4 rounded-xl flex items-center gap-3">
            <TrendingDown className="h-6 w-6 shrink-0" />
            <div>
              <div className="font-extrabold text-sm">
                Sepsis Risk Decreases by {Math.abs(riskDeltaPct)}%
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                Adjusting {selectedVariable} by {deltaValue > 0 ? `+${deltaValue}` : deltaValue} lowers patient {patientId}'s risk from {origRiskPct}% to {newRiskPct}%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
