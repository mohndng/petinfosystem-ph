
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/db';
import { Incident, Pet } from '../types';
import { AlertTriangle, Plus, Search, MapPin, Activity, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomSelect } from './CustomSelect';

export const BiteIncidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isProvoked, setIsProvoked] = useState('no');

  const refreshIncidents = useCallback(async () => {
      const [i, p] = await Promise.all([db.incidents.getAll(), db.pets.getAll()]);
      setIncidents(i);
      setPets(p);
  }, []);

  useEffect(() => {
    refreshIncidents();
    window.addEventListener('dbUpdated', refreshIncidents);
    return () => {
      window.removeEventListener('dbUpdated', refreshIncidents);
    };
  }, [refreshIncidents]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      // FIX: Removed incorrect `Incident` type annotation.
      // The `db.incidents.add` service injects the `barangayId` automatically.
      const newIncident = {
        id: crypto.randomUUID(),
        petId: selectedPet ? selectedPet.id : undefined,
        victimName: formData.get('victimName') as string,
        victimContact: formData.get('victimContact') as string,
        date: formData.get('date') as string,
        location: formData.get('location') as string,
        description: formData.get('description') as string,
        bodyPartBitten: formData.get('bodyPart') as string,
        isProvoked: isProvoked === 'yes',
        status: 'Observation' as const,
        observationStartDate: formData.get('date') as string, // Usually starts incident date
      };

      await db.incidents.add(newIncident);
      toast.success('Incident reported. 10-day observation started.');
      setIsModalOpen(false);
      setSelectedPet(null);
      // No need to manually refresh; the event listener will handle it.
    } catch (error: any) {
      console.error("Bite Incident Report Error:", error);
      toast.error(error.message || "Failed to submit incident report.");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: Incident['status']) => {
    try {
      const incident = incidents.find(i => i.id === id);
      if (incident) {
        await db.incidents.update({ ...incident, status: newStatus });
        toast.success(`Status updated to ${newStatus}`);
        // No need to manually refresh; the event listener will handle it.
      }
    } catch (error: any) {
      console.error("Update Status Error:", error);
      toast.error(error.message || "Failed to update status.");
    }
  };

  const getObservationProgress = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, 10); // Cap at 10
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filter for modal search
  const searchResults = searchTerm ? pets.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0,3) : [];

  const contextOptions = [
    { label: 'Unprovoked', value: 'no' },
    { label: 'Provoked', value: 'yes' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bite Incidents</h1>
          <p className="text-slate-500 text-sm">Track animal bite cases and monitor observation periods.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-colors font-bold"
        >
          <Plus className="w-4 h-4" /> Report Incident
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><Activity className="w-6 h-6" /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{incidents.filter(i => i.status === 'Observation').length}</p>
            <p className="text-xs text-slate-500">Active Observation</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
             <p className="text-2xl font-bold text-slate-900">{incidents.filter(i => i.status === 'Cleared').length}</p>
             <p className="text-xs text-slate-500">Cleared / Healthy</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg"><AlertTriangle className="w-6 h-6" /></div>
          <div>
             <p className="text-2xl font-bold text-slate-900">{incidents.length}</p>
             <p className="text-xs text-slate-500">Total Reports</p>
          </div>
        </div>
      </div>

      {/* Active Incidents List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {incidents.map(incident => {
          const pet = pets.find(p => p.id === incident.petId);
          const daysPassed = getObservationProgress(incident.observationStartDate);
          const isOverdue = daysPassed >= 10 && incident.status === 'Observation';

          return (
            <div key={incident.id} className={`bg-white rounded-2xl border shadow-sm p-6 relative overflow-hidden ${isOverdue ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-100'}`}>
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${pet ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {pet ? <img src={pet.photoUrl} className="w-full h-full object-cover rounded-xl" /> : '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{pet ? pet.name : 'Stray / Unknown'}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {incident.location}</p>
                    </div>
                 </div>
                 <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                   incident.status === 'Observation' ? 'bg-amber-100 text-amber-700' : 
                   incident.status === 'Cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                 }`}>
                   {incident.status}
                 </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Victim</p>
                  <p className="font-semibold text-slate-700">{incident.victimName}</p>
                  <p className="text-xs text-slate-500">{incident.victimContact}</p>
                </div>
                <div>
                   <p className="text-xs text-slate-400">Incident Date</p>
                   <p className="font-semibold text-slate-700">{formatDateTime(incident.date)}</p>
                   <p className="text-xs text-slate-500">{incident.isProvoked ? 'Provoked' : 'Unprovoked'}</p>
                </div>
              </div>

              {/* Tracker */}
              {incident.status === 'Observation' && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observation Period</p>
                      <p className={`font-bold ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>Day {daysPassed} of 10</p>
                    </div>
                    {isOverdue && <span className="text-xs font-bold text-red-500 animate-pulse">Review Needed</span>}
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isOverdue ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ width: `${(daysPassed / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {incident.status === 'Observation' && (
                <div className="flex gap-2 pt-2 border-t border-slate-50">
                   <button onClick={() => handleStatusUpdate(incident.id, 'Cleared')} className="flex-1 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                     Mark as Healthy
                   </button>
                   <button onClick={() => handleStatusUpdate(incident.id, 'Deceased')} className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                     Report Death
                   </button>
                   <button onClick={() => handleStatusUpdate(incident.id, 'Escaped')} className="flex-1 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                     Escaped
                   </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal - Portal to avoid z-index stacking issues */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-slate-900">Report Bite Incident</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pet Link Search */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Biting Animal</label>
                  {!selectedPet ? (
                    <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                         type="text" 
                         placeholder="Search registered pet (optional)" 
                         className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                       />
                       {/* SEARCH RESULTS DROPDOWN */}
                       {searchResults.length > 0 && (
                         <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-lg mt-1 border border-slate-100 z-10">
                           {searchResults.map(p => (
                             <div key={p.id} onClick={() => {setSelectedPet(p); setSearchTerm('')}} className="p-2 hover:bg-blue-50 cursor-pointer text-sm flex items-center gap-2 text-slate-900">
                                <img src={p.photoUrl} className="w-6 h-6 rounded-full" />
                                {p.name}
                             </div>
                           ))}
                         </div>
                       )}
                       <p className="text-xs text-slate-400 mt-2">* Leave blank if stray/unknown.</p>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-100">
                       <div className="flex items-center gap-2">
                          <img src={selectedPet.photoUrl} className="w-8 h-8 rounded-lg" />
                          <span className="font-bold text-sm text-slate-800">{selectedPet.name}</span>
                       </div>
                       <button type="button" onClick={() => setSelectedPet(null)} className="text-xs text-red-500 font-medium">Remove</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Victim Name</label>
                     <input name="victimName" required className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Contact No.</label>
                     <input name="victimContact" required className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                   <input name="date" type="datetime-local" required className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Location of Incident</label>
                   <input name="location" placeholder="e.g. Purok 3, near Chapel" required className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Body Part Bitten</label>
                     <input name="bodyPart" placeholder="e.g. Right Leg" required className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
                   </div>
                   <div>
                      <CustomSelect 
                        label="Context"
                        value={isProvoked}
                        onChange={setIsProvoked}
                        options={contextOptions}
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                   <textarea name="description" rows={3} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"></textarea>
                </div>

                <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 mt-4">
                  Submit Incident Report
                </button>
             </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
    