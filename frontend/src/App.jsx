import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Sliders, 
  ShieldAlert, 
  MessageSquare, 
  Database, 
  RefreshCw, 
  Trophy, 
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Heart,
  ChevronRight,
  Search,
  Bot,
  HelpCircle,
  LayoutDashboard
} from 'lucide-react';
import { checkBackendHealth, fetchPatients, setForceMockMode } from './api/client';
import PatientList from './components/PatientList';
import PatientTimeline from './components/PatientTimeline';
import ExplanationPanel from './components/ExplanationPanel';
import InterventionSimulator from './components/InterventionSimulator';
import ChatPanel from './components/ChatPanel';
import DemoGuideModal from './components/DemoGuideModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'simulator' | 'explanation' | 'chat' | 'roster'
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

  const selectedPatient = patients.find(p => p.patient_id === selectedPatientId) || {
    patient_id: selectedPatientId,
    current_risk: selectedPatientId === 'P001' ? 0.88 : selectedPatientId === 'P002' ? 0.63 : 0.08,
    risk_level: selectedPatientId === 'P001' ? 'high' : selectedPatientId === 'P002' ? 'moderate' : 'low',
    unit: 'Medical ICU - Bed 04',
    age: 64,
    lead_time_hours: selectedPatientId === 'P001' ? 8.5 : 6.0
  };

  const riskPct = Math.round(selectedPatient.current_risk * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      {/* Top App Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between shadow-sm">
        {/* App Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">SepsisAI</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                Early Warning App
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Predicting ICU patient deterioration <strong className="text-slate-700">+7.08 hours earlier</strong>
            </p>
          </div>
        </div>

        {/* Demo Controls & Status */}
        <div className="flex items-center gap-3">
          {/* Hero Quick Patient Switches */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 px-2 font-medium">Quick Select:</span>
            {[
              { id: 'P001', label: 'P001 (High 88%)', color: 'bg-rose-600 text-white shadow-sm' },
              { id: 'P002', label: 'P002 (Mod 63%)', color: 'bg-amber-500 text-white shadow-sm' },
              { id: 'P003', label: 'P003 (Stable 08%)', color: 'bg-emerald-600 text-white shadow-sm' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p.id, 'timeline')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedPatientId === p.id 
                    ? p.color 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsDemoGuideOpen(true)}
            className="text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <Trophy className="h-4 w-4" /> Presentation Guide
          </button>

          <div className="flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
            <Database className="h-4 w-4 text-slate-400" />
            {isBackendConnected && !isMockMode ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live Backend
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Demo Mock Mode
              </span>
            )}
          </div>

          <button
            onClick={toggleMockMode}
            className="text-xs p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
            title="Toggle Live / Mock API"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main App Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Left App Sidebar Menu */}
        <aside className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">App Views</div>
            
            {[
              { id: 'timeline', label: 'Risk & Timeline', icon: Activity, desc: 'Predicted risk graph' },
              { id: 'simulator', label: 'Treatment Simulator', icon: Sliders, desc: 'What-if slider controls' },
              { id: 'explanation', label: 'Why Risk is High', icon: ShieldAlert, desc: 'Key factor reasons' },
              { id: 'chat', label: 'AI Health Assistant', icon: MessageSquare, desc: 'Ask questions' },
              { id: 'roster', label: 'Patient Directory', icon: Users, desc: 'All 50 ICU patients' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm">{tab.label}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Active Patient Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Patient</div>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  Patient {p.patient_id} ({p.risk_level.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Big Clear Patient Overview Banner */}
          {activeTab !== 'roster' && (
            <div className="app-card p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-l-8 border-l-rose-500">
              <div className="flex items-center gap-5">
                {/* Big Readable Risk Score Dial */}
                <div className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center font-bold border shadow-sm ${
                  selectedPatient.risk_level === 'high' 
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : selectedPatient.risk_level === 'moderate'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <span className="text-2xl">{riskPct}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider">Risk Score</span>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Patient {selectedPatient.patient_id}
                    </h2>
                    <span className={`app-badge ${
                      selectedPatient.risk_level === 'high' ? 'badge-high' : selectedPatient.risk_level === 'moderate' ? 'badge-moderate' : 'badge-low'
                    }`}>
                      {selectedPatient.risk_level === 'high' ? '⚠️ High Deterioration Risk' : selectedPatient.risk_level === 'moderate' ? '⚡ Moderate Risk Escalation' : '✅ Stable Patient'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Location: <strong className="text-slate-700">{selectedPatient.unit || 'Medical ICU Bed 04'}</strong> • 
                    Early Alert Lead-Time: <strong className="text-indigo-600 font-bold">+{selectedPatient.lead_time_hours || 8.5} Hours Ahead</strong>
                  </p>
                </div>
              </div>

              {/* Easy-to-Read Plain English Explanation Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 max-w-md">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Zap className="h-4 w-4 text-amber-500" />
                  What this means:
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedPatient.risk_level === 'high' 
                    ? 'The AI model predicts a high likelihood of septic shock within 8 hours. Standard bedside scores (NEWS2) do not flag danger yet.'
                    : 'Patient vitals are currently stable with low predicted probability of ICU escalation over the next 12 hours.'}
                </p>
              </div>
            </div>
          )}

          {/* Render Active View Component */}
          {activeTab === 'timeline' && (
            <div className="app-card p-6">
              <PatientTimeline 
                patientId={selectedPatientId} 
                onNavigateTab={(tab) => setActiveTab(tab)} 
              />
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="app-card p-6">
              <InterventionSimulator 
                patientId={selectedPatientId} 
                onNavigateTab={(tab) => setActiveTab(tab)} 
              />
            </div>
          )}

          {activeTab === 'explanation' && (
            <div className="app-card p-6">
              <ExplanationPanel 
                patientId={selectedPatientId} 
                onNavigateTab={(tab) => setActiveTab(tab)} 
              />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="app-card p-6">
              <ChatPanel 
                patientId={selectedPatientId} 
              />
            </div>
          )}

          {activeTab === 'roster' && (
            <div className="app-card p-6">
              <PatientList
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={(id) => handleSelectPatient(id, 'timeline')}
              />
            </div>
          )}

        </main>
      </div>

      {/* Presentation Guide Modal */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onSelectPatient={(id) => handleSelectPatient(id, 'timeline')}
      />

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500">
        SepsisAI • Clinical Early Warning Decision Support System Prototype
      </footer>
    </div>
  );
}
