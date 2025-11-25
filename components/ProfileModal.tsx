
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/db';
import { User } from '../types';
import { X, Save, User as UserIcon, Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  userId: string;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ userId, onClose }) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const u = await db.users.getById(userId);
    setUser(u);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadUser();
    window.addEventListener('dbUpdated', loadUser);
    return () => {
      window.removeEventListener('dbUpdated', loadUser);
    };
  }, [loadUser]);

  if (loading) return <div className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>;
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFullName = formData.get('fullName') as string;
    const newPassword = formData.get('password') as string;

    const updatedUser: User = {
      ...user,
      fullName: newFullName,
      password: newPassword ? newPassword : user.password
    };

    await db.users.update(updatedUser);
    toast.success('Profile updated successfully!');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 z-[9999] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 transform scale-100 transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 border-4 border-white shadow-lg mb-3">
                <span className="text-3xl font-bold">{user.fullName.charAt(0)}</span>
              </div>
              <span className={`absolute bottom-3 right-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border-2 border-white ${user.role === 'Admin' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white'}`}>
                {user.role}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">@{user.username}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
               <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                type="text" 
                name="fullName" 
                defaultValue={user.fullName} 
                required 
                className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
               />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Leave blank to keep current"
                className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
               />
               <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
               >
                 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
               </button>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
