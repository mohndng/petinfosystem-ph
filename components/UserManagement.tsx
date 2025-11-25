
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { UserPlus, Edit2, Trash2, Shield, User as UserIcon, X, Key, RefreshCw, Lock, CheckCircle2, AlertCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomSelect } from './CustomSelect';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyDeleteId, setVerifyDeleteId] = useState<string | null>(null); // For 2-step confirmation
  
  // Form States
  const [role, setRole] = useState('Staff');
  const [status, setStatus] = useState('Active');
  const [generatedPass, setGeneratedPass] = useState('');

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    const data = await db.users.getAll();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUsers();
    window.addEventListener('dbUpdated', refreshUsers);
    return () => {
      window.removeEventListener('dbUpdated', refreshUsers);
    };
  }, [refreshUsers]);

  // Step 1: Request Delete (Changes Button UI)
  const requestDelete = (id: string) => {
    if (id === currentUser.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setVerifyDeleteId(id);
    // Auto-reset after 3 seconds if not confirmed
    setTimeout(() => {
      setVerifyDeleteId(prev => prev === id ? null : prev);
    }, 3000);
  };

  // Step 2: Execute Delete (Actual DB Call)
  const executeDelete = async (id: string) => {
    setVerifyDeleteId(null);
    setDeletingId(id);
    const toastId = toast.loading('Removing user...');

    try {
      await db.users.delete(id);
      toast.dismiss(toastId);
      toast.success('User deleted successfully');
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.dismiss(toastId);
      toast.error(`Failed to delete: ${error.message || 'Unknown error'}`, { duration: 4000 });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setRole(user.role);
      setStatus(user.status);
      setGeneratedPass('');
    } else {
      setEditingUser(null);
      setRole('Staff');
      setStatus('Active');
      setGeneratedPass('');
    }
    setIsModalOpen(true);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(pass);
    toast.success("Secure password generated");
  };

  // Helper for generating UUIDs
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const password = formData.get('password') as string;

    try {
      const userData: User = {
        id: editingUser ? editingUser.id : generateUUID(),
        barangayId: editingUser ? editingUser.barangayId : currentUser.barangayId,
        fullName: formData.get('fullName') as string,
        username: formData.get('username') as string,
        role: role as 'Admin' | 'Staff',
        status: status as 'Active' | 'Inactive',
        password: password || (editingUser?.password || undefined),
      };

      if (editingUser) {
        await db.users.update(userData);
        toast.success('User updated successfully');
      } else {
        if (!userData.password) {
            toast.error("A password is required for new users.");
            setIsSubmitting(false);
            return;
        }
        await db.users.add(userData);
        await db.notifications.add({
          title: 'New Staff Assigned',
          message: `${userData.fullName} has been added as a ${userData.role}.`,
          type: 'info'
        });
        toast.success('User added successfully');
      }
      
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error(error);
      toast.error(`Error: ${error.message || 'Failed to save user'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [{ label: 'Admin', value: 'Admin' }, { label: 'Staff', value: 'Staff' }];
  const statusOptions = [{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }];

  if (loading && users.length === 0) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm">Manage access for Barangay officials and staff.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors font-medium"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">User Info</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUser.id;
                const isDeleting = deletingId === user.id;
                const isConfirming = verifyDeleteId === user.id;
                
                return (
                  <tr key={user.id} className={`transition-colors ${isCurrentUser ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'} ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'Admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role === 'Admin' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-bold text-slate-900">{user.fullName}</p>
                             {isCurrentUser && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold uppercase">You</span>}
                          </div>
                          <p className="text-xs text-slate-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                        user.role === 'Admin' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                         user.status === 'Active' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-100'
                       }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {user.status}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.lastActive ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(user.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          <span className="text-slate-400">({new Date(user.lastActive).toLocaleDateString()})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isCurrentUser && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                            disabled={isDeleting}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button 
                            onClick={() => isConfirming ? executeDelete(user.id) : requestDelete(user.id)}
                            className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-1 ${
                              isConfirming 
                                ? 'bg-red-600 text-white w-auto px-3 shadow-lg shadow-red-200' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Delete User"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" /> 
                            ) : isConfirming ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span className="text-xs font-bold">Confirm?</span>
                              </>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                      {isCurrentUser && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-bold animate-pulse">Online</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                 <h2 className="text-lg font-bold text-slate-900">{editingUser ? 'Edit User' : 'Create New Account'}</h2>
                 <p className="text-xs text-slate-500">Configure access levels and credentials.</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm border border-slate-100">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Section 1: Personal Info */}
              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                   <UserIcon className="w-4 h-4 text-blue-500" /> Personal Information
                 </h3>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input name="fullName" defaultValue={editingUser?.fullName} required className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900" placeholder="e.g. Juan Dela Cruz" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <CustomSelect 
                         label="System Role" 
                         value={role} 
                         onChange={setRole} 
                         options={roleOptions} 
                       />
                    </div>
                    <div>
                       <CustomSelect 
                         label="Account Status" 
                         value={status} 
                         onChange={setStatus} 
                         options={statusOptions} 
                       />
                    </div>
                 </div>
                 
                 {/* Role Description Helper */}
                 <div className={`p-3 rounded-xl text-xs border ${role === 'Admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                    <div className="flex gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="font-bold">{role} Privileges:</span>
                        {role === 'Admin' 
                          ? " Full access to System Settings, User Management, Reports, and Data Deletion." 
                          : " Access to Dashboard, Pet Registration, Vaccination Logging, and Incident Reporting only."}
                      </div>
                    </div>
                 </div>
              </div>

              <hr className="border-slate-100" />

              {/* Section 2: Security Credentials */}
              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                   <Key className="w-4 h-4 text-amber-500" /> Security Credentials
                 </h3>
                 
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                      <input name="username" defaultValue={editingUser?.username} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 font-mono text-sm" placeholder="jdelacruz" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                        <button 
                          type="button" 
                          onClick={generatePassword}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-100 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" /> Generate Strong
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          name="password" 
                          type="text" 
                          value={generatedPass || undefined}
                          onChange={(e) => setGeneratedPass(e.target.value)}
                          placeholder={editingUser ? "•••••• (Unchanged)" : "Enter temporary password"} 
                          required={!editingUser} 
                          className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 font-mono text-sm" 
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        {editingUser ? "Leave blank to keep current password." : "Share this password securely with the staff member."}
                      </p>
                    </div>
                 </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancel</button>
                 <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold shadow-lg flex items-center gap-2 transition-all">
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {editingUser ? 'Update Access' : 'Create Account'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
