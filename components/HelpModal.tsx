
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Phone, FileQuestion, Globe, Edit2, Check, XCircle, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { SystemSettings } from '../types';
import toast from 'react-hot-toast';

interface HelpModalProps {
  onClose: () => void;
  userRole: string; // Add role to props
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, userRole }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Local edit state
  const [tempEmail, setTempEmail] = useState('');
  const [tempHotline, setTempHotline] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const barangayId = JSON.parse(localStorage.getItem('staff_session') || '{}').barangayId;
    if (barangayId) {
        const s = await db.settings.getByBarangayId(barangayId);
        setSettings(s);
        setTempEmail(s.supportEmail);
        setTempHotline(s.emergencyHotline);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
    window.addEventListener('dbUpdated', loadSettings);
    return () => {
      window.removeEventListener('dbUpdated', loadSettings);
    };
  }, [loadSettings]);

  const handleSave = async () => {
    if (!settings) return;
    const updatedSettings = {
      ...settings,
      supportEmail: tempEmail,
      emergencyHotline: tempHotline
    };
    await db.settings.update(updatedSettings);
    setIsEditing(false);
    toast.success("Contact details updated successfully");
  };

  const handleCancel = () => {
    if (settings) {
        setTempEmail(settings.supportEmail);
        setTempHotline(settings.emergencyHotline);
    }
    setIsEditing(false);
  };

  if (loading || !settings) return <div className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 z-[9999] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-start">
          <div>
             <h2 className="text-xl font-bold">Help & Support</h2>
             <p className="text-blue-100 text-sm mt-1">Barangay Pet Information System</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
           
           <div>
             <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
               <FileQuestion className="w-5 h-5 text-blue-600" /> FAQ
             </h3>
             <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <p className="text-sm font-semibold text-slate-700">How do I register a new pet?</p>
                   <p className="text-xs text-slate-500 mt-1">Go to "Register Pet" in the sidebar, fill out the owner details and pet information, then click Save.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <p className="text-sm font-semibold text-slate-700">How do I update vaccination records?</p>
                   <p className="text-xs text-slate-500 mt-1">Go to "Vaccination", search for the pet, and fill out the clinical record form.</p>
                </div>
             </div>
           </div>

           <div className="border-t border-slate-100 pt-4 relative">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-slate-800">Contact Support</h3>
               {userRole === 'Admin' && !isEditing && (
                 <button 
                   onClick={() => setIsEditing(true)}
                   className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                 >
                   <Edit2 className="w-3 h-3" /> Edit Info
                 </button>
               )}
               {isEditing && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCancel}
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-700 font-bold bg-slate-100 px-2 py-1 rounded-lg transition-colors"
                    >
                      <XCircle className="w-3 h-3" /> Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                  </div>
               )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer group bg-white">
                   <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                     <Mail className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-xs text-slate-500">Email Support</p>
                     {isEditing ? (
                       <input 
                         value={tempEmail}
                         onChange={(e) => setTempEmail(e.target.value)}
                         className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 outline-none focus:border-blue-500"
                       />
                     ) : (
                       <p className="text-sm font-bold text-slate-800 truncate" title={settings.supportEmail}>{settings.supportEmail}</p>
                     )}
                   </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer group bg-white">
                   <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                     <Phone className="w-5 h-5" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-xs text-slate-500">Emergency Hotline</p>
                     {isEditing ? (
                       <input 
                         value={tempHotline}
                         onChange={(e) => setTempHotline(e.target.value)}
                         className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 outline-none focus:border-blue-500"
                       />
                     ) : (
                       <p className="text-sm font-bold text-slate-800 truncate" title={settings.emergencyHotline}>{settings.emergencyHotline}</p>
                     )}
                   </div>
                </div>
             </div>
           </div>

           <div className="text-center pt-2">
             <p className="text-xs text-slate-400">Version 2.1.0 (Multi-Tenant Update)</p>
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
