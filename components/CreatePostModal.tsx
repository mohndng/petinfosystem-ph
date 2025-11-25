
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Announcement, LinkPreview } from '../types';
import { db } from '../services/db';
import { fetchLinkPreview } from '../services/linkPreview';
import { X, Image as ImageIcon, Link, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { CustomSelect } from './CustomSelect';

interface CreatePostModalProps {
  user: { id: string; username: string; role: string; fullName: string };
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ user, onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('News');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Link Preview State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLinkFetch = async () => {
    if (!linkUrl) return;
    setLoadingLink(true);
    const preview = await fetchLinkPreview(linkUrl);
    setLoadingLink(false);
    if (preview) {
      setLinkPreview(preview);
      setShowLinkInput(false); // Hide input once fetched
    } else {
      toast.error("Could not fetch link preview.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !title) {
       toast.error("Title and Content are required");
       return;
    }

    setIsSubmitting(true);

    try {
      // FIX: Removed incorrect `Announcement` type annotation.
      // The `db.announcements.add` service injects the `barangayId` automatically.
      const newPost = {
        id: crypto.randomUUID(),
        authorId: user.id,
        authorName: user.fullName,
        role: user.role as 'Admin' | 'Staff',
        title,
        content,
        datePosted: new Date().toISOString(),
        category: category as any,
        photoUrl: imagePreview || undefined,
        linkPreview: linkPreview || undefined,
        likes: 0
      };

      await db.announcements.add(newPost);
      toast.success("Announcement posted!");
      onSuccess(); // Now called only after await completes
    } catch (error) {
      console.error(error);
      toast.error("Failed to post announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 z-[9999] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800">Create Announcement</h2>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full shadow-sm border border-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          
          <div className="flex gap-4">
             <div className="flex-1">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
               <input 
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-bold"
                 placeholder="Headline..."
                 required
                 disabled={isSubmitting}
               />
             </div>
             <div className="w-1/3">
               <CustomSelect 
                 label="Category"
                 value={category}
                 onChange={setCategory}
                 options={[
                   { label: 'News', value: 'News' },
                   { label: 'Event', value: 'Event' },
                   { label: 'Advisory', value: 'Advisory' },
                   { label: 'Health', value: 'Health' }
                 ]}
                 disabled={isSubmitting}
               />
             </div>
          </div>

          <div>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 min-h-[120px] resize-none"
              placeholder="What's happening in the community?"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Media Attachments Area */}
          <div className="space-y-3">
             {/* Photo Preview */}
             {imagePreview && (
               <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                 <img src={imagePreview} className="w-full h-48 object-cover" alt="Preview" />
                 <button 
                   type="button"
                   onClick={() => setImagePreview(null)}
                   disabled={isSubmitting}
                   className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-slate-700 shadow-sm hover:text-red-500"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
             )}

             {/* Link Preview Card */}
             {linkPreview && (
               <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button 
                   type="button"
                   onClick={() => setLinkPreview(null)}
                   disabled={isSubmitting}
                   className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-slate-700 shadow-sm hover:text-red-500 z-10"
                 >
                   <X className="w-4 h-4" />
                 </button>
                 {linkPreview.imageUrl && (
                   <div className="h-32 bg-slate-200">
                     <img src={linkPreview.imageUrl} className="w-full h-full object-cover" alt="Link" />
                   </div>
                 )}
                 <div className="p-3">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-0.5">{linkPreview.domain}</p>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{linkPreview.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{linkPreview.description}</p>
                 </div>
               </div>
             )}

             {/* Link Input */}
             {showLinkInput && !linkPreview && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                   <input 
                     value={linkUrl}
                     onChange={(e) => setLinkUrl(e.target.value)}
                     placeholder="Paste URL (e.g. https://facebook.com/...)"
                     className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                     disabled={isSubmitting}
                   />
                   <button 
                     type="button"
                     onClick={handleLinkFetch}
                     disabled={loadingLink || isSubmitting}
                     className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900"
                   >
                     {loadingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                   </button>
                </div>
             )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
             <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors tooltip"
                  title="Add Photo"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                
                <button 
                  type="button"
                  onClick={() => setShowLinkInput(!showLinkInput)} 
                  disabled={isSubmitting}
                  className={`p-2.5 rounded-xl transition-colors ${showLinkInput ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
                  title="Add Link"
                >
                  <Link className="w-5 h-5" />
                </button>
             </div>

             <button 
               type="submit" 
               disabled={isSubmitting}
               className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all"
             >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
             </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
