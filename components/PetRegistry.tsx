

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { Search, Filter, Eye, LayoutGrid, List as ListIcon, MoreHorizontal, Database, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Pet, Owner, Vaccination } from '../types';
import toast from 'react-hot-toast';

interface PetRegistryProps {
  onSelectPet: (petId: string) => void;
  userRole: string;
}

export const PetRegistry: React.FC<PetRegistryProps> = ({ onSelectPet, userRole }) => {
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Delete State
  const [verifyDeleteId, setVerifyDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [p, o, v] = await Promise.all([
      db.pets.getAll(),
      db.owners.getAll(),
      db.vaccinations.getAll()
    ]);
    setPets(p);
    setOwners(o);
    setVaccinations(v);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('dbUpdated', fetchData);
    return () => {
      window.removeEventListener('dbUpdated', fetchData);
    };
  }, [fetchData]);

  const getOwnerName = (id: string) => owners.find(o => o.id === id)?.fullName || 'Unknown';
  const getOwnerAddress = (id: string) => owners.find(o => o.id === id)?.address || '';
  
  const getVaccinationStatus = (petId: string) => {
    // Logic Update: Check for any vaccine type containing "Core" (Rabies or Multi)
    const latest = vaccinations
      .filter(v => v.petId === petId && v.vaccineType.includes('Core'))
      .sort((a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime())[0];
    
    if (!latest) return 'Unvaccinated';
    
    // Logic Update: Check nextDueDate instead of expirationDate
    const isExpired = new Date(latest.nextDueDate) < new Date();
    return isExpired ? 'Expired' : 'Active';
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card click
    setVerifyDeleteId(id);
    setTimeout(() => {
      setVerifyDeleteId(prev => prev === id ? null : prev);
    }, 3000);
  };

  const executeDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setVerifyDeleteId(null);
    setDeletingId(id);
    const toastId = toast.loading('Deleting record...');

    try {
      await db.pets.delete(id);
      toast.success('Pet record deleted', { id: toastId });
      // List will refresh automatically via dbUpdated event
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.error(`Failed to delete: ${error.message}`, { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(search.toLowerCase()) || 
                          getOwnerName(pet.ownerId).toLowerCase().includes(search.toLowerCase()) ||
                          pet.id.toLowerCase().includes(search.toLowerCase());
    const matchesSpecies = filterSpecies === 'All' || pet.species === filterSpecies;
    return matchesSearch && matchesSpecies;
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Pet Database</h1>
          </div>
          <p className="text-slate-500 text-sm">Manage registered animals and monitor vaccination status.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
             onClick={() => setViewMode('list')}
             className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center sticky top-0 z-10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by pet name, owner, or ID..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border-none text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all ring-1 ring-slate-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl text-sm font-medium text-slate-600 border border-slate-100">
            <Filter className="w-4 h-4" />
            <select
              className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 w-full cursor-pointer outline-none"
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value)}
            >
              <option value="All">All Species</option>
              <option value="Dog">Dogs Only</option>
              <option value="Cat">Cats Only</option>
            </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPets.map((pet) => {
            const vacStatus = getVaccinationStatus(pet.id);
            const isConfirming = verifyDeleteId === pet.id;
            const isDeleting = deletingId === pet.id;

            return (
              <div 
                key={pet.id} 
                onClick={() => onSelectPet(pet.id)}
                className={`group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">{pet.id.substring(0,8)}...</div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{pet.name}</h3>
                      <p className="text-sm text-slate-500">{pet.breed}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">{getOwnerName(pet.ownerId).charAt(0)}</div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Owner</p>
                        <p className="text-sm font-medium text-slate-700 truncate">{getOwnerName(pet.ownerId)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                     <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${vacStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : vacStatus === 'Expired' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                       {vacStatus}
                     </span>
                     
                     {/* Admin Delete Button - Grid */}
                     {userRole === 'Admin' && (
                       <button 
                         onClick={(e) => isConfirming ? executeDelete(e, pet.id) : requestDelete(e, pet.id)}
                         disabled={isDeleting}
                         className={`p-1.5 rounded-lg transition-all ${isConfirming ? 'bg-red-600 text-white shadow-md' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                         title="Delete Record"
                       >
                         {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : isConfirming ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                       </button>
                     )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold">
                   <th className="px-6 py-4">Pet Profile</th>
                   <th className="px-6 py-4">Owner</th>
                   <th className="px-6 py-4">Health</th>
                   <th className="px-6 py-4 text-right">Action</th>
                </tr>
             </thead>
             <tbody>
               {filteredPets.map(pet => {
                 const isConfirming = verifyDeleteId === pet.id;
                 const isDeleting = deletingId === pet.id;
                 
                 return (
                   <tr key={pet.id} className={`hover:bg-slate-50 cursor-pointer border-b border-slate-50 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => onSelectPet(pet.id)}>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img src={pet.photoUrl} className="w-10 h-10 rounded-lg object-cover" />
                        <div><p className="font-bold text-slate-900">{pet.name}</p><p className="text-xs text-slate-500">{pet.breed}</p></div>
                      </td>
                      <td className="px-6 py-4"><p className="text-sm text-slate-700">{getOwnerName(pet.ownerId)}</p></td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">{getVaccinationStatus(pet.id)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {userRole === 'Admin' ? (
                           <button 
                             onClick={(e) => isConfirming ? executeDelete(e, pet.id) : requestDelete(e, pet.id)}
                             disabled={isDeleting}
                             className={`ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${isConfirming ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                           >
                             {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : isConfirming ? <span className="text-xs font-bold">Confirm?</span> : <Trash2 className="w-4 h-4" />}
                           </button>
                        ) : (
                           <MoreHorizontal className="w-5 h-5 text-slate-400 ml-auto" />
                        )}
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
};