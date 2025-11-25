

import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { PetRegistry } from './components/PetRegistry';
import { PetProfile } from './components/PetProfile';
import { Reports } from './components/Reports';
import { RegisterPet } from './components/RegisterPet';
import { UserManagement } from './components/UserManagement';
import { Settings } from './components/Settings';
import { CommunitySettings } from './components/CommunitySettings';
import { ProfileModal } from './components/ProfileModal';
import { HelpModal } from './components/HelpModal';
import { VaccinationManager } from './components/VaccinationManager';
import { BiteIncidents } from './components/BiteIncidents';
import { StrayReports } from './components/StrayReports';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PublicPortal } from './components/PublicPortal';
import { Landing } from './components/Landing';
import { Welcome } from './components/Welcome';
import { About } from './components/About';
import { db } from './services/db';
import { supabase } from './services/supabaseClient';
import { Dog, Lock, User as UserIcon, ArrowRight, ShieldCheck, Mail, Loader2, LayoutDashboard, Home, KeyRound, MapPin, Building2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { User, LocationDetails, SystemSettings } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [currentView, setCurrentView] = useState<'welcome' | 'landing' | 'setup' | 'login' | 'portal' | 'dashboard' | 'loggedOut' | 'about'>('welcome');

  // State to track where the login screen was accessed from and which step to return to.
  const [loginReturnPath, setLoginReturnPath] = useState<'landing' | 'setup'>('landing');
  const [setupReturnStep, setSetupReturnStep] = useState(1);
  const [setupContext, setSetupContext] = useState<LocationDetails | null>(null);
  const [publicContext, setPublicContext] = useState<SystemSettings | null>(null);

  // Login Confirmation State
  const [pendingLoginUser, setPendingLoginUser] = useState<User | null>(null);
  const [pendingLoginSettings, setPendingLoginSettings] = useState<SystemSettings | null>(null);

  // Navigation State - Persisted in sessionStorage
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab') || 'dashboard');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(() => sessionStorage.getItem('selectedPetId'));
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Form State
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [barangayName, setBarangayName] = useState('Loading...');
  const [barangayLogo, setBarangayLogo] = useState('');

  // Persist navigation state on change
  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.setItem('activeTab', activeTab);
      if (selectedPetId) {
        sessionStorage.setItem('selectedPetId', selectedPetId);
      } else {
        sessionStorage.removeItem('selectedPetId');
      }
    }
  }, [activeTab, selectedPetId, isLoggedIn]);

  // Set barangay details on login
  useEffect(() => {
    const fetchBarangayDetails = async () => {
      if (user?.barangayId) {
        const settings = await db.settings.getByBarangayId(user.barangayId);
        setBarangayName(settings.barangayName || 'Unnamed Barangay');
        setBarangayLogo(settings.logoUrl || '');
      }
    };
    fetchBarangayDetails();
  }, [user]);


  // Supabase Auth Listener & Persistence Check
  useEffect(() => {
    const checkSession = async () => {
      // Local staff session check (non-supabase auth)
      const localStaff = localStorage.getItem('staff_session');
      if (localStaff) {
        try {
          const parsedUser: User = JSON.parse(localStaff);
          if (parsedUser.barangayId) { // Ensure session is valid
            setUser(parsedUser);
            setIsLoggedIn(true);
            if (['landing', 'login', 'setup', 'portal', 'welcome', 'about'].includes(currentView)) {
               setCurrentView('dashboard');
            }
            return;
          }
        } catch (e) {
          console.error("Invalid local session");
          localStorage.removeItem('staff_session');
        }
      }

      // Supabase auth session check (for legacy/standard auth)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
         const profile = await db.users.getById(session.user.id);
         if (profile) {
            setUser(profile);
            setIsLoggedIn(true);
            localStorage.setItem('staff_session', JSON.stringify(profile));
            if (['landing', 'login', 'setup', 'portal', 'welcome', 'about'].includes(currentView)) {
               setCurrentView('dashboard');
            }
         }
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
         db.users.getById(session.user.id).then(profile => {
            if (profile) {
              setUser(profile);
              setIsLoggedIn(true);
              localStorage.setItem('staff_session', JSON.stringify(profile));
              if (currentView === 'login' || currentView === 'landing') {
                 setCurrentView('dashboard');
              }
            }
         });
      }
    });

    return () => subscription.unsubscribe();
  }, [currentView]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      // PRIMARY LOGIN: Check against DB Profiles directly
      // Trim inputs to handle accidental whitespace
      const dbUser = await db.users.login(loginInput.trim(), loginPassword);
      
      if (dbUser) {
        if (dbUser.status === 'Inactive') throw new Error("Account is deactivated. Contact Admin.");
        
        // Fetch Settings for Confirmation Dialogue
        const settings = await db.settings.getByBarangayId(dbUser.barangayId);
        
        setPendingLoginUser(dbUser);
        setPendingLoginSettings(settings);
        setIsLoggingIn(false);
        return;
      }

      throw new Error("Invalid credentials or user does not exist.");

    } catch (error: any) {
      console.error(error);
      setLoginError(error.message || "Invalid credentials.");
      toast.error('Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const confirmLogin = async () => {
    if (pendingLoginUser) {
        try {
           // Update the last login timestamp on successful entry
           await db.users.logSessionStart(pendingLoginUser.id);
        } catch (e) {
           console.error("Could not update last active time", e);
        }

        toast.success(`Access Granted (${pendingLoginUser.role})`);
        
        // Optimistic Update: Set user state with current timestamp so it shows "Just now" immediately
        // instead of waiting for next fetch/login.
        const activeUser = {
          ...pendingLoginUser,
          lastActive: new Date().toISOString()
        };

        setUser(activeUser);
        setIsLoggedIn(true);
        setCurrentView('dashboard');
        setSetupContext(null);
        
        localStorage.setItem('staff_session', JSON.stringify(activeUser));
        
        // Reset pending state
        setPendingLoginUser(null);
        setPendingLoginSettings(null);
        setLoginPassword('');
    }
  };

  const cancelLogin = () => {
      setPendingLoginUser(null);
      setPendingLoginSettings(null);
      setLoginPassword('');
      toast.error("Login cancelled");
  };

  const handleLogout = async () => {
    if (user) {
      try {
        await db.users.logSessionEnd(user.id);
      } catch (e) {
        console.warn("Could not log session end", e);
      }
    }

    await supabase.auth.signOut();
    localStorage.removeItem('staff_session');
    sessionStorage.clear();
    
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab('dashboard');
    setLoginInput('');
    setLoginPassword('');
    setSetupContext(null);
    setPublicContext(null);
    setPendingLoginUser(null);
    
    setCurrentView('loggedOut');
    
    toast.success('You have been securely logged out.');
  };

  // --- RENDER LOGIC ---
  
  if (currentView === 'welcome') {
    return (
      <>
        <Welcome onGetStarted={() => setCurrentView('landing')} />
        <Toaster position="top-right" />
      </>
    );
  }

  if (currentView === 'about') {
    return (
      <>
        <About onBack={() => setCurrentView('landing')} />
        <Toaster position="top-right" />
      </>
    );
  }
  
  if (currentView === 'loggedOut') {
    return (
      <>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95">
            <div className="inline-flex items-center justify-center p-4 bg-emerald-500/20 backdrop-blur-md rounded-3xl mb-6 border border-emerald-500/30">
              <ShieldCheck className="w-12 h-12 text-emerald-300" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Logout Successful</h1>
            <p className="text-slate-300 mb-8">You have been securely signed out of the system.</p>
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentView('landing')}
                className="w-full py-4 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Back to Main Portal <Home className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
        <Toaster position="top-right" />
      </>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div className="flex h-screen bg-[#f1f5f9] font-sans text-slate-900">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => { setSelectedPetId(null); setActiveTab(tab); }}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          userRole={user.role}
        />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-72">
          <Header 
            onMenuClick={() => setIsSidebarOpen(true)}
            onLogout={handleLogout}
            user={user}
            barangayName={barangayName}
            barangayLogo={barangayLogo}
            onEditProfileClick={() => setIsProfileModalOpen(true)}
            onHelpClick={() => setIsHelpModalOpen(true)}
          />
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
             <div className="max-w-7xl mx-auto">
               {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} user={user} barangayName={barangayName} />}
               {activeTab === 'register' && <RegisterPet onSuccess={(id) => { setSelectedPetId(id); setActiveTab('registry'); }} onCancel={() => setActiveTab('dashboard')} />}
               {activeTab === 'registry' && (selectedPetId ? <PetProfile petId={selectedPetId} onBack={() => setSelectedPetId(null)} userRole={user.role} /> : <PetRegistry onSelectPet={(id) => setSelectedPetId(id)} userRole={user.role} />)}
               {activeTab === 'vaccination' && <VaccinationManager />}
               {activeTab === 'incidents' && <BiteIncidents />}
               {activeTab === 'strays' && <StrayReports />}
               {activeTab === 'reports' && <Reports />}
               {activeTab === 'users' && (user.role === 'Admin' ? <UserManagement currentUser={user} /> : <div className="p-8 text-center text-slate-500">Access Denied</div>)}
               {activeTab === 'community_settings' && (user.role === 'Admin' ? <CommunitySettings /> : <div className="p-8 text-center text-slate-500">Access Denied</div>)}
               {activeTab === 'settings' && (user.role === 'Admin' ? <Settings /> : <div className="p-8 text-center text-slate-500">Access Denied</div>)}
             </div>
          </main>
        </div>

        {isProfileModalOpen && <ProfileModal userId={user.id} onClose={() => setIsProfileModalOpen(false)} />}
        {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} userRole={user.role} />}
        
        <Toaster position="top-right" />
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <>
        <Landing 
          onOfficialLogin={() => {
            setLoginReturnPath('landing');
            setCurrentView('login');
          }}
          onSetupNewSystem={() => {
            setCurrentView('setup');
          }}
          onCommunityAccess={(settings) => {
            setPublicContext(settings);
            setCurrentView('portal');
          }}
          onAboutClick={() => setCurrentView('about')}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  if (currentView === 'setup') {
    return (
      <>
        <WelcomeScreen
          onSetupCompleteAndLogin={() => {
            setCurrentView('login');
            setLoginReturnPath('setup');
          }}
          onSwitchToLogin={(location, step) => {
            setSetupContext(location);
            setSetupReturnStep(step);
            setLoginReturnPath('setup');
            setCurrentView('login');
          }}
          onBack={() => setCurrentView('landing')}
          initialStep={setupReturnStep}
          initialLocation={setupContext}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
         {/* Background Ambience for Login */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-10"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-10"></div>
         </div>

         {/* CONFIRMATION DIALOGUE OVERLAY */}
         {pendingLoginUser && pendingLoginSettings ? (
            <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300 relative z-50 border border-white/50">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100/80 backdrop-blur-sm text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-50/50">
                        <MapPin className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Confirm Location Access</h2>
                    <p className="text-slate-500 text-sm mt-1">Please verify your registered jurisdiction.</p>
                </div>
                
                <div className="bg-white/50 p-6 rounded-2xl border border-white/60 shadow-sm mb-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Official</span>
                        <span className="text-sm font-bold text-slate-900">{pendingLoginUser.fullName}</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Role</span>
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          pendingLoginUser.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {pendingLoginUser.role.toUpperCase()}
                        </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Last Active</span>
                        <span className="text-xs font-medium text-slate-600">
                           {pendingLoginUser.lastActive 
                             ? new Date(pendingLoginUser.lastActive).toLocaleString('en-US', { 
                                 month: 'long', 
                                 day: 'numeric', 
                                 year: 'numeric',
                                 hour: 'numeric', 
                                 minute: '2-digit', 
                                 hour12: true 
                               }) 
                             : 'First Session'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Location</span>
                        <span className="text-sm font-bold text-slate-900">{pendingLoginSettings.barangayName}</span>
                    </div>
                </div>
                
                <div className="flex gap-3">
                   <button onClick={cancelLogin} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                   <button onClick={confirmLogin} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">Confirm Access</button>
                </div>
            </div>
         ) : (
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-blue-500/20 rounded-2xl mb-4 text-blue-300 ring-1 ring-blue-500/40">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Secure Login</h2>
                  <p className="text-blue-200 text-sm">Official Personnel Access Only</p>
               </div>

               <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-blue-200 uppercase mb-2">Username</label>
                    <div className="relative">
                       <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                       <input 
                         type="text" 
                         value={loginInput}
                         onChange={(e) => setLoginInput(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-white placeholder:text-slate-500 transition-all"
                         placeholder="Enter username"
                       />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-200 uppercase mb-2">Password</label>
                    <div className="relative">
                       <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="password" 
                         value={loginPassword}
                         onChange={(e) => setLoginPassword(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-white placeholder:text-slate-500 transition-all"
                         placeholder="••••••••"
                       />
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4" /> {loginError}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Credentials"}
                  </button>
               </form>

               <div className="mt-6 text-center">
                 <button 
                   onClick={() => {
                     if (loginReturnPath === 'setup') {
                       setCurrentView('setup');
                     } else {
                       setCurrentView('landing');
                     }
                   }}
                   className="text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
                 >
                   <ArrowLeft className="w-4 h-4" /> Back
                 </button>
               </div>
            </div>
         )}
      </div>
    );
  };

  // --- PUBLIC PORTAL VIEW ---
  if (currentView === 'portal' && publicContext) {
    return (
       <>
         <PublicPortal publicContext={publicContext} onLoginClick={() => {
            setCurrentView('login');
            setLoginReturnPath('landing'); 
         }} />
         <Toaster position="top-right" />
       </>
    );
  }

  // Fallback (should not happen usually)
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
};

export default App;
