
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Menu, User as UserIcon, LogOut, Settings, UserCircle, ChevronDown, HelpCircle, Info, CheckCircle2, AlertTriangle, Terminal, Building2 } from 'lucide-react';
import { db } from '../services/db';
import { AppNotification, User } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
  user: User;
  barangayName: string;
  barangayLogo?: string;
  onEditProfileClick: () => void;
  onHelpClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onLogout, 
  user,
  barangayName,
  barangayLogo,
  onEditProfileClick,
  onHelpClick
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const data = await db.notifications.getAll();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    // Listen for updates from other components
    window.addEventListener('notificationUpdated', fetchNotifications);
    return () => window.removeEventListener('notificationUpdated', fetchNotifications);
  }, []);

  // Close notif dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
    setIsDropdownOpen(false);
    action();
  };

  const markRead = async (id: string) => {
    await db.notifications.markAsRead(id);
    // fetchNotifications(); // Refresh local state -- triggered by event
  };

  const markAllRead = async () => {
    await db.notifications.markAllAsRead();
    // fetchNotifications(); // Refresh local state -- triggered by event
  };

  const unreadCount = notifications ? notifications.filter(n => !n.isRead).length : 0;

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'system': return <Terminal className="w-4 h-4 text-slate-700" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 sticky top-0">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Branding with Logo - Visible on Mobile now */}
        <div className="flex items-center gap-2 sm:gap-3">
           {barangayLogo ? (
             <img src={barangayLogo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
           ) : (
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
               <Building2 className="w-5 h-5 text-slate-400" />
             </div>
           )}
           <div className="flex flex-col">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight leading-tight line-clamp-1 max-w-[140px] sm:max-w-none">Barangay {barangayName}</h2>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide hidden sm:block">Animal Registry System</p>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Bar - Hidden on small mobile */}
        <div className="hidden md:flex items-center bg-white rounded-full px-4 py-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all w-64">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Quick search ID..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 text-slate-900"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors outline-none focus:ring-2 focus:ring-blue-100"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"></span>
            )}
          </button>

          {isNotifOpen && (
             <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 z-40 origin-top-right overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                   {unreadCount > 0 && (
                     <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:underline">
                       Mark all read
                     </button>
                   )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                   {notifications && notifications.length > 0 ? (
                     notifications.map(notif => (
                       <div 
                        key={notif.id} 
                        onClick={() => markRead(notif.id)}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                       >
                          <div className="flex gap-3">
                             <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                               notif.type === 'success' ? 'bg-emerald-100' : 
                               notif.type === 'warning' ? 'bg-amber-100' : 
                               notif.type === 'system' ? 'bg-slate-200' : 'bg-blue-100'
                             }`}>
                                {getNotifIcon(notif.type)}
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-start mb-0.5">
                                  <p className={`text-sm font-semibold ${!notif.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</p>
                                  {!notif.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-1.5">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{getTimeAgo(notif.timestamp)}</p>
                             </div>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="py-8 text-center text-slate-400">
                       <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                       <p className="text-xs">No notifications yet</p>
                     </div>
                   )}
                </div>
             </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-all focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 leading-none capitalize">{user.fullName}</p>
              <p className="text-xs text-slate-500 mt-1 capitalize">{user.role}</p>
            </div>
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 text-blue-700 shadow-sm">
              <UserIcon className="w-5 h-5" />
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop to close on click outside */}
              <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)}></div>
              
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 z-40 transform origin-top-right">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  <p className="text-sm font-bold text-slate-800">Signed in as</p>
                  <p className="text-xs text-slate-500 truncate font-medium">{user.username}</p>
                </div>
                
                <div className="p-1">
                  <button 
                    onClick={() => handleAction(onEditProfileClick)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl flex items-center gap-3 transition-colors"
                  >
                    <UserCircle className="w-4 h-4" /> Edit Profile
                  </button>
                  <button 
                    onClick={() => handleAction(onHelpClick)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl flex items-center gap-3 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" /> Help & Support
                  </button>
                </div>
                
                <div className="h-px bg-slate-50 my-1 mx-2"></div>
                
                <div className="p-1">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
