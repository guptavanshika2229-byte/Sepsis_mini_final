import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  HeartPulse, 
  Sliders, 
  MessageSquare, 
  Database, 
  RefreshCw, 
  Users,
  Trophy,
  Sparkles
} from 'lucide-react';
import { checkBackendHealth, fetchPatients, setForceMockMode } from './api/client';
import PatientList from './components/PatientList';
import PatientTimeline from './components/PatientTimeline';
import ExplanationPanel from './components/ExplanationPanel';
import InterventionSimulator from './components/InterventionSimulator';
import ChatPanel from './components/ChatPanel';
import DemoGuideModal from './components/DemoGuideModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'timeline' | 'explanation' | 'counterfactual' | 'chat'
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

  const handleSelectPatient = (patientId, targetTab = 'timeline') => {
    setSelectedPatientId(patientId);
    setActiveTab(targetTab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Clinical Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <HeartPulse className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              SEPSIS<span className="text-rose-500 font-extrabold">EWS</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                v1.0 Multimodal
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              ICU Deterioration Early Warning System • <span className="text-amber-400 font-medium">+7.08h Lead Time Gained</span>
            </p>
          </div>
        </div>

        {/* System Status Indicator & Demo Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDemoGuideOpen(true)}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
          >
            <Trophy className="h-4 w-4" /> Judges Presentation Guide
          </button>

          <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <Database className="h-4 w-4 text-slate-400" />
            <span className="text-slate-300">Data Source:</span>
            {isBackendConnected && !isMockMode ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Live FastAPI (Port 8000)
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Standalone Mock API
              </span>
            )}
          </div>

          <button
            onClick={toggleMockMode}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {isMockMode ? 'Switch to Live API' : 'Use Mock Layer'}
          </button>
        </div>
      </header>

      {/* Main View Shell Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Hero Judge Pitch Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Predicting ICU Deterioration 7.08 Hours Earlier Than Bedside Scores
              </h2>
              <p className="text-xs text-slate-400">
                Multimodal PyTorch BiGRU + SHAP attributions + Causal Intervention Simulation.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSelectPatient('P001', 'timeline')}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition font-semibold"
          >
            Inspect P001 Hero Patient Trajectory
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <nav className="flex gap-2">
            {[
              { id: 'list', label: 'Patient Roster', icon: Users },
              { id: 'timeline', label: 'Risk Trajectory', icon: Activity },
              { id: 'explanation', label: 'SHAP Explainability', icon: ShieldAlert },
              { id: 'counterfactual', label: 'What-If Intervention', icon: Sliders },
              { id: 'chat', label: 'Clinical Chatbot', icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-md shadow-rose-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Active Patient Snapshot Selector */}
          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-500">Active Patient:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-slate-800 text-slate-100 border border-slate-700 rounded px-2 py-0.5 font-mono text-xs focus:outline-none focus:border-rose-500"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.patient_id} ({p.risk_level.toUpperCase()} - {(p.current_risk * 100).toFixed(0)}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Content Display Area */}
        <div className="flex-1">
          {activeTab === 'list' && (
            <PatientList
              patients={patients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {activeTab === 'timeline' && (
            <PatientTimeline
              patientId={selectedPatientId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'explanation' && (
            <ExplanationPanel
              patientId={selectedPatientId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'counterfactual' && (
            <InterventionSimulator
              patientId={selectedPatientId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPanel
              patientId={selectedPatientId}
            />
          )}
        </div>
      </main>

      {/* Demo Presentation Guide Modal */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onSelectPatient={handleSelectPatient}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-600">
        Sepsis & Patient Deterioration Early Warning System • Phase 8 Complete (Demo Ready)
      </footer>
    </div>
  );
}
