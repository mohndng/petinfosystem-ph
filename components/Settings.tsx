


import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { SystemSettings, User } from '../types';
import { Save, Building2, MapPin, Bell, Image as ImageIcon, Mail, Phone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    // The db service automatically gets the barangayId from the session
    const barangayId = JSON.parse(localStorage.getItem('staff_session') || '{}').barangayId;
    if (barangayId) {
        const s = await db.settings.getByBarangayId(barangayId);
        setSettings(s);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;
    const formData = new FormData(e.currentTarget);
    
    const newSettings: SystemSettings = {
      ...settings,
      barangayName: formData.get('barangayName') as string,
      municipality: formData.get('municipality') as string,
      logoUrl: formData.get('logoUrl') as string,
      reminderDays: parseInt(formData.get('reminderDays') as string),
      supportEmail: formData.get('supportEmail') as string,
      emergencyHotline: formData.get('emergencyHotline') as string,
    };

    await db.settings.update(newSettings);
    toast.success('System settings updated successfully');
  };

  if (loading || !settings) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500 text-sm">Configure global application preferences and barangay details.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="font-bold text-slate-800">General Configuration</h3>
           <p className="text-xs text-slate-500">These details will appear on reports and certificates.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Barangay Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="barangayName"
                  defaultValue={settings.barangayName}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Municipality / City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="municipality"
                  defaultValue={settings.municipality}
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Reminder Days</label>
              <div className="relative">
                <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number" 
                  name="reminderDays"
                  defaultValue={settings.reminderDays}
                  min="1"
                  max="90"
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Days before expiration to show alerts.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL (Optional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="logoUrl"
                  defaultValue={settings.logoUrl}
                  placeholder="https://..."
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Contact Details Section */}
            <div className="md:col-span-2 pt-4 border-t border-slate-100">
               <h4 className="text-sm font-bold text-slate-800 mb-4">Contact Information (Help & Support)</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        name="supportEmail"
                        defaultValue={settings.supportEmail}
                        required
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900"
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Hotline</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        name="emergencyHotline"
                        defaultValue={settings.emergencyHotline}
                        required
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-900"
                      />
                    </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
             <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
               <Save className="w-4 h-4" /> Save Settings
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};