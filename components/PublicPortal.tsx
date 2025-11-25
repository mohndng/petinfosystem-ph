
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { AnnouncementFeed } from './AnnouncementFeed';
import { StrayReports } from './StrayReports';
import { Dog, Syringe, ShieldCheck, Search, ArrowRight, Activity, MapPin, Phone, Mail, Megaphone, LogIn, Loader2 } from 'lucide-react';
import { Announcement, SystemSettings, Pet, Vaccination } from '../types';

interface PublicPortalProps {
  publicContext: SystemSettings;
  onLoginClick: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ publicContext, onLoginClick }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'strays'>('home');
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<{name: string, status: string, vaccine: string} | 'not_found' | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccs, setVaccs] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);

  // Set the barangayId in session storage for the db service to use
  useEffect(() => {
    if (publicContext?.barangayId) {
      sessionStorage.setItem('public_barangay_id', publicContext.barangayId);
    }
    return () => {
      sessionStorage.removeItem('public_barangay_id');
    };
  }, [publicContext]);
  
  const fetchData = useCallback(async () => {
    if (!publicContext?.barangayId) return;
    setLoading(true);
    const [a, p, v] = await Promise.all([
        db.announcements.getAll(),
        db.pets.getAll(),
        db.vaccinations.getAll()
    ]);
    setAnnouncements(a);
    setPets(p);
    setVaccs(v);
    setLoading(false);
  }, [publicContext]);

  useEffect(() => {
    fetchData();
    window.addEventListener('dbUpdated', fetchData);
    return () => {
      window.removeEventListener('dbUpdated', fetchData);
    };
  }, [fetchData]);
  
  // Public Stats (Anonymized)
  const stats = {
    totalPets: pets.length,
    vaccinatedRate: pets.length ? Math.round((new Set(vaccs.filter(v => new Date(v.nextDueDate) > new Date()).map(v => v.petId)).size / pets.length) * 100) : 0,
    recentEvents: announcements.filter(a => a.category === 'Event' || a.category === 'Health').length
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;
    setIsSearching(true);
    setSearchResult(null);
    
    // The db.pets.get is already scoped by barangayId via session storage
    const pet = await db.pets.get(searchId.trim());
    
    if (pet) {
      const latestVac = vaccs
        .filter(v => v.petId === pet.id && v.vaccineType.includes('Core'))
        .sort((a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime())[0];
      
      const isVacValid = latestVac && new Date(latestVac.nextDueDate) > new Date();

      setSearchResult({
        name: pet.name.charAt(0) + '*'.repeat(pet.name.length - 1), // Privacy masking
        status: pet.status,
        vaccine: isVacValid ? 'Vaccinated (Active)' : 'Needs Booster'
      });
    } else {
      setSearchResult('not_found');
    }
    setIsSearching(false);
  };

  // Dummy user for AnnouncementFeed which expects a user prop
  // Role set to 'Guest' to disable posting
  const publicUser = { id: 'public', username: 'Resident', role: 'Guest', fullName: 'Community Member' };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                 <Dog className="w-7 h-7 text-blue-600" />
               </div>
               <div>
                  <h1 className="text-lg font-bold text-slate-900">Brgy. {publicContext.barangayName}</h1>
                  <p className="text-xs text-slate-500">Community Pet Portal</p>
               </div>
            </div>
            <button 
              onClick={onLoginClick}
              className="px-4 py-2 bg-slate-800 text-white rounded-full text-xs font-bold shadow-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
            >
              <LogIn className="w-3 h-3" /> Official Login
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left/Main Column */}
          <div className="lg:col-span-8 space-y-12">
             
             {/* Verification Section */}
             <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-8 h-8 text-blue-600" /> Verify Pet Registration</h2>
                  <p className="text-slate-500 max-w-md mb-6">Enter the Registration ID from the certificate to check a pet's vaccination status.</p>
                  
                  <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm">
                    <input 
                      type="text"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      placeholder="Enter Pet ID..."
                      className="flex-1 px-5 py-3.5 border-2 border-slate-100 rounded-xl bg-white text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                    <button type="submit" className="px-5 py-3.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors font-bold flex items-center justify-center">
                      {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </button>
                  </form>

                  {searchResult && (
                    <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 animate-in fade-in">
                      {searchResult === 'not_found' ? (
                         <p className="text-center font-medium text-red-600">No pet found with this ID in our barangay.</p>
                      ) : (
                         <div className="grid grid-cols-3 divide-x divide-slate-200">
                           <div className="text-center px-2"><p className="text-xs text-slate-500">Pet Name</p><p className="font-bold text-slate-800">{searchResult.name}</p></div>
                           <div className="text-center px-2"><p className="text-xs text-slate-500">Status</p><p className="font-bold text-slate-800">{searchResult.status}</p></div>
                           <div className="text-center px-2"><p className="text-xs text-slate-500">Vaccine</p><p className={`font-bold ${searchResult.vaccine.includes('Active') ? 'text-emerald-600' : 'text-amber-600'}`}>{searchResult.vaccine}</p></div>
                         </div>
                      )}
                    </div>
                  )}
                </div>
             </div>

             {/* Navigation Tabs */}
             <div className="flex border-b border-slate-200">
                <button onClick={() => setActiveTab('home')} className={`px-4 py-3 text-sm font-bold ${activeTab === 'home' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
                    <Megaphone className="w-4 h-4 inline-block mr-2" /> Announcements
                </button>
                <button onClick={() => setActiveTab('strays')} className={`px-4 py-3 text-sm font-bold ${activeTab === 'strays' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
                    <Dog className="w-4 h-4 inline-block mr-2" /> Stray Reports
                </button>
             </div>

             {/* Tab Content */}
             {activeTab === 'home' && (
                <div className="animate-in fade-in">
                  <AnnouncementFeed user={publicUser} />
                </div>
             )}
             {activeTab === 'strays' && (
                <div className="animate-in fade-in">
                  <StrayReports isPublicView={true} />
                </div>
             )}

          </div>

          {/* Right/Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Barangay Stats */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Community Snapshot</h3>
              <div className="space-y-4">
                  <StatCard icon={<Dog/>} value={stats.totalPets} title="Registered Pets" color="blue" />
                  <StatCard icon={<Syringe/>} value={`${stats.vaccinatedRate}%`} title="Vaccination Coverage" color="emerald" />
                  <StatCard icon={<Activity/>} value={stats.recentEvents} title="Health Events" color="purple" />
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Contact Information</h3>
              <div className="space-y-4 text-sm">
                <ContactInfo icon={<MapPin/>} label="Address" value={`Barangay Hall, ${publicContext.barangayName}, ${publicContext.municipality}`} />
                <ContactInfo icon={<Phone/>} label="Emergency Hotline" value={publicContext.emergencyHotline} />
                <ContactInfo icon={<Mail/>} label="Support Email" value={publicContext.supportEmail} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({icon, value, title, color}: any) => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}-100 text-${color}-600`}>{icon}</div>
        <div>
            <p className={`text-xl font-bold text-slate-900`}>{value}</p>
            <p className="text-xs text-slate-500">{title}</p>
        </div>
    </div>
);

const ContactInfo = ({icon, label, value}: any) => (
    <div className="flex items-start gap-3">
        <div className="w-8 h-8 flex-shrink-0 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">{icon}</div>
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-semibold text-slate-800">{value}</p>
        </div>
    </div>
);
