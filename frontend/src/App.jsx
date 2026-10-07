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
  X,
  Send,
  Info,
  Layers,
  Cpu
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
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col relative">
      {/* Top Main Application Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between shadow-xs gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">SepsisAI</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Early Warning Clinical App
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Predicting ICU Patient Deterioration</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> +7.08 Hours Lead-Time Gained
              </span>
            </p>
          </div>
        </div>

        {/* Demo Controls, Specs Button & Patient Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Hero Quick Patient Switcher Pills */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 px-2 font-medium">Quick Select:</span>
            {[
              { id: 'P001', label: 'P001 (High 88%)', color: 'bg-rose-600 text-white shadow-sm' },
              { id: 'P002', label: 'P002 (Mod 63%)', color: 'bg-amber-500 text-white shadow-sm' },
              { id: 'P003', label: 'P003 (Stable 08%)', color: 'bg-emerald-600 text-white shadow-sm' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p.id, 'timeline')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
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
            onClick={() => setIsSpecsOpen(true)}
            className="text-xs px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition flex items-center gap-1.5"
          >
            <Cpu className="h-4 w-4 text-indigo-600" /> AI Specifications
          </button>

          <button
            onClick={() => setIsDemoGuideOpen(true)}
            className="text-xs px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Trophy className="h-4 w-4 text-amber-300" /> Judges Presentation Guide
          </button>

          <div className="flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600">
            <Database className="h-4 w-4 text-slate-400" />
            {isBackendConnected && !isMockMode ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live FastAPI Backend
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Demo Mock API
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

      {/* Main App Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        
        {/* Left App Navigation Menu */}
        <aside className="w-full md:w-64 flex flex-col gap-3 shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">App Navigation</div>
            
            {[
              { id: 'timeline', label: 'Risk & Timeline Graph', icon: Activity, desc: '24h predicted trajectory' },
              { id: 'simulator', label: 'Treatment Simulator', icon: Sliders, desc: 'What-if slider controls' },
              { id: 'explanation', label: 'Why Risk is High', icon: ShieldAlert, desc: 'SHAP factor attributions' },
              { id: 'chat', label: 'Explainable AI Chatbot', icon: MessageSquare, desc: 'Grounded clinical Q&A' },
              { id: 'roster', label: 'ICU Patient Directory', icon: Users, desc: 'All 50 monitored beds' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center gap-3 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
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

          {/* Quick Active Patient Selector Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Monitored Patient</div>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  Patient {p.patient_id} — {p.risk_level.toUpperCase()} ({(p.current_risk * 100).toFixed(0)}%)
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Main Application Screen */}
        <main className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Active Patient Risk Header Banner */}
          {activeTab !== 'roster' && (
            <div className="app-card p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-l-8 border-l-rose-500">
              <div className="flex items-center gap-5">
                {/* Big Clear Risk Dial */}
                <div className={`h-20 w-20 rounded-2xl flex flex-col items-center justify-center font-bold border shadow-xs ${
                  selectedPatient.risk_level === 'high' 
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : selectedPatient.risk_level === 'moderate'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <span className="text-2xl font-mono">{riskPct}%</span>
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
                    Early Alert Advantage: <strong className="text-indigo-600 font-bold">+{selectedPatient.lead_time_hours || 8.5} Hours Ahead</strong>
                  </p>
                </div>
              </div>

              {/* Plain English Status Explanation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 max-w-md">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Clinical Status Summary:
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedPatient.risk_level === 'high' 
                    ? 'The AI model predicts a high likelihood of septic shock within 8 hours. Standard bedside scores (NEWS2) do not flag danger yet.'
                    : 'Patient vitals are currently stable with low predicted probability of ICU escalation over the next 12 hours.'}
                </p>
              </div>
            </div>
          )}

          {/* Active Screen Display */}
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

      {/* PERSISTENT FLOATING EXPLAINABLE AI CHATBOT BUTTON (Always Available Everywhere!) */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isFloatingChatOpen ? (
          <button
            onClick={() => setIsFloatingChatOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-2xl shadow-indigo-600/40 transform hover:scale-105 border-2 border-white"
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-rose-500 rounded-full animate-ping" />
            </div>
            <span>Ask Explainable AI Assistant</span>
          </button>
        ) : (
          <div className="w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[520px]">
            {/* Floating Chat Header */}
            <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bot className="h-5 w-5 text-indigo-200" />
                <div>
                  <div className="font-bold text-sm">Explainable AI Chatbot</div>
                  <div className="text-[10px] text-indigo-200">Patient {selectedPatientId} Context</div>
                </div>
              </div>
              <button
                onClick={() => setIsFloatingChatOpen(false)}
                className="p-1 text-indigo-200 hover:text-white rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto">
              <ChatPanel patientId={selectedPatientId} />
            </div>
          </div>
        )}
      </div>

      {/* Specifications & System Performance Drawer Modal */}
      {isSpecsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">System & Model Specifications</h3>
                  <p className="text-xs text-slate-500">Full technical specifications & performance metrics</p>
                </div>
              </div>
              <button
                onClick={() => setIsSpecsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-500 uppercase">Primary Model</div>
                <div className="text-sm font-extrabold text-indigo-600">PyTorch Multimodal BiGRU</div>
                <div className="text-slate-600">Bidirectional GRU + Notes Fusion</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-500 uppercase">AUROC Score</div>
                <div className="text-sm font-extrabold text-emerald-600">0.9416 AUROC</div>
                <div className="text-slate-600">Tested on 36 ICU events</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-500 uppercase">Lead-Time Advantage</div>
                <div className="text-sm font-extrabold text-amber-600">+7.08 Hours Gained</div>
                <div className="text-slate-600">+6.39h vs NEWS2, +7.78h vs SOFA</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-500 uppercase">Explainability Engine</div>
                <div className="text-sm font-extrabold text-indigo-600">SHAP & Counterfactuals</div>
                <div className="text-slate-600">Directional feature attribution</div>
              </div>
            </div>

            <button
              onClick={() => setIsSpecsOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Close Specifications
            </button>
          </div>
        </div>
      )}

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
