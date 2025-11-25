
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Users, ShieldCheck, ArrowRight, Lock, Dog, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SystemSettings } from '../types';

interface GatewayProps {
  onOfficialLogin: () => void;
  onCommunityAccess: () => void;
}

export const Gateway: React.FC<GatewayProps> = ({ onOfficialLogin, onCommunityAccess }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // FIX: The db.settings.get() method was removed as it's ambiguous in a multi-tenant system.
    // This component is likely obsolete and replaced by Landing.tsx.
    // To make it runnable, we set a default settings object to allow rendering.
    setSettings({
        barangayId: '',
        barangayName: 'Welcome',
        municipality: 'Community',
        logoUrl: '',
        reminderDays: 30,
        supportEmail: '',
        emergencyHotline: '',
        communityCode: '',
        licenseUsed: '',
    });
  }, []);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      // FIX: Use getByCommunityCode to verify the entered code instead of a generic get()
      const settingsResult = await db.settings.getByCommunityCode(code.toUpperCase());
      
      if (settingsResult) {
        toast.success("Access Granted");
        onCommunityAccess();
      } else {
        toast.error("Invalid Access Code. Please try again.");
      }
    } catch (error) {
      toast.error("Verification error.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!settings) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-blue-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="z-10 w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-6 shadow-2xl border border-white/10">
            <Dog className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">Barangay {settings.barangayName}</h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">Animal Registry & Public Health Information System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          
          {/* Community Portal Card */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-[100px] -mr-10 -mt-10 transition-colors group-hover:bg-blue-200"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Community Portal</h2>
              <p className="text-slate-500 mb-8">For residents to view announcements, check vaccination schedules, and verify pet registrations.</p>
              
              {!showCodeInput ? (
                <button 
                  onClick={() => setShowCodeInput(true)}
                  className="mt-auto w-full py-4 bg-white border-2 border-blue-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  Enter Portal <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <form onSubmit={handleCodeSubmit} className="mt-auto animate-in fade-in slide-in-from-bottom-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Enter Access Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      autoFocus
                      className="w-full p-3 border-2 border-blue-100 rounded-xl text-center text-lg font-bold tracking-widest outline-none focus:border-blue-500 text-slate-900 uppercase"
                      placeholder="ABC-123"
                      maxLength={8}
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      disabled={isVerifying}
                    />
                    <button 
                      type="submit"
                      disabled={isVerifying}
                      className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                      {isVerifying ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                    </button>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowCodeInput(false)}
                    className="text-xs text-slate-400 mt-3 hover:text-slate-600 hover:underline w-full text-center"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Official Login Card */}
          <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group border border-slate-700">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 group-hover:bg-slate-600 transition-colors"></div>
             
             <div className="relative z-10 h-full flex flex-col">
               <div className="w-14 h-14 bg-slate-700 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                 <ShieldCheck className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">Official Management</h2>
               <p className="text-slate-400 mb-8">Restricted access for Barangay Officials, Health Workers, and Authorized Staff.</p>
               
               <button 
                 onClick={onOfficialLogin}
                 className="mt-auto w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2"
               >
                 <Lock className="w-4 h-4" /> Admin Login
               </button>
             </div>
          </div>

        </div>
        
        <div className="mt-12 text-center text-slate-500 text-sm">
           <p>© 2025 Local Government of {settings.municipality}</p>
        </div>
      </div>
    </div>
  );
};
