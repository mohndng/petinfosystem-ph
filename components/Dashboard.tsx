
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Users, Dog, Syringe, AlertTriangle, Plus, Search, ClipboardCheck, Clock, MapPin, Loader2, FileText } from 'lucide-react';
import { AnnouncementFeed } from './AnnouncementFeed';
import { Pet, Vaccination, Incident, StrayReport } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  user: { id: string; username: string; role: string; fullName: string };
  barangayName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user, barangayName }) => {
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [strays, setStrays] = useState<StrayReport[]>([]);
  const [ownerCount, setOwnerCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [p, v, i, s, o] = await Promise.all([
      db.pets.getAll(),
      db.vaccinations.getAll(),
      db.incidents.getAll(),
      db.strays.getAll(),
      db.owners.getAll()
    ]);
    setPets(p);
    setVaccinations(v);
    setIncidents(i);
    setStrays(s);
    setOwnerCount(o.length);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('dbUpdated', loadData);
    return () => {
      window.removeEventListener('dbUpdated', loadData);
    };
  }, [loadData]);

  const stats = useMemo(() => {
    const totalPets = pets.length;
    // CRITICAL FIX: Use nextDueDate for immunity status, not the bottle's expirationDate
    const vaccinatedPets = new Set(vaccinations.filter(v => new Date(v.nextDueDate) > new Date()).map(v => v.petId)).size;
    const vaccinatedPercentage = totalPets ? Math.round((vaccinatedPets / totalPets) * 100) : 0;
    const incidentCount = incidents.filter(i => {
      const date = new Date(i.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;

    return { totalPets, vaccinatedPets, vaccinatedPercentage, incidentCount };
  }, [pets, vaccinations, incidents]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- STAFF VIEW (Operational) ---
  if (user.role === 'Staff') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Staff Welcome Banner */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Staff Portal</span>
                <span className="bg-blue-100/80 backdrop-blur-sm text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-blue-200/50">
                  <MapPin className="w-3 h-3" /> Brgy. {barangayName}
                </span>
             </div>
             <h1 className="text-3xl font-bold text-slate-900">Hello, {user.fullName || user.username}</h1>
             <p className="text-slate-500 mt-1 max-w-md">Ready to assist? Select a task below to start your field operations.</p>
           </div>
           <div className="flex items-center gap-4 relative z-10">
              <div className="text-right hidden md:block">
                 <p className="text-2xl font-bold text-blue-600">{stats.totalPets}</p>
                 <p className="text-xs text-slate-500 font-medium uppercase">Registered Pets</p>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
              <div className="text-right hidden md:block">
                 <p className="text-2xl font-bold text-red-600">{incidents.filter(i => i.status === 'Observation').length}</p>
                 <p className="text-xs text-slate-500 font-medium uppercase">Active Cases</p>
              </div>
           </div>
           {/* Background Decor */}
           <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        </div>

        {/* Operational Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <button 
             onClick={() => onNavigate('register')}
             className="group relative overflow-hidden bg-blue-600 hover:bg-blue-700 transition-all duration-300 p-6 rounded-2xl shadow-lg shadow-blue-200 text-left flex flex-col justify-between min-h-[160px]"
           >
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                 <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-white mb-1">Register Pet</h3>
                 <p className="text-blue-100 text-xs">New resident entry</p>
              </div>
           </button>
           
           <button 
             onClick={() => onNavigate('vaccination')}
             className="group relative overflow-hidden bg-white hover:border-blue-400 transition-all duration-300 p-6 rounded-2xl shadow-sm border border-slate-200 text-left flex flex-col justify-between min-h-[160px]"
           >
              <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Syringe className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-slate-800 mb-1">Log Vaccination</h3>
                 <p className="text-slate-500 text-xs">Update health records</p>
              </div>
           </button>

           <button 
             onClick={() => onNavigate('incidents')}
             className="group relative overflow-hidden bg-white hover:border-red-400 transition-all duration-300 p-6 rounded-2xl shadow-sm border border-slate-200 text-left flex flex-col justify-between min-h-[160px]"
           >
              <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                 <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-slate-800 mb-1">Report Incident</h3>
                 <p className="text-slate-500 text-xs">Bites or attacks</p>
              </div>
           </button>

           <button 
             onClick={() => onNavigate('registry')}
             className="group relative overflow-hidden bg-white hover:border-indigo-400 transition-all duration-300 p-6 rounded-2xl shadow-sm border border-slate-200 text-left flex flex-col justify-between min-h-[160px]"
           >
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Search className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-slate-800 mb-1">Search Database</h3>
                 <p className="text-slate-500 text-xs">Verify registration</p>
              </div>
           </button>
        </div>

        {/* 2-Column Layout for Staff */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-blue-600" /> Priority Tasks
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {incidents.filter(i => i.status === 'Observation').length > 0 ? (
                      incidents.filter(i => i.status === 'Observation').slice(0,3).map(incident => (
                        <div key={incident.id} className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                              <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-800 text-sm">Monitoring Required</h4>
                              <p className="text-xs text-slate-600 mt-1">
                                Check victim <strong>{incident.victimName}</strong>. Incident at {incident.location}.
                              </p>
                              <div className="mt-2 flex gap-2">
                                <button onClick={() => onNavigate('incidents')} className="text-xs font-bold text-amber-700 bg-white px-3 py-1 rounded shadow-sm hover:bg-amber-100">View Details</button>
                              </div>
                            </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                          <p className="text-slate-400 text-sm">No pending observation tasks.</p>
                      </div>
                    )}
                  </div>
              </div>
           </div>

           <div>
             <AnnouncementFeed user={user} />
           </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  const speciesData = [
    { name: 'Dogs', value: pets.filter(p => p.species === 'Dog').length },
    { name: 'Cats', value: pets.filter(p => p.species === 'Cat').length },
  ];

  const COLORS = ['#3b82f6', '#10b981'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/20 text-white text-xs font-bold mb-4 backdrop-blur-sm shadow-sm">
             <MapPin className="w-3 h-3" /> Barangay {barangayName}
          </div>
          <h1 className="text-3xl font-bold mb-2">Good Morning, Admin</h1>
          <p className="text-blue-100 max-w-xl">You have <span className="font-bold text-white underline">{stats.incidentCount} active alerts</span>.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('reports')} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" /> Generate Report
            </button>
            <button onClick={() => onNavigate('users')} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> Manage Staff
            </button>
          </div>
        </div>
        <Dog className="absolute -right-8 -bottom-12 w-64 h-64 text-white/10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pets" value={stats.totalPets} icon={<Dog className="w-6 h-6 text-blue-600" />} subValue="Registered" trend="up" />
        <StatCard title="Vaccinated" value={`${stats.vaccinatedPercentage}%`} icon={<Syringe className="w-6 h-6 text-emerald-600" />} subValue="Coverage" trend="neutral" alert={stats.vaccinatedPercentage < 70} />
        <StatCard title="Incidents" value={stats.incidentCount} icon={<AlertTriangle className="w-6 h-6 text-red-600" />} subValue="30 Days" trend="down" isBad={true} />
        <StatCard title="Owners" value={ownerCount} icon={<Users className="w-6 h-6 text-indigo-600" />} subValue="Residents" trend="up" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-8 items-center">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Species Ratio</h3>
              <p className="text-sm text-slate-500">Dog vs Cat population</p>
              <div className="mt-6 space-y-3">
                {speciesData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                      <span className="text-slate-600 font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-48 h-48 relative flex-shrink-0">
              <PieChart width={192} height={192}>
                <Pie data={speciesData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" strokeWidth={0}>
                  {speciesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">{stats.totalPets}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="xl:col-span-1">
           <AnnouncementFeed user={user} />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, subValue, trend, alert = false, isBad = false }: any) => (
  <div className={`p-6 rounded-2xl bg-white shadow-sm border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${alert ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${alert || (isBad && value > 0) ? 'bg-red-50' : 'bg-slate-50'}`}>{icon}</div>
      {alert && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">Action Needed</span>}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{subValue}</span>
      </div>
    </div>
  </div>
);
