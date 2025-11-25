
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { Pet, Owner, SystemSettings } from '../types';
import { Upload, Dog, User, Phone, Mail, Save, X, Loader2, Mars, Venus, Scissors, Check, MapPin, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { AddressSelector } from './AddressSelector';
import { CustomSelect } from './CustomSelect';

// --- BREED DATA CONSTANTS ---
const DOG_BREEDS = [
  { label: 'Aspin (Asong Pinoy)', value: 'Aspin' },
  { label: 'Akita', value: 'Akita' },
  { label: 'Alaskan Malamute', value: 'Alaskan Malamute' },
  { label: 'American Bully', value: 'American Bully' },
  { label: 'Beagle', value: 'Beagle' },
  { label: 'Belgian Malinois', value: 'Belgian Malinois' },
  { label: 'Bernese Mountain Dog', value: 'Bernese Mountain Dog' },
  { label: 'Bichon Frise', value: 'Bichon Frise' },
  { label: 'Border Collie', value: 'Border Collie' },
  { label: 'Boston Terrier', value: 'Boston Terrier' },
  { label: 'Boxer', value: 'Boxer' },
  { label: 'Bulldog (American)', value: 'Bulldog (American)' },
  { label: 'Bulldog (English)', value: 'Bulldog (English)' },
  { label: 'Bulldog (French)', value: 'Bulldog (French)' },
  { label: 'Bull Terrier', value: 'Bull Terrier' },
  { label: 'Cane Corso', value: 'Cane Corso' },
  { label: 'Cavalier King Charles', value: 'Cavalier King Charles' },
  { label: 'Chihuahua', value: 'Chihuahua' },
  { label: 'Chow Chow', value: 'Chow Chow' },
  { label: 'Corgi (Pembroke/Cardigan)', value: 'Corgi' },
  { label: 'Dachshund', value: 'Dachshund' },
  { label: 'Dalmatian', value: 'Dalmatian' },
  { label: 'Doberman Pinscher', value: 'Doberman Pinscher' },
  { label: 'German Shepherd', value: 'German Shepherd' },
  { label: 'Golden Retriever', value: 'Golden Retriever' },
  { label: 'Great Dane', value: 'Great Dane' },
  { label: 'Greyhound', value: 'Greyhound' },
  { label: 'Jack Russell Terrier', value: 'Jack Russell Terrier' },
  { label: 'Japanese Spitz', value: 'Japanese Spitz' },
  { label: 'Labrador Retriever', value: 'Labrador Retriever' },
  { label: 'Lhasa Apso', value: 'Lhasa Apso' },
  { label: 'Maltese', value: 'Maltese' },
  { label: 'Mastiff', value: 'Mastiff' },
  { label: 'Miniature Pinscher', value: 'Miniature Pinscher' },
  { label: 'Mixed Breed / Crossbreed', value: 'Mixed Breed' },
  { label: 'Papillon', value: 'Papillon' },
  { label: 'Pekingese', value: 'Pekingese' },
  { label: 'Pitbull', value: 'Pitbull' },
  { label: 'Pomeranian', value: 'Pomeranian' },
  { label: 'Poodle (Standard/Mini/Toy)', value: 'Poodle' },
  { label: 'Pug', value: 'Pug' },
  { label: 'Rottweiler', value: 'Rottweiler' },
  { label: 'Saint Bernard', value: 'Saint Bernard' },
  { label: 'Samoyed', value: 'Samoyed' },
  { label: 'Schnauzer', value: 'Schnauzer' },
  { label: 'Shar Pei', value: 'Shar Pei' },
  { label: 'Shih Tzu', value: 'Shih Tzu' },
  { label: 'Siberian Husky', value: 'Siberian Husky' },
  { label: 'Yorkshire Terrier', value: 'Yorkshire Terrier' },
  { label: 'Other / Unknown', value: 'Other' }
];

const CAT_BREEDS = [
  { label: 'Puspin (Pusang Pinoy)', value: 'Puspin' },
  { label: 'Abyssinian', value: 'Abyssinian' },
  { label: 'American Curl', value: 'American Curl' },
  { label: 'American Shorthair', value: 'American Shorthair' },
  { label: 'Bengal', value: 'Bengal' },
  { label: 'Birman', value: 'Birman' },
  { label: 'British Shorthair', value: 'British Shorthair' },
  { label: 'Burmese', value: 'Burmese' },
  { label: 'Calico', value: 'Calico' },
  { label: 'Exotic Shorthair', value: 'Exotic Shorthair' },
  { label: 'Himalayan', value: 'Himalayan' },
  { label: 'Maine Coon', value: 'Maine Coon' },
  { label: 'Mixed Breed / Crossbreed', value: 'Mixed Breed' },
  { label: 'Munchkin', value: 'Munchkin' },
  { label: 'Norwegian Forest', value: 'Norwegian Forest' },
  { label: 'Persian', value: 'Persian' },
  { label: 'Ragdoll', value: 'Ragdoll' },
  { label: 'Russian Blue', value: 'Russian Blue' },
  { label: 'Scottish Fold', value: 'Scottish Fold' },
  { label: 'Siamese', value: 'Siamese' },
  { label: 'Siberian', value: 'Siberian' },
  { label: 'Sphynx', value: 'Sphynx' },
  { label: 'Tabby (Pattern)', value: 'Tabby' },
  { label: 'Tortoiseshell', value: 'Tortoiseshell' },
  { label: 'Turkish Angora', value: 'Turkish Angora' },
  { label: 'Tuxedo (Pattern)', value: 'Tuxedo' },
  { label: 'Other / Unknown', value: 'Other' }
];

interface RegisterPetProps {
  onSuccess: (petId: string) => void;
  onCancel: () => void;
}

export const RegisterPet: React.FC<RegisterPetProps> = ({ onSuccess, onCancel }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Address Management
  const [fullAddress, setFullAddress] = useState<string>('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isManualAddress, setIsManualAddress] = useState(false);
  const [purok, setPurok] = useState('');

  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('Male');
  const [spayed, setSpayed] = useState('no');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset Breed when Species changes
  useEffect(() => {
    setBreed('');
  }, [species]);

  // Fetch System Settings for Context
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const session = localStorage.getItem('staff_session');
            if (session) {
                const { barangayId } = JSON.parse(session);
                if (barangayId) {
                    const s = await db.settings.getByBarangayId(barangayId);
                    setSettings(s);
                }
            }
        } catch (e) {
            console.error("Failed to load location context", e);
            setIsManualAddress(true); // Fallback to manual if settings fail
        }
    };
    fetchSettings();
  }, []);

  // Sync simplified address when in resident mode
  useEffect(() => {
    if (!isManualAddress && settings) {
        const cleanPurok = purok.trim();
        // Construct: "Purok 1, Barangay Name, Municipality"
        // We omit Region/Province in quick mode to keep it clean, as local uniqueness is usually sufficient
        const constructed = `${cleanPurok ? cleanPurok + ', ' : ''}Barangay ${settings.barangayName}, ${settings.municipality}`;
        setFullAddress(constructed);
    }
  }, [purok, isManualAddress, settings]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullAddress) { toast.error("Complete address required."); return; }
    
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Generate Standard UUIDs for database compatibility
    const ownerId = crypto.randomUUID();
    const petId = crypto.randomUUID();
    
    try {
      // Create Owner - db service will add barangayId
      await db.owners.add({
        id: ownerId,
        fullName: formData.get('ownerName') as string,
        contactNumber: formData.get('contactNumber') as string,
        address: fullAddress, // Uses the constructed or selected address
        email: formData.get('email') as string || undefined,
      });

      // Create Pet - db service will add barangayId
      await db.pets.add({
        id: petId,
        ownerId: ownerId,
        name: formData.get('petName') as string,
        species: formData.get('species') as 'Dog' | 'Cat',
        breed: formData.get('breed') as string,
        color: formData.get('color') as string,
        sex: formData.get('sex') as 'Male' | 'Female',
        birthDate: formData.get('birthDate') as string,
        isSpayedNeutered: formData.get('spayed') === 'yes',
        photoUrl: imagePreview || '',
        registrationDate: new Date().toISOString().split('T')[0],
        status: 'Alive',
      });

      await db.notifications.add({
        title: 'New Pet Registered',
        message: `${formData.get('petName')} added.`,
        type: 'success'
      });

      toast.success("Registration complete!");
      onSuccess(petId);
    } catch (error: any) {
      console.error("Registration Error:", error);
      // Show the actual error message from Supabase/DB
      toast.error(error.message || "Failed to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentBreedOptions = species === 'Dog' ? DOG_BREEDS : CAT_BREEDS;

  return (
    <div className="animate-in fade-in pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Register New Pet</h1>
        <button onClick={onCancel} className="text-slate-400 p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50"><X /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 h-fit">
             <h3 className="font-bold text-slate-800 flex gap-2"><User className="w-5 h-5 text-indigo-600" /> Owner Details</h3>
             
             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Owner Name <span className="text-red-500">*</span></label>
                <input type="text" name="ownerName" required className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Full Name" />
             </div>
             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Contact Number <span className="text-red-500">*</span></label>
                <input type="tel" name="contactNumber" required className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Contact No." />
             </div>
             
             {/* SMART ADDRESS SELECTION */}
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                    {settings && (
                        <button 
                            type="button"
                            onClick={() => {
                                setIsManualAddress(!isManualAddress);
                                setPurok('');
                                setFullAddress('');
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                            {isManualAddress ? <MapPin className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            {isManualAddress ? "Use Resident Quick-Entry" : "Enter Manually / Non-Resident"}
                        </button>
                    )}
                </div>

                {!isManualAddress && settings ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                        <input 
                            type="text"
                            value={purok}
                            onChange={(e) => setPurok(e.target.value)}
                            placeholder="Purok / Street / House No."
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 text-sm"
                        />
                        <div className="flex items-start gap-2 text-xs text-slate-500 px-1">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>
                                <span className="font-semibold">Automatic Suffix:</span> Brgy. {settings.barangayName}, {settings.municipality}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in">
                        <AddressSelector onAddressChange={setFullAddress} />
                    </div>
                )}
             </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
             <h3 className="font-bold text-slate-800 flex gap-2"><Dog className="w-5 h-5 text-blue-600" /> Pet Info</h3>
             
             <div className="flex justify-center mb-4">
                <div onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 overflow-hidden group relative">
                   {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <Upload className="text-slate-400 group-hover:text-blue-500 transition-colors" />}
                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} accept="image/*" />
                   {!imagePreview && <span className="absolute bottom-6 text-[10px] text-slate-400 group-hover:text-blue-500 font-medium">Upload Photo</span>}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Pet Name <span className="text-red-500">*</span></label>
                    <input name="petName" required className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Bantay" />
                </div>
                <CustomSelect label="Species" name="species" value={species} onChange={setSpecies} options={[{label: 'Dog', value: 'Dog'}, {label: 'Cat', value: 'Cat'}]} />
                <div>
                    <CustomSelect 
                      label="Breed" 
                      name="breed" 
                      value={breed} 
                      onChange={setBreed} 
                      options={currentBreedOptions}
                      placeholder="Search Breed..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Color</label>
                    <input name="color" className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. Brown/White" />
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {/* Sex Selection */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sex</label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setSex('Male')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${sex === 'Male' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                        >
                            <Mars className="w-5 h-5" />
                            <span className="font-bold text-sm">Male</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSex('Female')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${sex === 'Female' ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                        >
                            <Venus className="w-5 h-5" />
                            <span className="font-bold text-sm">Female</span>
                        </button>
                    </div>
                    <input type="hidden" name="sex" value={sex} />
                 </div>

                 {/* Spayed/Neutered Selection */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        Spayed / Neutered
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setSpayed('yes')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${spayed === 'yes' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                        >
                            <Scissors className="w-4 h-4" />
                            <span className="font-bold text-sm">Yes</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSpayed('no')}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${spayed === 'no' ? 'border-slate-500 bg-slate-100 text-slate-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white hover:bg-slate-50'}`}
                        >
                            <X className="w-4 h-4" />
                            <span className="font-bold text-sm">No</span>
                        </button>
                    </div>
                    <input type="hidden" name="spayed" value={spayed} />
                 </div>
             </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 sticky bottom-0 bg-[#f1f5f9] pb-4 z-10">
           <button type="button" onClick={onCancel} className="px-6 py-3 text-slate-600 font-medium mr-4 hover:text-slate-800 transition-colors">Cancel</button>
           <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:bg-blue-400">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} Register Pet
           </button>
        </div>
      </form>
    </div>
  );
};
