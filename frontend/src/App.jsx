import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Activity, 
  ShieldAlert, 
  Sliders, 
  MessageSquare, 
  Database, 
  RefreshCw, 
  Users,
  Trophy,
  Sparkles,
  Zap,
  Clock,
  LayoutDashboard,
  CheckCircle2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { checkBackendHealth, fetchPatients, setForceMockMode } from './api/client';
import PatientList from './components/PatientList';
import PatientTimeline from './components/PatientTimeline';
import ExplanationPanel from './components/ExplanationPanel';
import InterventionSimulator from './components/InterventionSimulator';
import ChatPanel from './components/ChatPanel';
import DemoGuideModal from './components/DemoGuideModal';

export default function App() {
  const [viewMode, setViewMode] = useState('cockpit'); // 'cockpit' | 'roster'
  const [selectedPatientId, setSelectedPatientId] = useState('P001');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const isHealthy = await checkBackendHealth();
      setIsBackendConnected(isHealthy);
      const patientList = await fetchPatients();
      setPatients(patientList);
      setLoading(false);
    }
    init();
  }, [isMockMode]);

  const toggleMockMode = () => {
    const nextMock = !isMockMode;
    setIsMockMode(nextMock);
    setForceMockMode(nextMock);
  };

  const handleSelectPatient = (patientId, mode = 'cockpit') => {
    setSelectedPatientId(patientId);
    setViewMode(mode);
  };

  const selectedPatient = patients.find(p => p.patient_id === selectedPatientId) || {
    patient_id: selectedPatientId,
    current_risk: selectedPatientId === 'P001' ? 0.88 : selectedPatientId === 'P002' ? 0.63 : 0.08,
    risk_level: selectedPatientId === 'P001' ? 'high' : selectedPatientId === 'P002' ? 'moderate' : 'low',
    unit: 'Medical ICU - Bed 04',
    age: 64,
    lead_time_hours: selectedPatientId === 'P001' ? 8.5 : 6.0
  };

  const getRiskBadge = (level) => {
    if (level === 'high') return <span className="clinical-badge badge-high"><AlertTriangle className="h-3.5 w-3.5" /> High Risk Deterioration</span>;
    if (level === 'moderate') return <span className="clinical-badge badge-moderate"><ShieldAlert className="h-3.5 w-3.5" /> Moderate Escalation</span>;
    return <span className="clinical-badge badge-low"><CheckCircle2 className="h-3.5 w-3.5" /> Stable Condition</span>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070913] text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navigation & Command Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/25 animate-pulse-glow">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                SEPSIS<span className="text-rose-500">EWS</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono font-bold">
                AI EARLY WARNING COCKPIT
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>ICU Patient Deterioration Early Warning System</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Zap className="h-3 w-3" /> +7.08 Hours Lead-Time Gained
              </span>
            </p>
          </div>
        </div>

        {/* View Switcher & Demo Controls */}
        <div className="flex items-center gap-3">
          {/* Hero Quick Patient Switcher Pills */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">Demo Patients:</span>
            {[
              { id: 'P001', label: 'P001 (Critical 88%)', color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
              { id: 'P002', label: 'P002 (Escalating 63%)', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
              { id: 'P003', label: 'P003 (Stable 08%)', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p.id, 'cockpit')}
                className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold transition border ${
                  selectedPatientId === p.id 
                    ? p.color + ' shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsDemoGuideOpen(true)}
            className="text-xs px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-rose-500/20"
          >
            <Trophy className="h-4 w-4" /> Judges Presentation Guide
          </button>

          <div className="flex items-center gap-2 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Database className="h-3.5 w-3.5 text-slate-400" />
            {isBackendConnected && !isMockMode ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live FastAPI (8000)
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Standalone Mock API
              </span>
            )}
          </div>

          <button
            onClick={toggleMockMode}
            className="text-xs p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Toggle Live / Mock API Mode"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main View Shell Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Navigation Mode Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cockpit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'cockpit'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-rose-400" />
              Unified Clinical Cockpit
            </button>
            <button
              onClick={() => setViewMode('roster')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'roster'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="h-4 w-4 text-rose-400" />
              All Monitored Patients ({patients.length})
            </button>
          </div>

          {/* Active Patient Snapshot Indicator */}
          <div className="flex items-center gap-3 text-xs bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <span className="text-slate-400 font-medium">Selected Patient:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-xs font-bold focus:outline-none focus:border-rose-500"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_id} — {p.risk_level.toUpperCase()} ({(p.current_risk * 100).toFixed(0)}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode 1: Integrated Command Center Cockpit */}
        {viewMode === 'cockpit' && (
          <div className="flex flex-col gap-6">
            
            {/* Active Patient Hero Banner & Risk Meter */}
            <div className={`glass-card p-6 border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
              selectedPatient.risk_level === 'high' ? 'glow-high' : selectedPatient.risk_level === 'moderate' ? 'glow-mod' : 'glow-low'
            }`}>
              <div className="flex items-center gap-5">
                {/* Circular Dial / Meter Graphic */}
                <div className={`relative h-20 w-20 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-2xl border shadow-xl ${
                  selectedPatient.risk_level === 'high' 
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-rose-500/20' 
                    : selectedPatient.risk_level === 'moderate'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 shadow-amber-500/20'
                    : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-emerald-500/20'
                }`}>
                  <span>{(selectedPatient.current_risk * 100).toFixed(0)}%</span>
                  <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-slate-400">Risk Score</span>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black font-mono text-white tracking-tight">
                      Patient {selectedPatient.patient_id}
                    </h2>
                    {getRiskBadge(selectedPatient.risk_level)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>Location: <strong className="text-slate-200">{selectedPatient.unit || 'Medical ICU'}</strong></span>
                    <span>•</span>
                    <span>Lead-Time Lead: <strong className="text-amber-400 font-mono">+{selectedPatient.lead_time_hours || 8.5} Hours Earlier Alert</strong></span>
                  </p>
                </div>
              </div>

              {/* Pitch Lead-Time Highlight Callout */}
              <div className="flex items-center gap-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 w-full lg:w-auto">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    Early Deterioration Warning Gained
                    <span className="text-amber-400 font-mono text-xs">+7.08 Hours</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    PyTorch BiGRU flags danger well before NEWS2/SOFA scores cross alert thresholds.
                  </div>
                </div>
              </div>
            </div>

            {/* Split Canvas Workspace: Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (8 / 12): Interactive Timeline & SHAP Factors */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* 1. Multimodal Risk Trajectory Timeline */}
                <div className="glass-card p-6">
                  <PatientTimeline 
                    patientId={selectedPatientId} 
                    onNavigateTab={() => {}} 
                  />
                </div>

                {/* 2. SHAP Multimodal Feature Attribution Drivers */}
                <div className="glass-card p-6">
                  <ExplanationPanel 
                    patientId={selectedPatientId} 
                    onNavigateTab={() => {}} 
                  />
                </div>

              </div>

              {/* Right Column (4 / 12): Interactive Counterfactual Simulator & Chatbot */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* 3. Live What-If Counterfactual Intervention Simulator */}
                <div className="glass-card p-6">
                  <InterventionSimulator 
                    patientId={selectedPatientId} 
                    onNavigateTab={() => {}} 
                  />
                </div>

                {/* 4. Grounded Clinical AI Assistant */}
                <div className="glass-card p-6">
                  <ChatPanel 
                    patientId={selectedPatientId} 
                  />
                </div>

              </div>

            </div>

          </div>
        )}

        {/* View Mode 2: All Monitored Patients Roster */}
        {viewMode === 'roster' && (
          <div className="glass-card p-6">
            <PatientList
              patients={patients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={(id) => handleSelectPatient(id, 'cockpit')}
            />
          </div>
        )}

      </main>

      {/* Demo Presentation Guide Modal */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onNavigateTab={() => setViewMode('cockpit')}
        onSelectPatient={(id) => handleSelectPatient(id, 'cockpit')}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 flex items-center justify-between max-w-[1600px] mx-auto w-full">
        <div>Sepsis & Patient Deterioration Multimodal Early Warning System</div>
        <div className="text-slate-600 font-mono">PyTorch BiGRU • SHAP • Causal Simulator • FastAPI</div>
      </footer>
    </div>
  );
}
