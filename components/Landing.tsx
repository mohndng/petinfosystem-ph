
import React, { useState } from 'react';
import { db } from '../services/db';
import { Users, ShieldCheck, ArrowRight, Lock, Dog, MapPin, Loader2, Github, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { SystemSettings } from '../types';

interface LandingProps {
  onOfficialLogin: () => void;
  onSetupNewSystem: () => void;
  onCommunityAccess: (settings: SystemSettings) => void;
  onAboutClick: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onOfficialLogin, onSetupNewSystem, onCommunityAccess, onAboutClick }) => {
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [loadingAbout, setLoadingAbout] = useState(false);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      const settings = await db.settings.getByCommunityCode(code.toUpperCase());
      
      if (settings) {
        toast.success(`Welcome to Brgy. ${settings.barangayName} Portal`);
        onCommunityAccess(settings);
      } else {
        toast.error("Invalid Access Code. Please ask your Barangay Hall.");
      }
    } catch (error) {
      console.error("Verification error", error);
      toast.error("Connection failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGithubClick = () => {
    setLoadingGithub(true);
    setTimeout(() => {
      window.open("https://github.com/mohndng", "_blank");
      setLoadingGithub(false);
    }, 800);
  };

  const handleAboutClickAction = () => {
    setLoadingAbout(true);
    setTimeout(() => {
        onAboutClick();
        // Component will unmount, so we don't need to strictly reset loading
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="z-10 w-full max-w-5xl">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-6 shadow-2xl border border-white/10">
            <Dog className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">PetInfoSys PH</h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">Barangay Animal Management Platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
          
          {/* Community Option */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group flex flex-col animate-in slide-in-from-left-4 duration-700 delay-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-[100px] -mr-10 -mt-10 transition-colors group-hover:bg-blue-200"></div>
            
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors z-10">
              <Users className="w-8 h-8" />
            </div>
            
            <div className="mb-6 relative z-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Community Portal</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                For residents to view announcements, check vaccination schedules, and verify pet registrations.
              </p>
            </div>
            
            <div className="mt-auto relative z-10">
              {!showCodeInput ? (
                <button 
                  onClick={() => setShowCodeInput(true)}
                  className="w-full py-4 bg-white border-2 border-blue-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                >
                  Enter Portal <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <form onSubmit={handleCodeSubmit} className="animate-in fade-in slide-in-from-bottom-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Community Access Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      autoFocus
                      className="w-full p-3 border-2 border-blue-100 rounded-xl text-center text-lg font-bold tracking-widest outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-300 uppercase"
                      placeholder="ENTER CODE"
                      maxLength={8}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={isVerifying}
                    />
                    <button 
                      type="submit"
                      disabled={isVerifying}
                      className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
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

          {/* Management Option */}
          <div className="bg-slate-800 rounded-3xl p-8 shadow-2xl hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group flex flex-col border border-slate-700 animate-in slide-in-from-right-4 duration-700 delay-200">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700 rounded-bl-[100px] -mr-10 -mt-10 opacity-50 group-hover:bg-slate-600 transition-colors"></div>
             
             <div className="w-14 h-14 bg-slate-700 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors z-10">
               <ShieldCheck className="w-8 h-8" />
             </div>
             
             <div className="mb-6 relative z-10">
               <h2 className="text-2xl font-bold text-white mb-2">LGU Management</h2>
               <p className="text-slate-400 text-sm leading-relaxed">
                 Restricted access for Barangay Captain, Secretary, Health Workers, and Tanods.
               </p>
             </div>
             
             <div className="mt-auto relative z-10 space-y-3">
               <button 
                 onClick={onOfficialLogin}
                 className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2"
               >
                 <Lock className="w-4 h-4" /> 
                 Official Login
               </button>
               <button
                 onClick={onSetupNewSystem}
                 className="w-full py-3 bg-slate-700/50 text-slate-300 font-medium rounded-xl hover:bg-slate-700/80 hover:text-white transition-all flex items-center justify-center gap-2 text-sm"
               >
                 <MapPin className="w-4 h-4" />
                 Register & Setup New Barangay
               </button>
             </div>
          </div>

        </div>
        
        <div className="mt-16 text-center text-slate-500 text-xs animate-in fade-in delay-500 flex flex-col items-center gap-4">
           
           <div className="flex gap-4">
              <button 
                onClick={handleGithubClick}
                disabled={loadingGithub}
                className="p-2.5 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-all hover:scale-110 shadow-lg shadow-slate-900/20 flex items-center justify-center"
                title="View on GitHub"
              >
                {loadingGithub ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
              </button>
              <button 
                onClick={handleAboutClickAction}
                disabled={loadingAbout}
                className="p-2.5 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-all hover:scale-110 shadow-lg shadow-slate-900/20 flex items-center justify-center"
                title="About App & Developers"
              >
                {loadingAbout ? <Loader2 className="w-5 h-5 animate-spin" /> : <Info className="w-5 h-5" />}
              </button>
           </div>

           <p className="opacity-80">Secure Government Transaction • Republic of the Philippines</p>
        </div>
      </div>
    </div>
  );
};
