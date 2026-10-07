import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ArrowRight, 
  TrendingDown, 
  Zap, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw,
  Activity,
  Heart,
  Droplet,
  Info
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
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
              <Sliders className="h-6 w-6 text-rose-500" />
              What-If Counterfactual Intervention Simulator
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono font-semibold">
              {patientId}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real-time risk reduction by perturbing physiological variables (e.g. restoring MAP or clearing Lactate).
          </p>
        </div>

        <button
          onClick={handleReset}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5 w-fit"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset Parameters
        </button>
      </div>

      {/* Preset Resuscitation Protocols */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Preset Clinical Resuscitation Protocols
          </span>
          <span className="text-xs text-slate-500">One-click simulation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handlePreset('MAP', 10)}
            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
              selectedVariable === 'MAP' && deltaValue === 10
                ? 'bg-rose-500/15 border-rose-500/50 text-white'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>IV Fluid Resuscitation</span>
              <span className="text-rose-400 font-mono">+10 mmHg</span>
            </div>
            <span className="text-xs text-slate-400">Increase MAP via 30 mL/kg crystalloid bolus</span>
          </button>

          <button
            onClick={() => handlePreset('MAP', 20)}
            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
              selectedVariable === 'MAP' && deltaValue === 20
                ? 'bg-rose-500/15 border-rose-500/50 text-white'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Vasopressor Escalation</span>
              <span className="text-rose-400 font-mono">+20 mmHg</span>
            </div>
            <span className="text-xs text-slate-400">Norepinephrine titration to target MAP &gt; 65 mmHg</span>
          </button>

          <button
            onClick={() => handlePreset('lactate', -1.5)}
            className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
              selectedVariable === 'lactate' && deltaValue === -1.5
                ? 'bg-rose-500/15 border-rose-500/50 text-white'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Lactate Clearance</span>
              <span className="text-amber-400 font-mono">-1.5 mmol/L</span>
            </div>
            <span className="text-xs text-slate-400">Broad-spectrum antibiotics & septic source control</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Controls & Live Comparison Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Slider Controls */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col gap-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-5 w-5 text-rose-500" />
            Intervention Controls
          </h3>

          {/* Variable Selection Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Target Physiological Parameter:</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => { setSelectedVariable('MAP'); setDeltaValue(10); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectedVariable === 'MAP'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Heart className="h-3.5 w-3.5" /> MAP (mmHg)
              </button>
              <button
                onClick={() => { setSelectedVariable('lactate'); setDeltaValue(-1.5); }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectedVariable === 'lactate'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Droplet className="h-3.5 w-3.5" /> Lactate (mmol/L)
              </button>
            </div>
          </div>

          {/* Range Slider */}
          <div className="space-y-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Intervention Perturbation Delta:</span>
              <span className="font-mono font-extrabold text-rose-400 text-sm">
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
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />

            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span>{selectedVariable === 'MAP' ? '-20 mmHg' : '-3.0 mmol/L'}</span>
              <span>Baseline (0)</span>
              <span>{selectedVariable === 'MAP' ? '+30 mmHg' : '+1.0 mmol/L'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Before -> After Risk Shift Visualizer */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" />
              Simulated Risk Shift Analysis
            </h3>
            {loading && <span className="text-xs text-amber-400 animate-pulse font-mono">Re-simulating GRU...</span>}
          </div>

          {/* Before -> After Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Baseline Risk Card */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Baseline Risk</div>
              <div className="text-3xl font-extrabold font-mono text-white">
                {origRiskPct}%
                <span className="text-xs font-sans font-normal text-slate-400 ml-1">pre-intervention</span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${origRiskPct}%` }} />
              </div>
            </div>

            {/* Intervened Simulated Risk Card */}
            <div className="bg-slate-900/80 border border-rose-500/40 p-5 rounded-xl space-y-3 glow-mod">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-400 uppercase tracking-wider">
                <span>Simulated Risk</span>
                <span className="font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                  {riskDeltaPct}% Shift
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400">
                {newRiskPct}%
                <span className="text-xs font-sans font-normal text-slate-400 ml-1">post-intervention</span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${newRiskPct}%` }} />
              </div>
            </div>
          </div>

          {/* Risk Shift Callout Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">
                  Predicted Deterioration Risk Drops by {Math.abs(riskDeltaPct)}%
                </span>
                <p className="text-slate-300 mt-0.5">
                  Restoring {selectedVariable} by {deltaValue > 0 ? `+${deltaValue}` : deltaValue} shifts patient {patientId} out of immediate shock escalation.
                </p>
              </div>
            </div>
          </div>

          {/* Backend Caveat & Rigor Disclaimer */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-300">Causal Disclaimer:</strong>{' '}
              {simulationResult?.caveat || 'Estimated effect based on PyTorch Multimodal GRU perturbation model. Not a validated causal assertion.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
