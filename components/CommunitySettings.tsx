import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { SystemSettings, User } from '../types';
import { Shield, RefreshCw, Copy, Save, Check, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const CommunitySettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const barangayId = JSON.parse(localStorage.getItem('staff_session') || '{}').barangayId;
    if (barangayId) {
        const s = await db.settings.getByBarangayId(barangayId);
        setSettings(s);
        setCode(s.communityCode);
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

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newCode = '';
    for (let i = 0; i < 8; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(newCode);
    setIsGenerated(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
        const updated = { ...settings, communityCode: code };
        await db.settings.update(updated);
        
        setIsGenerated(false);
        toast.success("Community Access Code updated!");
    } catch (error: any) {
        console.error(error);
        toast.error("Failed to save code. Check permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Community Access Control</h1>
        <p className="text-slate-500 text-sm">Manage the security code required for residents to access the public portal.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-2xl">
         <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-2xl">
            <div className="flex items-center gap-3 mb-2">
               <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                 <Users className="w-6 h-6 text-white" />
               </div>
               <h3 className="font-bold text-xl">Public Portal Access</h3>
            </div>
            <p className="text-blue-100 text-sm opacity-90">
              Residents must enter this code to view announcements and verify pet registrations.
              Share this code via barangay assembly or official posters.
            </p>
         </div>

         <div className="p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
               
               <div className="text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Active Code</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-4xl sm:text-5xl font-mono font-bold text-slate-800 tracking-widest bg-slate-100 px-8 py-4 rounded-2xl border border-slate-200 shadow-inner">
                       {code}
                    </div>
                  </div>
               </div>

               <div className="flex gap-3">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Copy Code
                  </button>
                  <button 
                    onClick={generateCode}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} /> Generate New
                  </button>
               </div>

               {isGenerated && (
                 <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between animate-in fade-in gap-4">
                    <div className="flex items-center gap-3">
                       <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                       <div className="text-sm text-amber-800">
                          <span className="font-bold">Unsaved Changes:</span> New code is <span className="font-mono font-bold">{code}</span>.
                       </div>
                    </div>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save New Code
                    </button>
                 </div>
               )}
               
               {!isGenerated && (
                 <div className="text-center text-xs text-slate-400 max-w-md">
                   Changing this code will immediately revoke access for anyone using the old code. Ensure you communicate the new code to your constituents.
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};