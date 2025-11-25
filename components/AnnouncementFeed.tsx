
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Announcement } from '../types';
import { CreatePostModal } from './CreatePostModal';
import { Plus, Megaphone, Trash2, Loader2, Copy, Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface AnnouncementFeedProps {
  user: { id: string; username: string; role: string; fullName: string };
}

export const AnnouncementFeed: React.FC<AnnouncementFeedProps> = ({ user }) => {
  const [posts, setPosts] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete States
  const [verifyDeleteId, setVerifyDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshPosts = async () => {
    setLoading(true);
    const data = await db.announcements.getAll();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshPosts();
  }, []);

  const requestDelete = (id: string) => {
    setVerifyDeleteId(id);
    setTimeout(() => {
      setVerifyDeleteId(prev => prev === id ? null : prev);
    }, 3000);
  };

  const executeDelete = async (id: string) => {
    setVerifyDeleteId(null);
    setDeletingId(id);
    const toastId = toast.loading("Deleting post...");

    try {
      await db.announcements.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id)); // Optimistic update
      toast.success("Post deleted.", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to delete post.", { id: toastId });
      refreshPosts(); // Revert on error
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = (post: Announcement) => {
    const text = `📢 ${post.title.toUpperCase()}\n\n${post.content}\n\n— ${post.authorName} (${post.role})\n📅 ${new Date(post.datePosted).toLocaleDateString()}`;
    navigator.clipboard.writeText(text);
    toast.success("Announcement copied to clipboard!");
    
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (post: Announcement) => {
    const shareData = {
      title: post.title,
      text: `${post.title}\n\n${post.content}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Share cancelled
      }
    } else {
      handleCopy(post);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return `${Math.floor(diff/86400)}d`;
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Health': return 'bg-emerald-100 text-emerald-700';
      case 'Advisory': return 'bg-amber-100 text-amber-700';
      case 'Event': return 'bg-purple-100 text-purple-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading && posts.length === 0) return <div className="flex h-32 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h3 className="font-bold text-slate-800 flex items-center gap-2">
           <Megaphone className="w-5 h-5 text-blue-600" /> Community Bulletin
         </h3>
         {(user.role === 'Admin' || user.role === 'Staff') && (
           <button 
             onClick={() => setIsModalOpen(true)}
             className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
           >
             <Plus className="w-3 h-3" /> New Post
           </button>
         )}
       </div>

       <div className="space-y-4">
         {posts.map(post => (
           <div key={post.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
             
             {/* Header */}
             <div className="p-4 flex justify-between items-start">
               <div className="flex gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${post.role === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                   {post.authorName.charAt(0)}
                 </div>
                 <div>
                   <div className="flex items-center gap-2">
                     <p className="font-bold text-slate-900 text-sm">{post.authorName}</p>
                     <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${post.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                       {post.role}
                     </span>
                   </div>
                   <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-xs text-slate-400">{getTimeAgo(post.datePosted)}</span>
                     <span className="text-[10px] text-slate-300">•</span>
                     <span className={`text-[10px] px-1.5 rounded-full font-bold ${getCategoryColor(post.category)}`}>
                       {post.category}
                     </span>
                   </div>
                 </div>
               </div>
               
               {/* Permissions: Admin or Staff can delete posts */}
               {(user.role === 'Admin' || user.role === 'Staff') && (
                 <button 
                   onClick={() => verifyDeleteId === post.id ? executeDelete(post.id) : requestDelete(post.id)} 
                   disabled={deletingId === post.id}
                   className={`transition-all duration-200 flex items-center gap-1 ${
                       verifyDeleteId === post.id 
                       ? 'text-red-600 bg-red-50 px-2 py-1 rounded-lg font-bold text-xs shadow-sm' 
                       : 'text-slate-300 hover:text-red-500 p-1 hover:bg-red-50 rounded'
                   }`}
                   title="Delete Post"
                 >
                   {deletingId === post.id ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                   ) : verifyDeleteId === post.id ? (
                       <>Confirm?</>
                   ) : (
                       <Trash2 className="w-4 h-4" />
                   )}
                 </button>
               )}
             </div>

             {/* Content */}
             <div className="px-4 pb-2">
               <h4 className="font-bold text-slate-800 mb-1">{post.title}</h4>
               <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{post.content}</p>
             </div>

             {/* Media */}
             {post.photoUrl && (
               <div className="mt-3">
                 <img src={post.photoUrl} className="w-full h-48 object-cover bg-slate-100" alt="Post attachment" />
               </div>
             )}

             {/* Link Preview */}
             {post.linkPreview && (
               <div className="mx-4 mt-3 mb-2 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer" onClick={() => window.open(post.linkPreview!.url, '_blank')}>
                 {post.linkPreview.imageUrl && (
                   <div className="h-32 overflow-hidden">
                      <img src={post.linkPreview.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Link thumbnail" />
                   </div>
                 )}
                 <div className="p-3">
                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{post.linkPreview.domain}</p>
                   <p className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600">{post.linkPreview.title}</p>
                   <p className="text-xs text-slate-500 line-clamp-2 mt-1">{post.linkPreview.description}</p>
                 </div>
               </div>
             )}

             {/* Functional Action Footer */}
             <div className="px-4 py-3 border-t border-slate-50 flex gap-3 mt-2 bg-slate-50/50">
                <button 
                  onClick={() => handleCopy(post)}
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  {copiedId === post.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Text
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleShare(post)}
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
             </div>

           </div>
         ))}

         {posts.length === 0 && (
           <div className="text-center py-8 text-slate-400">
             <p className="text-sm">No announcements yet.</p>
           </div>
         )}
       </div>

       {isModalOpen && (
         <CreatePostModal 
           user={user} 
           onClose={() => setIsModalOpen(false)} 
           onSuccess={() => { setIsModalOpen(false); refreshPosts(); }} 
         />
       )}
    </div>
  );
};
