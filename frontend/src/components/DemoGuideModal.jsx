import React from 'react';
import { 
  Sparkles, 
  X, 
  Users, 
  Activity, 
  ShieldAlert, 
  Sliders, 
  MessageSquare, 
  ChevronRight, 
  Zap,
  CheckCircle2,
  Trophy
} from 'lucide-react';

export default function DemoGuideModal({ isOpen, onClose, onNavigateTab, onSelectPatient }) {
  if (!isOpen) return null;

  const steps = [
    {
      stepNum: 1,
      tabId: 'list',
      patientId: 'P001',
      title: 'Step 1: Patient Roster & Risk Triage',
      subtitle: 'Identify High-Risk ICU Patients First',
      description: 'Demonstrate real-time clinical triage sorted by deterioration risk score descending. Highlight patient P001 flagged at 98% High Risk.',
      icon: Users,
      badge: 'Triage View'
    },
    {
      stepNum: 2,
      tabId: 'timeline',
      patientId: 'P001',
      title: 'Step 2: 8.5-Hour Early Warning Trajectory',
      subtitle: 'BiGRU Deep Model vs. Bedside NEWS2 / SOFA',
      description: 'Show the headline proof point: the deep learning model flags deterioration at Hour 14, providing 8.5 hours of actionable lead time before NEWS2 fires at Hour 22.',
      icon: Activity,
      badge: 'Headline Visual'
    },
    {
      stepNum: 3,
      tabId: 'explanation',
      patientId: 'P001',
      title: 'Step 3: Multimodal SHAP Explainability',
      subtitle: 'Decompose Risk Score into Clinical Drivers',
      description: 'Explain "why" the risk is high: Lactate elevation (+0.32 risk contribution) and MAP hypotension (+0.26 risk contribution).',
      icon: ShieldAlert,
      badge: 'Interpretability'
    },
    {
      stepNum: 4,
      tabId: 'counterfactual',
      patientId: 'P001',
      title: 'Step 4: What-If Intervention Simulator',
      subtitle: 'Interactive Resuscitation Scenario Testing',
      description: 'Move the MAP slider to +10 mmHg (fluid bolus). Show live risk reduction from 88% → 63% (-25% shift) alongside backend causal caveats.',
      icon: Sliders,
      badge: 'Wow Factor'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card max-w-3xl w-full p-6 space-y-6 border-rose-500/30 glow-high relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Judge-Facing Hackathon Presentation Guide
            </h2>
            <p className="text-xs text-slate-400">
              Recommended 2-minute live demo sequence to land maximum visual & clinical impact.
            </p>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.stepNum}
                className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 hover:border-rose-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      STEP {step.stepNum}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-rose-400" />
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-300 font-medium">{step.subtitle}</p>
                  <p className="text-xs text-slate-400 line-clamp-3">{step.description}</p>
                </div>

                <button
                  onClick={() => {
                    onSelectPatient(step.patientId);
                    onNavigateTab(step.tabId);
                    onClose();
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-rose-500 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700 hover:border-rose-500"
                >
                  Jump to Step {step.stepNum} <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Banner */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Headline Metric: <strong className="text-white">+7.08 Hours Average Early Warning Lead Time</strong> achieved across test set evaluation.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition"
          >
            Got it, Start Demo
          </button>
        </div>
      </div>
    </div>
  );
}
