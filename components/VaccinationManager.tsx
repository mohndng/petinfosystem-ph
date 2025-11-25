
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { Pet, Vaccination, Owner } from '../types';
import { Syringe, Search, Clock, CheckCircle, Thermometer, Weight, FileBadge, Stethoscope, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomSelect } from './CustomSelect';

// PH Veterinary Vaccine Database - Refined Types
const PH_VACCINE_DB = [
  // RABIES (Core - Required by Law)
  { label: 'Nobivac Rabies (MSD)', value: 'Nobivac Rabies', manufacturer: 'MSD Animal Health', type: 'Core - Anti-Rabies', durationMonths: 12 },
  { label: 'Defensor 3 (Zoetis)', value: 'Defensor 3', manufacturer: 'Zoetis', type: 'Core - Anti-Rabies', durationMonths: 12 },
  { label: 'Rabisin (Boehringer)', value: 'Rabisin', manufacturer: 'Boehringer Ingelheim', type: 'Core - Anti-Rabies', durationMonths: 12 },
  { label: 'Rabvac 3 (Elanco)', value: 'Rabvac 3', manufacturer: 'Elanco', type: 'Core - Anti-Rabies', durationMonths: 12 },
  
  // 5-in-1 / 6-in-1 / 8-in-1 (Core - Multi-Disease)
  { label: 'Vanguard 5/L (Zoetis)', value: 'Vanguard 5/L', manufacturer: 'Zoetis', type: 'Core - Multi (5-in-1)', durationMonths: 12 },
  { label: 'Nobivac DHPPi (MSD)', value: 'Nobivac DHPPi', manufacturer: 'MSD Animal Health', type: 'Core - Multi (5-in-1)', durationMonths: 12 },
  { label: 'Canigen DHPPi (Virbac)', value: 'Canigen DHPPi', manufacturer: 'Virbac', type: 'Core - Multi (5-in-1)', durationMonths: 12 },
  { label: 'Eurican DHPPi2-L (Boehringer)', value: 'Eurican DHPPi2-L', manufacturer: 'Boehringer Ingelheim', type: 'Core - Multi (6-in-1)', durationMonths: 12 },
  { label: 'Biocan DHPPi (Bioveta)', value: 'Biocan DHPPi', manufacturer: 'Bioveta', type: 'Core - Multi (5-in-1)', durationMonths: 12 },
  
  // KENNEL COUGH (Non-Core)
  { label: 'Nobivac KC (Intranasal)', value: 'Nobivac KC', manufacturer: 'MSD Animal Health', type: 'Non-Core (Optional)', durationMonths: 12 },
  { label: 'Bronchicine CAe (Injectable)', value: 'Bronchicine CAe', manufacturer: 'Zoetis', type: 'Non-Core (Optional)', durationMonths: 12 },

  // DEWORMING
  { label: 'Drontal Plus (Tablet)', value: 'Drontal Plus', manufacturer: 'Elanco', type: 'Deworming', durationMonths: 3 },
  { label: 'Canex (Suspension/Tablet)', value: 'Canex', manufacturer: 'Zoetis', type: 'Deworming', durationMonths: 3 },
  { label: 'Nematel (Suspension)', value: 'Nematel', manufacturer: 'Univet', type: 'Deworming', durationMonths: 3 },
  { label: 'NexGard Spectra (Chewable)', value: 'NexGard Spectra', manufacturer: 'Boehringer Ingelheim', type: 'Deworming', durationMonths: 1 },
  
  // ECTOPARASITE (Tick & Flea)
  { label: 'Bravecto (Chewable)', value: 'Bravecto', manufacturer: 'MSD Animal Health', type: 'External Parasite', durationMonths: 3 },
  { label: 'Simparica (Chewable)', value: 'Simparica', manufacturer: 'Zoetis', type: 'External Parasite', durationMonths: 1 },
  { label: 'NexGard (Chewable)', value: 'NexGard', manufacturer: 'Boehringer Ingelheim', type: 'External Parasite', durationMonths: 1 },
];

export const VaccinationManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [recentVacs, setRecentVacs] = useState<Vaccination[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);

  const fetchData = useCallback(async () => {
    const [v, p, o] = await Promise.all([
      db.vaccinations.getAll(),
      db.pets.getAll(),
      db.owners.getAll()
    ]);
    setRecentVacs(v);
    setPets(p);
    setOwners(o);
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('dbUpdated', fetchData);
    return () => {
      window.removeEventListener('dbUpdated', fetchData);
    };
  }, [fetchData]);
  
  // Extended Form State based on PH Veterinary Standards
  const [formData, setFormData] = useState({
    vaccineType: 'Core - Anti-Rabies',
    vaccineName: '',
    manufacturer: '',
    lotNumber: '',
    dateGiven: new Date().toISOString().split('T')[0],
    expirationDate: '', // Batch Expiry
    nextDueDate: '',
    veterinarian: '',
    vetLicenseNo: '',
    clinicName: 'Barangay Health Center',
    weightKg: '',
    temperature: '',
    notes: ''
  });

  const calculateDueDate = (dateGiven: string, months: number) => {
    const date = new Date(dateGiven);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };

  const handleProductChange = (productName: string) => {
    const product = PH_VACCINE_DB.find(p => p.value === productName);
    
    if (product) {
      const nextDue = calculateDueDate(formData.dateGiven, product.durationMonths);
      setFormData(prev => ({
        ...prev,
        vaccineName: product.value,
        manufacturer: product.manufacturer,
        vaccineType: product.type,
        nextDueDate: nextDue
      }));
    } else {
      setFormData(prev => ({ ...prev, vaccineName: productName }));
    }
  };

  const handleDateChange = (dateGiven: string) => {
    // Try to find current product to recalc date
    const product = PH_VACCINE_DB.find(p => p.value === formData.vaccineName);
    let nextDue = formData.nextDueDate;
    
    if (product) {
      nextDue = calculateDueDate(dateGiven, product.durationMonths);
    } else {
      // Fallback default logic
      const isDeworm = formData.vaccineType === 'Deworming';
      nextDue = calculateDueDate(dateGiven, isDeworm ? 3 : 12);
    }

    setFormData(prev => ({
      ...prev,
      dateGiven,
      nextDueDate: nextDue
    }));
  };

  const filteredPets = useMemo(() => {
    if (!searchTerm) return [];
    return pets.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owners.find(o => o.id === p.ownerId)?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm, pets, owners]);

  const expiringVaccinations = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return recentVacs.filter(v => {
      const expDate = new Date(v.nextDueDate);
      return expDate > now && expDate <= thirtyDaysFromNow;
    }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [recentVacs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) {
      toast.error("Please select a pet first");
      return;
    }

    // Validation for legally required fields
    if (!formData.lotNumber || !formData.veterinarian) {
      toast.error("Lot No. and Veterinarian are required for legal validity.");
      return;
    }

    if (!formData.vaccineName) {
      toast.error("Please select a vaccine product.");
      return;
    }

    // Validate PRC License format if provided
    if (formData.vetLicenseNo && formData.vetLicenseNo.length !== 7) {
        toast.error("PRC License No. must be exactly 7 digits.");
        return;
    }

    try {
      // The `db.vaccinations.add` service injects the `barangayId` automatically.
      const newVac = {
        id: crypto.randomUUID(),
        petId: selectedPet.id,
        vaccineType: formData.vaccineType as any,
        vaccineName: formData.vaccineName,
        manufacturer: formData.manufacturer,
        lotNumber: formData.lotNumber,
        dateGiven: formData.dateGiven,
        expirationDate: formData.expirationDate || formData.nextDueDate, // Fallback to due date if batch expiry not provided
        nextDueDate: formData.nextDueDate,
        veterinarian: formData.veterinarian,
        vetLicenseNo: formData.vetLicenseNo,
        clinicName: formData.clinicName,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        notes: formData.notes
      };

      await db.vaccinations.add(newVac);
      await db.notifications.add({
        title: 'Pet Vaccinated',
        message: `${selectedPet.name} received ${newVac.vaccineName}. Next due: ${newVac.nextDueDate}`,
        type: 'info'
      });

      // No need to manually refresh; the dbUpdated event will trigger it.
      toast.success(`Record added for ${selectedPet.name}`);
      
      setSelectedPet(null);
      setSearchTerm('');
      setFormData({
        vaccineType: 'Core - Anti-Rabies',
        vaccineName: '',
        manufacturer: '',
        lotNumber: '',
        dateGiven: new Date().toISOString().split('T')[0],
        expirationDate: '',
        nextDueDate: '',
        veterinarian: '',
        vetLicenseNo: '',
        clinicName: 'Barangay Health Center',
        weightKg: '',
        temperature: '',
        notes: ''
      });
    } catch (error: any) {
      console.error("Vaccination Submit Error:", error);
      toast.error(error.message || "Failed to save vaccination record.");
    }
  };

  const vaccineTypeOptions = [
    { label: 'Core - Anti-Rabies (Mandatory)', value: 'Core - Anti-Rabies' },
    { label: 'Core - Multi (5-in-1 / 6-in-1)', value: 'Core - Multi (5-in-1)' },
    { label: 'Non-Core (Optional)', value: 'Non-Core (Optional)' },
    { label: 'Deworming', value: 'Deworming' },
    { label: 'External Parasite', value: 'External Parasite' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
      {/* Left Column: Professional Form */}
      <div className="lg:col-span-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Vaccination Record</h1>
          <p className="text-slate-500 text-sm">Official immunization logging compliant with <span className="font-semibold text-blue-600">RA 9482 (Anti-Rabies Act)</span>.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">New Medical Entry</h2>
              <p className="text-xs text-slate-500">Ensure patient vitals are checked before administration.</p>
            </div>
          </div>

          {/* Search Area */}
          <div className="relative mb-8 z-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Patient (Name, ID, or Owner)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 shadow-sm"
              />
            </div>

            {searchTerm && !selectedPet && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                {filteredPets.length > 0 ? (
                  filteredPets.map(pet => {
                    const owner = owners.find(o => o.id === pet.ownerId);
                    return (
                      <div 
                        key={pet.id} 
                        onClick={() => { setSelectedPet(pet); setSearchTerm(''); }}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-none"
                      >
                        <img src={pet.photoUrl} alt={pet.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{pet.name} <span className="text-xs font-normal text-slate-500">({pet.species})</span></p>
                          <p className="text-xs text-slate-500">Owner: {owner?.fullName}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-500 text-sm">No patient found.</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Patient Card */}
          {selectedPet && (
            <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between animate-in zoom-in-95">
              <div className="flex items-center gap-4">
                <img src={selectedPet.photoUrl} alt={selectedPet.name} className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm" />
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">{selectedPet.name}</h3>
                  <div className="flex gap-3 text-xs text-blue-700 mt-1">
                     <span className="bg-blue-100 px-2 py-0.5 rounded">{selectedPet.species}</span>
                     <span className="bg-blue-100 px-2 py-0.5 rounded">{selectedPet.breed}</span>
                     <span className="bg-blue-100 px-2 py-0.5 rounded">{selectedPet.sex}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPet(null)} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg font-medium transition-colors">Change Patient</button>
            </div>
          )}

          {/* Medical Form */}
          <form onSubmit={handleSubmit} className={`space-y-6 transition-all duration-500 ${!selectedPet ? 'opacity-40 pointer-events-none blur-[1px]' : 'opacity-100'}`}>
            
            {/* Vitals Section */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <div className="col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pre-Vaccination Vitals</div>
               <div>
                 <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                   <Weight className="w-4 h-4 text-slate-400" /> Weight (kg)
                 </label>
                 <input 
                    type="number" step="0.1" 
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({...formData, weightKg: e.target.value})}
                    placeholder="0.0 kg"
                 />
               </div>
               <div>
                 <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                   <Thermometer className="w-4 h-4 text-slate-400" /> Temp (°C)
                 </label>
                 <input 
                    type="number" step="0.1" 
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    value={formData.temperature}
                    onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                    placeholder="38.0 °C"
                 />
               </div>
            </div>

            {/* Vaccine Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="md:col-span-2">
                <CustomSelect 
                  label="Select Product (Auto-fills details)"
                  value={formData.vaccineName}
                  onChange={handleProductChange}
                  options={PH_VACCINE_DB} 
                  placeholder="Select Legitimate Vaccine Brand..."
                  required
                />
              </div>
              
              <div className="md:col-span-1">
                 <CustomSelect 
                   label="Vaccine Category"
                   value={formData.vaccineType}
                   onChange={(val) => setFormData({...formData, vaccineType: val})}
                   options={vaccineTypeOptions}
                 />
              </div>

              <div>
                 <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Manufacturer</label>
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium">
                   {formData.manufacturer || 'Select a product...'}
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lot / Batch No. <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="REQUIRED (e.g. A123-99)"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-mono"
                  value={formData.lotNumber}
                  onChange={(e) => setFormData({...formData, lotNumber: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vaccine Expiry Date</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                  title="Expiration date on the vaccine bottle"
                />
                <p className="text-[10px] text-slate-400 mt-1">Expiry date on the bottle (Optional)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Administered</label>
                <input 
                  type="date" 
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                  value={formData.dateGiven}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-700 mb-1">Next Due Date</label>
                <input 
                  type="date" 
                  className="w-full p-3 border-2 border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-slate-900 font-bold"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                />
                <p className="text-[10px] text-blue-400 mt-1">Valid until this date</p>
              </div>
            </div>

            {/* Provider Details */}
            <div className="pt-4 border-t border-slate-100">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Licensed Administrator</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Veterinarian / Vaccinator <span className="text-red-500">*</span></label>
                    <div className="relative">
                       <FileBadge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                        type="text" 
                        placeholder="Full Name (e.g. Dr. Jane Doe)"
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                        value={formData.veterinarian}
                        onChange={(e) => setFormData({...formData, veterinarian: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PRC License No.</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="7-digit License No."
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-mono"
                      value={formData.vetLicenseNo}
                      onChange={(e) => {
                        // Only numbers, max 7 digits
                        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
                        setFormData({...formData, vetLicenseNo: value});
                      }}
                      maxLength={7}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Clinic / LGU Office</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Barangay San Jose Health Center"
                      className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                      value={formData.clinicName}
                      onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Save Official Record
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Alerts */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
           <div className="p-5 border-b border-slate-100 bg-amber-50/50">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <Clock className="w-5 h-5 text-amber-600" /> Due for Booster
             </h3>
             <p className="text-xs text-slate-500 mt-1">Upcoming revaccinations (30 days)</p>
           </div>

           <div className="p-3 overflow-y-auto custom-scrollbar flex-1">
             {expiringVaccinations.length > 0 ? (
               expiringVaccinations.map(vac => {
                 const pet = pets.find(p => p.id === vac.petId);
                 const owner = owners.find(o => o.id === pet?.ownerId);
                 if (!pet) return null;
                 
                 const daysLeft = Math.ceil((new Date(vac.nextDueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

                 return (
                   <div key={vac.id} className="p-4 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all mb-2 group">
                      <div className="flex items-start gap-3">
                        <img src={pet.photoUrl} alt={pet.name} className="w-10 h-10 rounded-lg object-cover bg-slate-200" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{pet.name}</h4>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{daysLeft} days</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{owner?.fullName}</p>
                          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                            <Syringe className="w-3 h-3" /> {vac.vaccineName}
                          </p>
                        </div>
                      </div>
                   </div>
                 );
               })
             ) : (
               <div className="py-12 text-center text-slate-400">
                 <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                 <p className="text-sm font-medium">All clear!</p>
                 <p className="text-xs opacity-70">No upcoming expirations.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
