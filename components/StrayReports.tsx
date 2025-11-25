
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/db';
import { StrayReport } from '../types';
import { Ghost, MapPin, Camera, Plus, X, User, Check, Ban, AlertCircle, Clock, CheckCircle2, XCircle, ShieldAlert, Navigation, Phone, Locate, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomSelect } from './CustomSelect';

interface StrayReportsProps {
  isPublicView?: boolean;
}

export const StrayReports: React.FC<StrayReportsProps> = ({ isPublicView = false }) => {
  const [reports, setReports] = useState<StrayReport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [species, setSpecies] = useState('Dog');
  const [isEarTipped, setIsEarTipped] = useState('no');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // GPS State
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  // Admin Tabs
  const [adminTab, setAdminTab] = useState<'active' | 'pending'>('active');

  const refreshReports = useCallback(async () => {
    setReports(await db.strays.getAll());
  }, []);

  useEffect(() => {
    refreshReports();
    window.addEventListener('dbUpdated', refreshReports);
    return () => {
      window.removeEventListener('dbUpdated', refreshReports);
    };
  }, [refreshReports]);

  // Rate Limiting Logic (Client Side)
  const checkRateLimit = () => {
    const lastReportTime = localStorage.getItem('lastStrayReportTime');
    if (lastReportTime) {
      const diff = new Date().getTime() - parseInt(lastReportTime);
      const minutes = Math.floor(diff / 60000);
      if (minutes < 10) { // 10 minute cooldown
        return 10 - minutes;
      }
    }
    return 0;
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
        toast.success("Location coordinates attached!");
      },
      (error) => {
        console.error("GPS Error: ", error);
        setLocationError("Unable to retrieve location. Please check permissions.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const reporterName = formData.get('reporterName') as string;
    const reporterContact = formData.get('reporterContact') as string;

    // Rate Limit Check
    if (isPublicView) {
        const waitTime = checkRateLimit();
        if (waitTime > 0) {
            toast.error(`Please wait ${waitTime} minutes before submitting another report.`);
            setIsSubmitting(false);
            return;
        }
    }

    // Public Validation
    if (isPublicView) {
        if (!reporterName.trim()) {
            toast.error("Please enter your name.");
            setIsSubmitting(false);
            return;
        }
        if (!reporterContact.trim() || reporterContact.length < 10) {
            toast.error("Valid contact number is required for verification.");
            setIsSubmitting(false);
            return;
        }
    }
    
    try {
      const newReport = {
        id: crypto.randomUUID(),
        species: species as 'Dog' | 'Cat',
        location: formData.get('location') as string,
        description: formData.get('description') as string,
        photoUrl: imagePreview || 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=300&q=80',
        dateReported: new Date().toISOString().split('T')[0],
        status: (isPublicView ? 'Pending' : 'Reported') as StrayReport['status'], // Public reports default to Pending
        isEarTipped: isEarTipped === 'yes',
        reporterName: reporterName || 'Barangay Staff',
        reporterContact: reporterContact || '',
        latitude: gpsCoords?.lat,
        longitude: gpsCoords?.lng
      };

      await db.strays.add(newReport);
      
      if (isPublicView) {
        localStorage.setItem('lastStrayReportTime', new Date().getTime().toString());
        toast.success('Report submitted for approval. Thank you!');
      } else {
        await db.notifications.add({
          title: 'Stray Animal Logged',
          message: `Staff reported a stray ${newReport.species} at ${newReport.location}.`,
          type: 'info'
        });
        toast.success('Stray animal logged successfully');
      }

      setIsModalOpen(false);
      setImagePreview(null);
      setGpsCoords(null);
      
      // Reset form defaults
      setSpecies('Dog');
      setIsEarTipped('no');
    } catch (error: any) {
      console.error("Stray Report Error:", error);
      toast.error(error.message || "Failed to submit stray report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: StrayReport['status']) => {
    const toastId = toast.loading("Updating status...");
    try {
      await db.strays.update(id, status);
      
      if (status === 'Reported') {
         toast.success('Report Approved & Published', { id: toastId });
         await db.notifications.add({
            title: 'Stray Report Approved',
            message: 'A new community report has been verified.',
            type: 'success'
         });
      } else if (status === 'Rejected') {
         toast.success('Report Rejected', { id: toastId });
      } else {
         toast.success(`Status updated to ${status}`, { id: toastId });
      }
    } catch (error: any) {
      console.error("Status Change Error:", error);
      toast.error(error.message || "Failed to update status.", { id: toastId });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const speciesOptions = [
    { label: 'Dog', value: 'Dog' },
    { label: 'Cat', value: 'Cat' }
  ];

  const tnrOptions = [
    { label: 'Not Ear Tipped', value: 'no' },
    { label: 'Ear Tipped (Neutered)', value: 'yes' }
  ];

  // Filters
  const pendingReports = reports.filter(r => r.status === 'Pending');
  const activeReports = reports.filter(r => ['Reported', 'Captured', 'Resolved'].includes(r.status));
  
  const displayList = isPublicView ? activeReports : (adminTab === 'pending' ? pendingReports : activeReports);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stray Reports</h1>
          <p className="text-slate-500 text-sm">Community monitoring and TNR (Trap-Neuter-Return) tracking.</p>
        </div>
        
        {!isPublicView && (
           <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
              <button 
                onClick={() => setAdminTab('active')} 
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${adminTab === 'active' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Database
              </button>
              <button 
                onClick={() => setAdminTab('pending')} 
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${adminTab === 'pending' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Approvals 
                {pendingReports.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{pendingReports.length}</span>
                )}
              </button>
           </div>
        )}

        {/* Report Button - Public always, Admin only on Active tab */}
        {(isPublicView || adminTab === 'active') && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg transition-colors font-bold ${isPublicView ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <Plus className="w-4 h-4" /> {isPublicView ? 'Report Sighting' : 'Log Stray'}
            </button>
        )}
      </div>

      {/* Admin Pending Banner */}
      {!isPublicView && adminTab === 'pending' && pendingReports.length > 0 && (
         <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
               <h3 className="text-sm font-bold text-amber-800">Verification Required</h3>
               <p className="text-xs text-amber-700 mt-1">
                  You have {pendingReports.length} pending report(s). Please verify the contact number and location before approval.
               </p>
            </div>
         </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayList.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="relative h-48 bg-slate-100 overflow-hidden">
               <img src={report.photoUrl} alt="Stray" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
               <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                 {report.latitude && (
                   <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
                     <Locate className="w-3 h-3" /> GPS
                   </span>
                 )}
                 {report.isEarTipped && (
                   <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-sm">
                     Ear Tipped
                   </span>
                 )}
                 <span className={`text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-sm ${
                   report.status === 'Reported' ? 'bg-red-500/90 text-white' :
                   report.status === 'Captured' ? 'bg-amber-500/90 text-white' :
                   report.status === 'Resolved' ? 'bg-blue-500/90 text-white' :
                   'bg-slate-700/90 text-white' // Pending
                 }`}>
                   {report.status}
                 </span>
               </div>
               <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                 <p className="text-white text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {report.location}</p>
               </div>
            </div>
            
            <div className="p-4">
               <div className="flex justify-between items-start mb-2">
                 <p className="text-sm text-slate-700 font-medium line-clamp-2">{report.description}</p>
               </div>
               
               <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                 <User className="w-3 h-3" /> Reported by <span className="font-semibold">{report.reporterName || 'Anonymous'}</span>
               </p>
               
               {!isPublicView && report.reporterContact && (
                 <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                   <Phone className="w-3 h-3" /> {report.reporterContact}
                 </p>
               )}

               <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                 <Clock className="w-3 h-3" /> {report.dateReported}
               </p>
               
               {/* ADMIN ACTIONS */}
               {!isPublicView && (
                 <div className="flex gap-2 border-t border-slate-50 pt-3">
                   {/* PENDING ACTIONS */}
                   {report.status === 'Pending' && (
                     <>
                       <button 
                        onClick={() => handleStatusChange(report.id, 'Reported')}
                        className="flex-1 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                       >
                         <CheckCircle2 className="w-3 h-3" /> Approve
                       </button>
                       <button 
                        onClick={() => handleStatusChange(report.id, 'Rejected')}
                        className="flex-1 py-2 text-xs font-bold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                       >
                         <XCircle className="w-3 h-3" /> Reject
                       </button>
                     </>
                   )}

                   {/* ACTIVE ACTIONS */}
                   {report.status === 'Reported' && (
                     <button 
                      onClick={() => handleStatusChange(report.id, 'Captured')}
                      className="flex-1 py-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                     >
                       Mark Captured
                     </button>
                   )}
                   {report.status === 'Captured' && (
                     <button 
                      onClick={() => handleStatusChange(report.id, 'Resolved')}
                      className="flex-1 py-2 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                     >
                       Mark Resolved
                     </button>
                   )}
                   {report.status === 'Resolved' && (
                     <div className="w-full text-center text-xs text-slate-400 font-medium py-1.5 bg-slate-50 rounded-lg flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Case Closed
                     </div>
                   )}
                 </div>
               )}
               
               {/* PUBLIC VIEW FOOTER */}
               {isPublicView && (
                 <div className="pt-2 border-t border-slate-50">
                    <p className="text-xs text-slate-400 italic text-center">
                      {report.status === 'Resolved' ? 'Case Resolved by LGU' : 'Under LGU Monitoring'}
                    </p>
                 </div>
               )}
            </div>
          </div>
        ))}

        {displayList.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <Ghost className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No reports found.</p>
            {!isPublicView && adminTab === 'pending' && (
                <p className="text-xs mt-1">All community reports have been processed.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal - Use Portal to avoid z-index/stacking context issues with sticky headers */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {isPublicView ? 'Report Stray Sighting' : 'Log Stray Animal'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="flex justify-center mb-4">
                    <label className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-slate-300 mb-2" />
                          <span className="text-xs text-slate-500">Upload Photo</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                 </div>

                 {isPublicView && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                       <div>
                         <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Your Name <span className="text-red-500">*</span></label>
                         <input 
                           name="reporterName" 
                           required 
                           placeholder="Full Name" 
                           className="w-full p-2.5 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm" 
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Contact Number <span className="text-red-500">*</span></label>
                         <input 
                           name="reporterContact" 
                           required 
                           type="tel"
                           placeholder="09XXXXXXXXX" 
                           className="w-full p-2.5 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm" 
                         />
                         <p className="text-[10px] text-blue-500 mt-1">Required for verification call.</p>
                       </div>
                    </div>
                 )}

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <CustomSelect 
                       label="Species"
                       value={species}
                       onChange={setSpecies}
                       options={speciesOptions}
                     />
                   </div>
                   <div>
                     <CustomSelect 
                       label="TNR Status"
                       value={isEarTipped}
                       onChange={setIsEarTipped}
                       options={tnrOptions}
                     />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                   <div className="flex gap-2">
                     <input name="location" required placeholder="e.g. Near basketball court" className="flex-1 p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
                     {isPublicView && (
                       <button 
                         type="button" 
                         onClick={handleGetLocation}
                         disabled={isGettingLocation}
                         className={`p-2.5 rounded-xl border transition-colors ${gpsCoords ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300'}`}
                         title="Use Current GPS Location"
                       >
                         {isGettingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : gpsCoords ? <CheckCircle2 className="w-5 h-5" /> : <Locate className="w-5 h-5" />}
                       </button>
                     )}
                   </div>
                   {locationError && <p className="text-xs text-red-500 mt-1">{locationError}</p>}
                   {gpsCoords && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Coordinates attached</p>}
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                   <textarea name="description" required placeholder="Color, size, behavior..." rows={3} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900" />
                 </div>

                 {isPublicView && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800">
                           <span className="font-bold">Important:</span> False reporting is a serious offense. Your device details and location are logged for verification purposes.
                        </div>
                    </div>
                 )}

                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-lg transition-all disabled:bg-slate-400"
                 >
                   {isSubmitting ? 'Submitting...' : 'Submit Report'}
                 </button>
              </form>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};
