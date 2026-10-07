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
  LayoutGrid,
  ListFilter
} from 'lucide-react';

export default function PatientList({ patients, onSelectPatient, selectedPatientId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'high' | 'moderate' | 'low'
  const [sortBy, setSortBy] = useState('risk_desc'); // 'risk_desc' | 'risk_asc' | 'lead_time_desc' | 'id_asc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

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
        const matchesSearch = 
          p.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.primary_condition && p.primary_condition.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRisk = riskFilter === 'all' || p.risk_level === riskFilter;
        return matchesSearch && matchesRisk;
      })
      .sort((a, b) => {
        if (sortBy === 'risk_desc') return b.current_risk - a.current_risk;
        if (sortBy === 'risk_asc') return a.current_risk - b.current_risk;
        if (sortBy === 'lead_time_desc') return (b.lead_time_hours || 0) - (a.lead_time_hours || 0);
        if (sortBy === 'id_asc') return a.patient_id.localeCompare(b.patient_id);
        return 0;
      });
  }, [patients, searchTerm, riskFilter, sortBy]);

  const getRiskBadgeClass = (level) => {
    if (level === 'high') return 'badge-high';
    if (level === 'moderate') return 'badge-moderate';
    return 'badge-low';
  };

  const getProgressColorClass = (level) => {
    if (level === 'high') return 'bg-rose-500 shadow-rose-500/50';
    if (level === 'moderate') return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Clinical Triage Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-white">{stats.total}</div>
            <div className="text-xs text-slate-400">Total Monitored ICU Patients</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4 glow-high">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-rose-400">{stats.high}</div>
            <div className="text-xs text-slate-400">High Risk Deterioration Alerts</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4 glow-mod">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-amber-400">{stats.mod}</div>
            <div className="text-xs text-slate-400">Moderate Risk Escalation</div>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Zap className="h-6 w-6 text-rose-400 animate-pulse" />
          </div>
          <div>
            <div className="text-2xl font-extrabold font-mono text-rose-400">+7.08h</div>
            <div className="text-xs text-slate-400">Avg Lead Time Ahead of NEWS2</div>
          </div>
        </div>
      </div>

      {/* Filter, Search & Sorting Controls */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient ID or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Risk Level Pills */}
          <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All' },
              { id: 'high', label: 'High Risk' },
              { id: 'moderate', label: 'Moderate' },
              { id: 'low', label: 'Low Risk' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setRiskFilter(f.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  riskFilter === f.id
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-rose-500"
            >
              <option value="risk_desc">Highest Risk First</option>
              <option value="risk_asc">Lowest Risk First</option>
              <option value="lead_time_desc">Longest Lead Time</option>
              <option value="id_asc">Patient ID (A-Z)</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact Table View"
            >
              <ListFilter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Patient Cards Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((p) => {
            const isSelected = p.patient_id === selectedPatientId;
            const riskPct = Math.round(p.current_risk * 100);

            return (
              <div
                key={p.patient_id}
                onClick={() => onSelectPatient(p.patient_id, 'timeline')}
                className={`glass-card p-5 flex flex-col justify-between gap-4 cursor-pointer transition transform hover:-translate-y-1 hover:border-slate-600 ${
                  isSelected ? 'border-rose-500 ring-1 ring-rose-500/50 bg-rose-950/10' : ''
                }`}
              >
                {/* Header: ID, Age/Sex, Risk Level */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-white">{p.patient_id}</span>
                    {p.age && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {p.age}y / {p.gender}
                      </span>
                    )}
                  </div>
                  <span className={`clinical-badge ${getRiskBadgeClass(p.risk_level)}`}>
                    {p.risk_level}
                  </span>
                </div>

                {/* Risk Bar & Probability */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Sepsis Deterioration Risk</span>
                    <span className="font-mono text-white font-extrabold text-sm">{riskPct}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColorClass(p.risk_level)}`}
                      style={{ width: `${riskPct}%` }}
                    />
                  </div>
                </div>

                {/* Clinical Notes & Diagnosis */}
                <div className="text-xs text-slate-400 line-clamp-2">
                  <span className="text-slate-300 font-medium">Condition: </span>
                  {p.primary_condition || 'ICU Continuous Monitoring'}
                </div>

                {/* Footer: Lead Time Gained & Action Button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  {p.lead_time_hours > 0 ? (
                    <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                      +{p.lead_time_hours}h Lead Time Gained
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Stable Baseline
                    </div>
                  )}

                  <button className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1">
                    View Detail <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Clinical Table View */
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Demographics</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Deterioration Score</th>
                <th className="py-3.5 px-4">Lead Time Advantage</th>
                <th className="py-3.5 px-4">Primary Condition</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPatients.map((p) => {
                const isSelected = p.patient_id === selectedPatientId;
                const riskPct = Math.round(p.current_risk * 100);
                return (
                  <tr
                    key={p.patient_id}
                    onClick={() => onSelectPatient(p.patient_id, 'timeline')}
                    className={`hover:bg-slate-900/60 cursor-pointer transition ${
                      isSelected ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-white">{p.patient_id}</td>
                    <td className="py-3 px-4 text-slate-300">{p.age ? `${p.age}y / ${p.gender}` : 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`clinical-badge ${getRiskBadgeClass(p.risk_level)}`}>
                        {p.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white w-8">{riskPct}%</span>
                        <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full ${getProgressColorClass(p.risk_level)}`}
                            style={{ width: `${riskPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {p.lead_time_hours > 0 ? (
                        <span className="text-rose-400 font-medium flex items-center gap-1">
                          <Zap className="h-3 w-3 text-rose-400" /> +{p.lead_time_hours}h ahead of NEWS2
                        </span>
                      ) : (
                        <span className="text-slate-500">Baseline</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                      {p.primary_condition || 'ICU Trajectory'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
                        Open Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
