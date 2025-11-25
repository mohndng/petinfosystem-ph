
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../services/db';
import { generateBarangayReport } from '../services/geminiService';
import { FileText, Download, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { Pet, Owner, Vaccination, Incident, StrayReport } from '../types';

export const Reports: React.FC = () => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [strays, setStrays] = useState<StrayReport[]>([]);

  const fetchData = useCallback(async () => {
    const [i, p, o, v, s] = await Promise.all([
      db.incidents.getAll(),
      db.pets.getAll(),
      db.owners.getAll(),
      db.vaccinations.getAll(),
      db.strays.getAll()
    ]);
    setIncidents(i);
    setPets(p);
    setOwners(o);
    setVaccinations(v);
    setStrays(s);
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('dbUpdated', fetchData);
    return () => {
      window.removeEventListener('dbUpdated', fetchData);
    };
  }, [fetchData]);

  // Dynamic Calculation of Stats
  const stats = useMemo(() => {
    const totalPets = pets.length;
    
    // Filter for valid vaccinations (Active immunity)
    // Checks if vaccine type is Core (Rabies/Multi) and if nextDueDate is in the future
    const validVaccinations = vaccinations.filter(v => {
        const isNotExpired = new Date(v.nextDueDate) > new Date();
        const isRabiesRelated = v.vaccineType.includes('Rabies') || v.vaccineType.includes('Core');
        return isNotExpired && isRabiesRelated;
    });
    
    const vaccinatedPetIds = new Set(validVaccinations.map(v => v.petId));
    const vaccinatedCount = vaccinatedPetIds.size;
    
    const complianceRate = totalPets > 0 ? Math.round((vaccinatedCount / totalPets) * 100) : 0;
    
    return {
        totalPets,
        vaccinatedCount,
        complianceRate
    };
  }, [pets, vaccinations]);

  const handleGenerateAI = async () => {
    setLoading(true);

    const purokStats: Record<string, number> = {};
    pets.forEach(p => {
       const o = owners.find(ow => ow.id === p.ownerId);
       if(o) purokStats[o.address] = (purokStats[o.address] || 0) + 1;
    });

    const report = await generateBarangayReport(
      {
        totalPets: stats.totalPets,
        vaccinatedCount: stats.vaccinatedCount,
        incidentCount: incidents.length,
        strayCount: strays.length
      },
      purokStats
    );
    
    setAiReport(report);
    setLoading(false);
  };

  // Helper function to parse bold syntax (**text**) and render structured HTML
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (!line.trim()) return <div key={index} className="h-3" />; // Spacer for empty lines

      // Check if line is a bullet point
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Split by bold syntax
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={index} className={`mb-1.5 text-slate-700 leading-relaxed ${isBullet ? 'pl-4 flex items-start' : ''}`}>
          {isBullet && <span className="mr-2 text-slate-400">•</span>}
          <p className={isBullet ? 'flex-1' : ''}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                // Remove asterisks and render bold
                return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Barangay Reports</h2>
           <p className="text-sm text-slate-500">Analytics and executive summaries.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-2">Rabies Compliance</h3>
            <p className="text-sm text-slate-500">Pets with valid anti-rabies vaccination.</p>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${stats.complianceRate >= 80 ? 'bg-emerald-500' : stats.complianceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                 style={{ width: `${stats.complianceRate}%` }}
               ></div>
            </div>
            <div className="mt-2 flex justify-between text-xs font-medium">
               <span className={stats.complianceRate >= 80 ? 'text-emerald-600' : stats.complianceRate >= 50 ? 'text-amber-600' : 'text-red-600'}>
                 {stats.complianceRate}% Compliant ({stats.vaccinatedCount}/{stats.totalPets})
               </span>
               <span className="text-slate-400">Target: 80%</span>
            </div>
         </div>
         
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-2">Incident Rate</h3>
            <p className="text-sm text-slate-500">Reported bite cases in the last 30 days.</p>
            <div className="mt-4 flex items-end gap-1">
               <span className="text-3xl font-bold text-slate-900">{incidents.length}</span>
               <span className="text-sm text-slate-400 mb-1">cases</span>
            </div>
         </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-1 shadow-xl">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl min-h-[200px]">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-white/20 rounded-lg">
                 <Sparkles className="w-5 h-5 text-yellow-300" />
               </div>
               <div>
                 <h3 className="text-lg font-bold text-white">AI Executive Summary</h3>
                 <p className="text-indigo-100 text-sm opacity-90">Analysis for the Barangay Captain.</p>
               </div>
             </div>
             {aiReport && (
                <button 
                  onClick={handleGenerateAI}
                  disabled={loading} 
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" 
                  title="Regenerate"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
             )}
           </div>

           {!aiReport && !loading ? (
             <div className="text-center py-8">
               <button 
                 onClick={handleGenerateAI} 
                 className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-full shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 mx-auto"
               >
                 <Sparkles className="w-4 h-4" />
                 Generate Report Now
               </button>
               <p className="text-indigo-200 text-xs mt-3">Uses Gemini AI to analyze registry data.</p>
             </div>
           ) : loading ? (
             <div className="flex flex-col items-center justify-center py-12 text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm font-medium animate-pulse">Analyzing health records...</p>
             </div>
           ) : (
             <div className="bg-white rounded-xl p-8 animate-in zoom-in-95 duration-300 shadow-lg">
               {/* Parsed Text Output */}
               <div className="text-sm font-sans">
                 {renderFormattedText(aiReport || "")}
               </div>
               
               <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                 <span>Generated by AI • Verify with Vet</span>
                 <span>{new Date().toLocaleDateString()}</span>
               </div>
             </div>
           )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <h3 className="font-bold text-slate-800 mb-4">Master List Preview</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
               <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                     <th className="p-2">ID</th>
                     <th className="p-2">Pet Name</th>
                     <th className="p-2">Owner</th>
                     <th className="p-2">Purok</th>
                     <th className="p-2">Status</th>
                  </tr>
               </thead>
               <tbody>
                  {pets.slice(0,5).map(p => {
                     const owner = owners.find(o => o.id === p.ownerId);
                     return (
                        <tr key={p.id} className="border-b border-slate-100">
                           <td className="p-2 font-mono text-slate-400">{p.id}</td>
                           <td className="p-2 font-medium">{p.name}</td>
                           <td className="p-2">{owner?.fullName}</td>
                           <td className="p-2">{owner?.address}</td>
                           <td className="p-2">{p.status}</td>
                        </tr>
                     )
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
