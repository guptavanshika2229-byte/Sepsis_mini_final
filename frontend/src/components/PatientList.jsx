import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Zap, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export default function PatientList({ patients, onSelectPatient, selectedPatientId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'high' | 'moderate' | 'low'
  const [sortBy, setSortBy] = useState('risk_desc'); // 'risk_desc' | 'risk_asc' | 'id_asc'

  // Summary Metrics
  const stats = useMemo(() => {
    const total = patients.length;
    const high = patients.filter(p => p.risk_level === 'high').length;
    const mod = patients.filter(p => p.risk_level === 'moderate').length;
    const low = patients.filter(p => p.risk_level === 'low').length;
    return { total, high, mod, low };
  }, [patients]);

  // Filter & Sort Pipeline
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        const matchesSearch = p.patient_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'all' || p.risk_level === riskFilter;
        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => {
        if (sortBy === 'risk_desc') return b.current_risk - a.current_risk;
        if (sortBy === 'risk_asc') return a.current_risk - b.current_risk;
        if (sortBy === 'id_asc') return a.patient_id.localeCompare(b.patient_id);
        return 0;
      });
  }, [patients, searchTerm, riskFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Title & Stats Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            ICU Patient Directory ({stats.total} Monitored)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time deterioration risk monitoring for all active ICU beds.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total ICU Patients</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
          <div className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-rose-600" /> High Risk Sepsis
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">{stats.high}</div>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
          <div className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1">
            <ShieldAlert className="h-4 w-4 text-amber-600" /> Moderate Escalation
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{stats.mod}</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <div className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Stable Patients
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.low}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient ID (e.g. P001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs font-semibold">
          <span className="text-slate-500">Filter:</span>
          {['all', 'high', 'moderate', 'low'].map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`px-3 py-1 rounded-lg capitalize transition ${
                riskFilter === level
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => {
          const isSelected = patient.patient_id === selectedPatientId;
          const riskPct = Math.round(patient.current_risk * 100);

          return (
            <div
              key={patient.patient_id}
              onClick={() => onSelectPatient(patient.patient_id)}
              className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl font-mono font-bold flex items-center justify-center text-sm ${
                    patient.risk_level === 'high'
                      ? 'bg-rose-100 text-rose-700'
                      : patient.risk_level === 'moderate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {patient.patient_id}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Patient {patient.patient_id}</div>
                    <div className="text-xs text-slate-500">{patient.unit || 'Medical ICU Bed 04'}</div>
                  </div>
                </div>

                <span className={`app-badge ${
                  patient.risk_level === 'high' ? 'badge-high' : patient.risk_level === 'moderate' ? 'badge-moderate' : 'badge-low'
                }`}>
                  {riskPct}% Risk
                </span>
              </div>

              {/* Progress Track */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    patient.risk_level === 'high'
                      ? 'bg-rose-600'
                      : patient.risk_level === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${riskPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>Lead Time: <strong className="text-slate-700 font-mono">+{patient.lead_time_hours || 8.5}h</strong></span>
                <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                  View Patient <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
