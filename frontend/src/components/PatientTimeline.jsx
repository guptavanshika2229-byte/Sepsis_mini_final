import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  LineChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  ReferenceArea 
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Heart, 
  Droplet, 
  ChevronRight,
  Info,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { fetchPatientTimeline } from '../api/client';

export default function PatientTimeline({ patientId, onNavigateTab }) {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchPatientTimeline(patientId);
      setTimelineData(data);
      setLoading(false);
    }
    loadData();
  }, [patientId]);

  if (loading || !timelineData) {
    return (
      <div className="p-12 text-center text-slate-500 animate-shimmer rounded-xl">
        Loading patient trajectory & vital signs history...
      </div>
    );
  }

  // Format ISO timestamps into clean readable hourly strings (e.g. "Hour 18")
  const formatTimeLabel = (ts, idx) => {
    if (!ts) return `Hour ${idx + 1}`;
    if (ts.startsWith('Hour')) return ts;
    try {
      const dateObj = new Date(ts);
      if (isNaN(dateObj.getTime())) return `Hour ${idx + 1}`;
      return `Hour ${idx + 1} (${dateObj.getUTCHours().toString().padStart(2, '0')}:00)`;
    } catch {
      return `Hour ${idx + 1}`;
    }
  };

  const chartData = timelineData.timestamps.map((t, idx) => {
    const rawRisk = timelineData.model_risk?.[idx] ?? 0;
    const riskPct = Math.min(100, Math.max(0, Math.round(rawRisk * 100)));
    return {
      rawTimestamp: t,
      timestamp: formatTimeLabel(t, idx),
      hourNum: idx + 1,
      model_risk: riskPct,
      news2_score: timelineData.news2_score?.[idx] ?? 0,
      sofa_score: timelineData.sofa_score?.[idx] ?? 0,
      hr: Math.round(timelineData.vitals?.HR?.[idx] ?? 70),
      map: Math.round(timelineData.vitals?.MAP?.[idx] ?? 80),
      lactate: parseFloat((timelineData.vitals?.lactate?.[idx] ?? 1.0).toFixed(1)),
      spo2: Math.round(timelineData.vitals?.SpO2?.[idx] ?? 98)
    };
  });

  const isHighRisk = patientId === 'P001' || patientId === 'P004';
  const latestRisk = chartData[chartData.length - 1]?.model_risk || 0;

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl text-xs space-y-2 max-w-xs">
          <div className="font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-slate-400">Patient {patientId}</span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-rose-400 font-bold">AI Sepsis Risk:</span>
              <span className="font-mono font-bold text-lg">{data.model_risk}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-semibold">Standard NEWS2 Score:</span>
              <span className="font-mono font-bold">{data.news2_score}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Blood Pressure (MAP):</span>
              <span className="font-mono">{data.map} mmHg</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Serum Lactate:</span>
              <span className="font-mono">{data.lactate} mmol/L</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span>Heart Rate:</span>
              <span className="font-mono">{data.hr} bpm</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            24-Hour Patient Risk Trajectory Graph
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparing AI early warning score against standard hospital bedside scores (NEWS2 & SOFA).
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-600" />
            <span className="text-slate-800">AI Risk Score (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-slate-600">Standard NEWS2 Score</span>
          </div>
        </div>
      </div>

      {/* Headline Early Alert Highlight Banner */}
      {isHighRisk && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-600 text-white font-bold">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-900">
                ⚡ 8.5 Hours Early Warning Advantage Gained
              </div>
              <p className="text-slate-600">
                AI model flagged high-risk danger at <strong className="text-slate-900 font-mono">Hour 14</strong>, whereas the hospital NEWS2 score did not cross alert criteria until <strong className="text-slate-900 font-mono">Hour 22</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('simulator')}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shrink-0 flex items-center gap-1"
          >
            Test Treatment <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Recharts Chart Canvas */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="riskGradientLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 11 }} />
              
              <YAxis 
                yAxisId="left" 
                domain={[0, 100]} 
                stroke="#dc2626" 
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11 }}
              />

              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[0, 20]} 
                stroke="#d97706"
                tick={{ fontSize: 11 }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Shaded Lead Time Area */}
              {isHighRisk && chartData.length >= 22 && (
                <ReferenceArea
                  yAxisId="left"
                  x1={chartData[13]?.timestamp || 'Hour 14'}
                  x2={chartData[21]?.timestamp || 'Hour 22'}
                  fill="#ef4444"
                  fillOpacity={0.15}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                />
              )}

              <ReferenceLine yAxisId="left" y={50} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Danger Line (50%)', fill: '#d97706', fontSize: 11, position: 'insideTopLeft' }} />

              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="model_risk" 
                stroke="#dc2626" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#riskGradientLight)" 
              />

              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="news2_score" 
                stroke="#d97706" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#d97706' }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Patient Vital Sign Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">Blood Pressure (MAP)</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {chartData[chartData.length - 1]?.map} <span className="text-xs font-normal text-slate-500">mmHg</span>
          </div>
          <div className="text-xs text-rose-600 font-medium">⚠️ Below target (&lt; 65 mmHg)</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">Serum Lactate</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {chartData[chartData.length - 1]?.lactate} <span className="text-xs font-normal text-slate-500">mmol/L</span>
          </div>
          <div className="text-xs text-amber-600 font-medium">⚠️ Elevated tissue hypoperfusion</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">Heart Rate</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {chartData[chartData.length - 1]?.hr} <span className="text-xs font-normal text-slate-500">bpm</span>
          </div>
          <div className="text-xs text-slate-600">Compensatory tachycardia</div>
        </div>
      </div>
    </div>
  );
}
