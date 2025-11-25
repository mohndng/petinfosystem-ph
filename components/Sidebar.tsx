
import React from 'react';
import { LayoutDashboard, Dog, FileText, Syringe, AlertTriangle, Settings, LogOut, Ghost, FileBarChart, X, ChevronRight, Users, Key } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: string; // Added role prop
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, isOpen, onClose, userRole }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', label: 'Register Pet', icon: FileText },
    { id: 'registry', label: 'Pet Database', icon: Dog },
    { id: 'vaccination', label: 'Vaccination', icon: Syringe },
    { id: 'incidents', label: 'Bite Incidents', icon: AlertTriangle },
    { id: 'strays', label: 'Stray Reports', icon: Ghost },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-[#0f172a] text-white shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none flex flex-col
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/50">
              <Dog className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-100">PetInfo<span className="text-blue-500">Sys</span></span>
          </div>
          <button onClick={onClose} className="lg:hidden ml-auto text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
          
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
              </button>
            );
          })}

          {/* Only Show System Menu for Admin */}
          {userRole === 'Admin' && (
            <>
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4">System Control</p>
              
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-slate-100 ${activeTab === 'users' ? 'bg-slate-800 text-white' : ''}`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium text-sm">User Management</span>
              </button>

              <button
                onClick={() => setActiveTab('community_settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-slate-100 ${activeTab === 'community_settings' ? 'bg-slate-800 text-white' : ''}`}
              >
                <Key className="w-5 h-5" />
                <span className="font-medium text-sm">Community Access</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-slate-100 ${activeTab === 'settings' ? 'bg-slate-800 text-white' : ''}`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium text-sm">System Settings</span>
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0b1120]">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
