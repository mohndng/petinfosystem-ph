
import React, { useState, useEffect } from 'react';
import { AddressSelector } from './AddressSelector';
import { db } from '../services/db';
import { LocationDetails } from '../types';
import { Dog, ArrowRight, Map, ShieldCheck, Lock, User as UserIcon, CheckCircle2, KeyRound, Loader2, RefreshCw, Copy, LogIn, ArrowLeft, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface WelcomeScreenProps {
  onSetupCompleteAndLogin: () => void;
  onSwitchToLogin: (location: LocationDetails | null, currentStep: number) => void;
  onBack: () => void;
  initialStep?: number;
  initialLocation?: LocationDetails | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSetupCompleteAndLogin, onSwitchToLogin, onBack, initialStep = 1, initialLocation = null }) => {
  const [step, setStep] = useState(initialStep);
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(initialLocation);
  
  // Step 2 State: Code Verification
  const [publicCode, setPublicCode] = useState('');
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  
  // Initialization Loading State
  const [isInitializing, setIsInitializing] = useState(false);

  // Step 3 State: Admin Registration
  const [adminData, setAdminData] = useState({
    fullName: '',
    username: '',
    authCode: ''
  });
  const [isAdminVerifying, setIsAdminVerifying] = useState(false);
  const [isGettingCode, setIsGettingCode] = useState(false);

  // Step 4 State: Success & Password
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Ensure location details are present if past step 1
  useEffect(() => {
    if (step > 1 && !locationDetails) {
      setStep(1);
    }
  }, [step, locationDetails]);

  // STEP 1: Address -> Generate Codes
  const handleLocationNext = async () => {
    if (!locationDetails) {
      toast.error("Please select your location to continue.");
      return;
    }
    
    // Rate Limit Check (Prevent Spam - 30 mins)
    const lastInit = localStorage.getItem('setup_init_cooldown');
    if (lastInit) {
      const diff = Date.now() - parseInt(lastInit);
      const cooldown = 30 * 60 * 1000; // 30 minutes
      if (diff < cooldown) {
        const minutesLeft = Math.ceil((cooldown - diff) / 60000);
        toast.error(`Rate Limit: Please wait ${minutesLeft} minutes before initializing again.`);
        return;
      }
    }

    setIsInitializing(true);

    try {
      // Call DB to generate pairs
      const result = await db.setup.initiateSession(locationDetails);
      
      // Set cooldown on successful generation
      localStorage.setItem('setup_init_cooldown', Date.now().toString());

      setPublicCode(result.publicCode);
      setStep(2);
    } catch (error: any) {
      console.error("Session init failed:", error);
      // Show the specific error message from DB (e.g. "Already registered")
      toast.error(error.message || "System offline. Please try again.");
    } finally {
      setIsInitializing(false);
    }
  };

  // STEP 2: Verify Secret Code
  const handleSessionVerification = async () => {
    if (!secretCodeInput) {
      toast.error("Please enter the 2nd authentication code.");
      return;
    }
    setIsVerifyingSession(true);
    try {
      const isValid = await db.setup.verifySession(publicCode, secretCodeInput.toUpperCase());
      if (isValid) {
        toast.success("Authentication Successful");
        setStep(3);
      } else {
        toast.error("Invalid code. Please try again.");
      }
    } catch (e) {
      toast.error("Verification failed.");
    } finally {
      setIsVerifyingSession(false);
    }
  };

  // STEP 3: Get Auth Code
  const handleGetAuthCode = async () => {
    if (!adminData.fullName.trim() || !adminData.username.trim()) {
      toast.error("Please enter Full Name and Username first.");
      return;
    }

    setIsGettingCode(true);
    try {
      await db.setup.requestAdminAuthToken();
      toast.success("Request sent! Authorized personnel will have the code.");
    } catch (e) {
      toast.error("Failed to request code.");
    } finally {
      setIsGettingCode(false);
    }
  };

  // STEP 3: Register Admin
  const handleAdminRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminData.fullName || !adminData.username || !adminData.authCode) {
      toast.error("All fields are required.");
      return;
    }
    
    setIsAdminVerifying(true);
    try {
      // 1. Verify the Token
      const isTokenValid = await db.setup.verifyAdminAuthToken(adminData.authCode.toUpperCase());
      if (!isTokenValid) {
        toast.error("Invalid Authorization Code.");
        setIsAdminVerifying(false);
        return;
      }

      // 2. Generate Password
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setGeneratedPassword(password);

      // 3. Create Account
      if (locationDetails) {
         await db.setup.finalizeSetup(adminData.fullName, adminData.username, password, locationDetails);
         setStep(4);
      }
    } catch (error) {
      console.error("Registration failed", error);
      toast.error("Registration failed due to system error.");
    } finally {
      setIsAdminVerifying(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("Password copied!");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 min-h-[600px]">
        
        {/* Left Side - Branding & Progress */}
        <div className="w-full md:w-4/12 bg-blue-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
             <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm font-bold mb-6 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
             </button>

             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
               <Dog className="w-7 h-7 text-white" />
             </div>
             <h1 className="text-3xl font-bold mb-2 leading-tight">System Setup</h1>
             <p className="text-blue-100 text-sm opacity-90">Secure 2-Step Initialization</p>
           </div>

           <div className="relative z-10 mt-8 space-y-6">
              <StepIndicator step={1} current={step} label="Location" sub="Select Area" />
              <StepIndicator step={2} current={step} label="Authentication" sub="2-Step Verify" />
              <StepIndicator step={3} current={step} label="Admin" sub="Credentials" />
              <StepIndicator step={4} current={step} label="Complete" sub="Login Access" />
           </div>
           
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
           <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600 rounded-full blur-3xl opacity-50"></div>
        </div>

        {/* Right Side - Forms */}
        <div className="w-full md:w-8/12 bg-slate-50 flex flex-col relative">
           
           {/* STEP 1: Location */}
           {step === 1 && (
             <div className="px-8 pt-8 pb-20 flex flex-col h-full animate-in slide-in-from-right duration-300">
               <div className="mb-6">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Map className="w-5 h-5 text-blue-600" /> Select Deployment Location</h2>
                 <p className="text-slate-500 text-sm">Identify the specific Barangay for this registry.</p>
               </div>

               {/* New Information Dialogue */}
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-blue-800">Initialization Policy</h3>
                    <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                      To prevent system spam and ensure secure registration, session initialization is limited to <strong>1 attempt every 30 minutes</strong>. Please ensure your location details are correct before proceeding.
                    </p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 pr-1">
                 <AddressSelector onAddressChange={() => {}} onLocationDetails={setLocationDetails} />
               </div>
               <div className="pb-4">
                 <button 
                   onClick={handleLocationNext}
                   disabled={!locationDetails || isInitializing}
                   className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                 >
                   {isInitializing ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin" /> Initializing...
                     </>
                   ) : (
                     <>
                       Initialize Session <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                     </>
                   )}
                 </button>
               </div>
             </div>
           )}

           {/* STEP 2: Code Verification */}
           {step === 2 && (
             <div className="px-8 pt-8 pb-20 flex flex-col h-full justify-center animate-in slide-in-from-right duration-300">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Security Handshake</h2>
                  <p className="text-slate-500 text-sm">Verify your terminal access.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                   <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Terminal Code (Public)</p>
                      <div className="text-4xl font-mono font-bold text-slate-800 tracking-widest bg-slate-50 py-3 rounded-xl border border-slate-100">
                        {publicCode}
                      </div>
                   </div>
                   
                   <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">Enter 2nd Code</span>
                      </div>
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Secret Authentication Code</label>
                      <input 
                        type="text" 
                        value={secretCodeInput}
                        onChange={(e) => setSecretCodeInput(e.target.value.toUpperCase())}
                        placeholder="SEC-XXXX"
                        className="w-full text-center text-xl font-mono font-bold p-3 border-2 border-blue-100 rounded-xl focus:border-blue-500 outline-none uppercase text-slate-900 bg-white"
                      />
                   </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Back</button>
                  <button 
                    onClick={handleSessionVerification}
                    disabled={isVerifyingSession}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isVerifyingSession ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate"}
                  </button>
                </div>
             </div>
           )}

           {/* STEP 3: Admin Registration */}
           {step === 3 && (
             <form onSubmit={handleAdminRegistration} className="px-8 pt-8 pb-20 flex flex-col h-full animate-in slide-in-from-right duration-300">
               <div className="mb-6">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600" /> Admin Registration</h2>
                 <p className="text-slate-500 text-sm">Create the Super Admin account for this unit.</p>
               </div>

               <div className="space-y-5 flex-1">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" required 
                      value={adminData.fullName}
                      onChange={e => setAdminData({...adminData, fullName: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                      placeholder="e.g. Juan Dela Cruz"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Preferred Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" required 
                        value={adminData.username}
                        onChange={e => setAdminData({...adminData, username: e.target.value.replace(/\s+/g, '').toLowerCase()})}
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-slate-900"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                     <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Authorization Code</label>
                     <div className="flex gap-2 mb-2">
                       <input 
                         type="text" required 
                         value={adminData.authCode}
                         onChange={e => setAdminData({...adminData, authCode: e.target.value.toUpperCase()})}
                         className="flex-1 p-3 border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center uppercase tracking-wider text-slate-900"
                         placeholder="ADM-XXXXXX"
                       />
                       <button 
                         type="button"
                         onClick={handleGetAuthCode}
                         disabled={isGettingCode || !adminData.fullName.trim() || !adminData.username.trim()}
                         className="px-4 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md hover:bg-blue-700 transition-all whitespace-nowrap disabled:bg-slate-300 disabled:cursor-not-allowed"
                       >
                         {isGettingCode ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "GET CODE"}
                       </button>
                     </div>
                     <p className="text-[10px] text-blue-600 flex items-center gap-1">
                       <CheckCircle2 className="w-3 h-3" /> Authorized personnel will receive the code upon request.
                     </p>
                  </div>
               </div>

               <button 
                 type="submit" 
                 disabled={isAdminVerifying}
                 className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
               >
                 {isAdminVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register & Generate Credentials"}
               </button>
             </form>
           )}

            {/* STEP 4: Success */}
            {step === 4 && (
             <div className="px-8 pt-8 pb-20 flex flex-col h-full items-center justify-center text-center animate-in slide-in-from-right duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                   <KeyRound className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Setup Complete!</h2>
                <p className="text-slate-500 mb-8 max-w-sm">
                   Your account has been created successfully. Please save your credentials below.
                </p>

                <div className="w-full max-w-sm bg-slate-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><Lock className="w-24 h-24" /></div>
                   <div className="relative z-10 text-left space-y-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Username</p>
                        <p className="text-xl font-mono">{adminData.username}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Auto-Generated Password</p>
                        <div className="flex items-center gap-2 bg-slate-700/50 p-2 rounded-lg border border-slate-600">
                           <p className="text-xl font-mono font-bold tracking-wide flex-1">{generatedPassword}</p>
                           <button onClick={copyPassword} className="p-2 hover:bg-slate-600 rounded-md transition-colors">
                             <Copy className="w-4 h-4 text-blue-400" />
                           </button>
                        </div>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => onSetupCompleteAndLogin()}
                  className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <LogIn className="w-5 h-5" /> Go to Login
                </button>
             </div>
           )}

           <p className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
             Secure LGU Transaction • PetInfoSys
           </p>
        </div>
      </div>
    </div>
  );
};

const StepIndicator = ({ step, current, label, sub }: any) => (
  <div className={`flex items-center gap-4 transition-opacity duration-300 ${current === step ? 'opacity-100' : 'opacity-60'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${current >= step ? 'bg-white text-blue-600 border-white' : 'border-blue-300 text-blue-100'}`}>
      {current > step ? <CheckCircle2 /> : step}
    </div>
    <div>
      <p className="font-bold text-sm">{label}</p>
      <p className="text-xs text-blue-200">{sub}</p>
    </div>
  </div>
);
