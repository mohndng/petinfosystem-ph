
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../services/db';
import { Pet, Vaccination, Owner, SystemSettings } from '../types';
import { ArrowLeft, Printer, Calendar, Shield, MapPin, Phone, User, FileText, Activity, Dna, Heart, Hash, Settings, X, Download, Check, Layout, Palette, Image as ImageIcon, Eye, EyeOff, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

interface PetProfileProps {
  petId: string;
  onBack: () => void;
  userRole: string;
}

interface CertificateConfig {
  template: 'modern' | 'classic';
  primaryColor: string;
  title: string;
  showPhoto: boolean;
  showOwner: boolean;
  showVaccines: boolean;
}

export const PetProfile: React.FC<PetProfileProps> = ({ petId, onBack, userRole }) => {
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<Pet | undefined>(undefined);
  const [owner, setOwner] = useState<Owner | undefined>(undefined);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Certificate State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certConfig, setCertConfig] = useState<CertificateConfig>({
    template: 'modern',
    primaryColor: '#2563eb', // Default Blue
    title: 'CERTIFICATE OF REGISTRATION',
    showPhoto: true,
    showOwner: true,
    showVaccines: true,
  });
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [cachedPhoto, setCachedPhoto] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Delete State
  const [verifyDelete, setVerifyDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = await db.pets.get(petId);
    if (p) {
      const [o, v, s] = await Promise.all([
        db.owners.get(p.ownerId),
        db.vaccinations.getByPetId(petId),
        db.settings.getByBarangayId(p.barangayId)
      ]);
      setPet(p);
      setOwner(o);
      setVaccinations(v.sort((a, b) => new Date(b.dateGiven).getTime() - new Date(a.dateGiven).getTime()));
      setSettings(s);
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    fetchData();
    window.addEventListener('dbUpdated', fetchData);
    return () => {
      window.removeEventListener('dbUpdated', fetchData);
    };
  }, [fetchData]);

  // Clean up blob URL
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  // --- DELETE HANDLER ---
  const handleDelete = async () => {
    if (!verifyDelete) {
        setVerifyDelete(true);
        setTimeout(() => setVerifyDelete(false), 3000); // Reset after 3s
        return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting record...");
    try {
        await db.pets.delete(petId);
        toast.success("Pet record deleted successfully", { id: toastId });
        onBack(); // Navigate back to list
    } catch (error: any) {
        console.error("Delete error:", error);
        toast.error(`Delete failed: ${error.message}`, { id: toastId });
        setIsDeleting(false);
        setVerifyDelete(false);
    }
  };

  // --- PDF GENERATION ENGINE ---

  const getDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          reject(new Error('Canvas context failed'));
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
  };

  // Pre-load image when modal opens
  useEffect(() => {
    if (isCertModalOpen && pet?.photoUrl && !cachedPhoto) {
      getDataUrl(pet.photoUrl)
        .then(setCachedPhoto)
        .catch(err => console.warn("Image load failed", err));
    }
  }, [isCertModalOpen, pet, cachedPhoto]);

  // Debounced Preview Updater
  useEffect(() => {
    if (isCertModalOpen && pet && owner && settings) {
      const timer = setTimeout(() => {
        updatePreview();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [certConfig, isCertModalOpen, cachedPhoto]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const generateDoc = () => {
    if (!pet || !owner || !settings) return new jsPDF();

    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const [r, g, b] = hexToRgb(certConfig.primaryColor);

    // Enforce White Background (Fixes Dark Mode Preview)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, width, height, 'F');

    // --- TEMPLATE: MODERN ---
    if (certConfig.template === 'modern') {
        // 1. Header Background
        const headerHeight = 50;
        doc.setFillColor(r, g, b);
        doc.rect(0, 0, width, headerHeight, 'F');
        
        // Header Text - Adjusted Layout to avoid merging
        doc.setTextColor(255, 255, 255);
        
        // Left Side: Republic & Barangay
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("REPUBLIC OF THE PHILIPPINES", 20, 15);
        
        doc.setFontSize(16);
        doc.text(`BARANGAY ${settings.barangayName?.toUpperCase() || 'UNKNOWN'}`, 20, 23);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Municipality of ${settings.municipality || '____________'}`, 20, 29);
        
        // Right Side: Title & Registry ID
        // Adjusted X position and alignment to prevent overlap
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text(certConfig.title.toUpperCase(), width - 20, 20, { align: "right" });
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`REGISTRY ID: ${pet.id.split('-')[0].toUpperCase()}`, width - 20, 30, { align: "right" });
        doc.text(`DATE REGISTERED: ${pet.registrationDate}`, width - 20, 35, { align: "right" });

        let startY = 70; // Start content lower

        // 2. Pet Identity Section
        const photoSize = 35;
        const leftMargin = 20;
        
        // Photo
        if (certConfig.showPhoto) {
            if (cachedPhoto) {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.rect(leftMargin, startY, photoSize, photoSize); 
                doc.addImage(cachedPhoto, 'JPEG', leftMargin, startY, photoSize, photoSize, undefined, 'FAST');
            } else {
                doc.setDrawColor(200);
                doc.setFillColor(240);
                doc.rect(leftMargin, startY, photoSize, photoSize, 'FD');
                doc.setTextColor(150);
                doc.setFontSize(8);
                doc.text("NO PHOTO", leftMargin + 17.5, startY + 20, {align: 'center'});
            }
        }

        // Pet Text Details (Right of photo)
        const textX = certConfig.showPhoto ? leftMargin + photoSize + 10 : leftMargin;
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text(pet.name.toUpperCase(), textX, startY + 10);
        
        doc.setFontSize(12);
        doc.setTextColor(r, g, b);
        doc.text(`${pet.species.toUpperCase()}  •  ${pet.breed.toUpperCase()}`, textX, startY + 18);

        // Status Badge
        const statusColor = pet.status === 'Alive' ? [22, 163, 74] : [220, 38, 38];
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(textX, startY + 24, 25, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(pet.status.toUpperCase(), textX + 12.5, startY + 28, { align: 'center' });

        startY += photoSize + 15;

        // 3. Owner & Pet Details Block (FIXED OVERLAP & SPACING)
        if (certConfig.showOwner) {
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            
            // Calculate height needed for address
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const addressWidth = width - 60; // Ensure enough padding inside the box
            const addressLines = doc.splitTextToSize(owner.address, addressWidth);
            const addressBlockHeight = (addressLines.length * 5);
            
            // Recalculate block height: 
            // Header (12) + Row 1 (12) + Address Label (8) + Address Body (addressBlockHeight) + Gap (8) + Row 3 (12) + Padding (10)
            const blockHeight = 62 + addressBlockHeight; 
            
            doc.roundedRect(20, startY, width - 40, blockHeight, 2, 2, 'FD');
            
            let innerY = startY + 12;
            const col1 = 25;
            const col2 = 110;

            // Header
            doc.setFontSize(9);
            doc.setTextColor(r, g, b);
            doc.setFont("helvetica", "bold");
            doc.text("OWNER & PET PARTICULARS", col1, innerY);
            innerY += 10;

            // Row 1: Name & Contact
            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text("OWNER NAME", col1, innerY);
            doc.text("CONTACT NUMBER", col2, innerY);
            
            innerY += 5;
            doc.setFontSize(10);
            doc.setTextColor(30);
            doc.setFont("helvetica", "bold");
            doc.text(owner.fullName.toUpperCase(), col1, innerY);
            doc.setFont("helvetica", "normal");
            doc.text(owner.contactNumber, col2, innerY);
            
            innerY += 12;

            // Row 2: Address (Full Width Row to prevent overlap)
            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.setFont("helvetica", "bold");
            doc.text("ADDRESS", col1, innerY);
            
            innerY += 5;
            doc.setFontSize(10);
            doc.setTextColor(30);
            doc.setFont("helvetica", "normal");
            doc.text(addressLines, col1, innerY);
            
            innerY += addressBlockHeight + 10; // Move pointer past address + gap

            // Row 3: Pet Stats
            const pCol1 = 25;
            const pCol2 = 70;
            const pCol3 = 115;
            const pCol4 = 160;

            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.setFont("helvetica", "bold");
            doc.text("GENDER", pCol1, innerY);
            doc.text("COLOR", pCol2, innerY);
            doc.text("BIRTHDATE", pCol3, innerY);
            doc.text("SPAYED/NEUTERED", pCol4, innerY);

            innerY += 5;
            doc.setFontSize(10);
            doc.setTextColor(30);
            doc.setFont("helvetica", "normal");
            doc.text(pet.sex, pCol1, innerY);
            doc.text(pet.color, pCol2, innerY);
            doc.text(pet.birthDate || "N/A", pCol3, innerY);
            doc.text(pet.isSpayedNeutered ? "Yes" : "No", pCol4, innerY);

            startY += blockHeight + 15;
        }

        // 4. Vaccination History
        if (certConfig.showVaccines) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(r, g, b);
            doc.text("VACCINATION RECORD", 20, startY);
            
            startY += 8;
            
            // Table Header
            doc.setFillColor(r, g, b);
            doc.rect(20, startY, width - 40, 8, 'F');
            doc.setTextColor(255);
            doc.setFontSize(8);
            
            // Adjusted Column Positions
            const tCol1 = 25;  // Date
            const tCol2 = 60;  // Product (Moved right)
            const tCol3 = 115; // Vet (Moved right)
            const tCol4 = 170; // Next Due (Moved right)

            doc.text("DATE GIVEN", tCol1, startY + 5);
            doc.text("VACCINE / PRODUCT", tCol2, startY + 5);
            doc.text("VETERINARIAN", tCol3, startY + 5);
            doc.text("NEXT DUE", tCol4, startY + 5);

            startY += 8;
            doc.setTextColor(30);
            doc.setFont("helvetica", "normal");

            vaccinations.slice(0, 8).forEach((vac, i) => {
                if (i % 2 === 0) {
                    doc.setFillColor(245);
                    doc.rect(20, startY, width - 40, 8, 'F');
                }
                
                // Wrap text for vaccine name if too long
                const vacName = vac.vaccineName.length > 25 ? vac.vaccineName.substring(0, 22) + '...' : vac.vaccineName;
                const vetName = vac.veterinarian.length > 25 ? vac.veterinarian.substring(0, 22) + '...' : vac.veterinarian;

                doc.text(vac.dateGiven, tCol1, startY + 5);
                doc.text(vacName, tCol2, startY + 5);
                doc.text(vetName, tCol3, startY + 5);
                
                const isExpired = new Date(vac.nextDueDate) < new Date();
                if (isExpired) doc.setTextColor(220, 38, 38);
                doc.text(vac.nextDueDate, tCol4, startY + 5);
                doc.setTextColor(30);
                
                startY += 8;
            });
            
            if (vaccinations.length === 0) {
                 doc.setFont("helvetica", "italic");
                 doc.setTextColor(150);
                 doc.text("No vaccination records found in the system.", width/2, startY + 8, {align: 'center'});
            }
        }
        
        // 5. Signatures (Bottom)
        const sigY = height - 40;
        doc.setDrawColor(100);
        doc.setLineWidth(0.5);
        
        // Left Sig
        doc.line(30, sigY, 90, sigY);
        doc.setFontSize(8);
        doc.setTextColor(50);
        doc.setFont("helvetica", "bold");
        doc.text("LICENSED VETERINARIAN / CITY VET", 60, sigY + 5, { align: "center" });

        // Right Sig
        doc.line(width - 90, sigY, width - 30, sigY);
        doc.text("BARANGAY CAPTAIN", width - 60, sigY + 5, { align: "center" });

    } 
    // --- TEMPLATE: CLASSIC ---
    else {
        // Border
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(1.5);
        doc.rect(10, 10, width - 20, height - 20);
        doc.setLineWidth(0.5);
        doc.rect(12, 12, width - 24, height - 24);

        // Header
        let y = 30;
        doc.setFont("times", "bold");
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.text("REPUBLIC OF THE PHILIPPINES", width / 2, y, { align: "center" });
        y += 6;
        doc.text(`BARANGAY ${settings.barangayName?.toUpperCase() || 'UNKNOWN'}`, width / 2, y, { align: "center" });
        y += 6;
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text(`Municipality of ${settings.municipality || '____________'}`, width / 2, y, { align: "center" });
        
        y += 20;
        doc.setFont("times", "bold");
        doc.setFontSize(28);
        doc.setTextColor(r, g, b);
        doc.text(certConfig.title.toUpperCase(), width / 2, y, { align: "center" });
        
        y += 10;
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Registration No: ${pet.id.split('-')[0].toUpperCase()}`, width / 2, y, { align: "center" });

        y += 10;
        // Line Separator
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.5);
        doc.line(60, y, width - 60, y);

        y += 20;

        // Photo (Centered)
        if (certConfig.showPhoto && cachedPhoto) {
            const imgSize = 40;
            const x = (width - imgSize) / 2;
            doc.addImage(cachedPhoto, 'JPEG', x, y, imgSize, imgSize);
            doc.setDrawColor(30);
            doc.rect(x, y, imgSize, imgSize);
            y += imgSize + 10;
        } else if (certConfig.showPhoto) {
            y += 40; // Spacer
        }

        // Pet Name
        doc.setFont("times", "bold");
        doc.setFontSize(24);
        doc.setTextColor(0);
        doc.text(pet.name.toUpperCase(), width / 2, y, { align: "center" });
        
        y += 8;
        doc.setFontSize(14);
        doc.setFont("times", "normal");
        doc.text(`${pet.breed} | ${pet.species} | ${pet.sex}`, width / 2, y, { align: "center" });

        y += 20;

        // Owner Section
        if (certConfig.showOwner) {
            doc.setFontSize(12);
            doc.text(`Owned by: ${owner.fullName}`, width / 2, y, { align: "center" });
            y += 6;
            doc.setFontSize(10);
            doc.setTextColor(100);
            
            // Fix overlapping address in Classic template too
            const addressLines = doc.splitTextToSize(owner.address, width - 60);
            doc.text(addressLines, width / 2, y, { align: "center" });
            
            y += (addressLines.length * 5) + 20;
        }

        // Vaccine List (Simple centered)
        if (certConfig.showVaccines) {
            doc.setFont("times", "bold");
            doc.setFontSize(12);
            doc.setTextColor(r, g, b);
            doc.text("Latest Vaccination", width / 2, y, { align: "center" });
            y += 8;
            
            doc.setFont("times", "normal");
            doc.setFontSize(10);
            doc.setTextColor(0);

            if (vaccinations.length > 0) {
                const latest = vaccinations[0];
                doc.text(`${latest.vaccineName} - Given: ${latest.dateGiven}`, width / 2, y, { align: "center" });
                y += 5;
                doc.text(`Next Due: ${latest.nextDueDate}`, width / 2, y, { align: "center" });
            } else {
                doc.text("No records found", width / 2, y, { align: "center" });
            }
        }
    }

    // Footer (Both templates)
    const footerY = height - 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by PetInfoSys | ${new Date().toLocaleDateString()}`, 20, footerY);
    doc.text("Official Record", width - 20, footerY, { align: "right" });

    return doc;
  };

  const updatePreview = () => {
    try {
        const doc = generateDoc();
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
    } catch (e) {
        console.error("PDF Generation failed", e);
    }
  };

  const handleDownload = () => {
    const doc = generateDoc();
    doc.save(`${pet?.name}_Certificate.pdf`);
    toast.success("Certificate Downloaded");
    setIsCertModalOpen(false);
  };


  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (!pet || !owner) return <div>Pet not found</div>;

  const activeVaccine = vaccinations.find(v => 
    v.vaccineType.includes('Core') && new Date(v.nextDueDate) > new Date()
  );

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* Actions Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Registry
        </button>
        <div className="flex gap-3 w-full sm:w-auto">
          {userRole === 'Admin' && (
            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${verifyDelete ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'}`}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : verifyDelete ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              {verifyDelete ? 'Confirm Delete?' : 'Delete Record'}
            </button>
          )}
          <button onClick={() => setIsCertModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">
            <Printer className="w-4 h-4" /> Print Certificate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* PET PROFILE CONTENT (Existing UI) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
             <div className="absolute top-4 right-4 z-10">
                {activeVaccine ? (
                  <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                    <Shield className="w-3 h-3" /> Protected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md animate-pulse">
                    <Shield className="w-3 h-3" /> Unvaccinated
                  </span>
                )}
             </div>

             <div className="h-48 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             </div>
             <div className="px-6 pb-8 relative text-center -mt-20">
                <div className="inline-block p-1.5 bg-white rounded-3xl shadow-xl mb-4">
                  <img src={pet.photoUrl} alt={pet.name} className="w-36 h-36 rounded-2xl object-cover bg-slate-100" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">{pet.name}</h1>
                <div className="flex items-center justify-center gap-2 text-slate-500 font-medium mt-1">
                   <span>{pet.breed}</span>
                   <span>•</span>
                   <span>{pet.species}</span>
                </div>
             </div>

             <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100">
                <div className="p-4 text-center hover:bg-slate-50 transition-colors">
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Sex</p>
                   <p className="text-slate-800 font-semibold flex items-center justify-center gap-1">
                     <Dna className="w-4 h-4 text-blue-500" /> {pet.sex}
                   </p>
                </div>
                <div className="p-4 text-center hover:bg-slate-50 transition-colors">
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Color</p>
                   <p className="text-slate-800 font-semibold">{pet.color}</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
             <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
               <User className="w-5 h-5 text-indigo-600" /> Owner Information
             </h3>
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                   <div className="bg-slate-100 p-2 rounded-lg"><User className="w-4 h-4 text-slate-600" /></div>
                   <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Full Name</p>
                      <p className="text-sm font-semibold text-slate-800">{owner.fullName}</p>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <div className="bg-slate-100 p-2 rounded-lg"><Phone className="w-4 h-4 text-slate-600" /></div>
                   <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Contact Number</p>
                      <p className="text-sm font-semibold text-slate-800 font-mono">{owner.contactNumber}</p>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <div className="bg-slate-100 p-2 rounded-lg"><MapPin className="w-4 h-4 text-slate-600" /></div>
                   <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Address</p>
                      <p className="text-sm font-semibold text-slate-800">{owner.address}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN - MEDICAL HISTORY */}
        <div className="xl:col-span-2 space-y-6">
           <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
              <div className="bg-white p-2 rounded-xl shadow-sm text-indigo-600">
                 <Hash className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="font-bold text-indigo-900">System Registration</h4>
                 <p className="text-sm text-indigo-700 mt-1">
                   Registered on <span className="font-bold">{new Date(pet.registrationDate).toLocaleDateString()}</span> • 
                   System ID: <span className="font-mono bg-white px-1.5 rounded border border-indigo-200">{pet.id}</span>
                 </p>
              </div>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Vaccination & Medical History</h3>
                    <p className="text-xs text-slate-500">Complete record of immunizations and treatments.</p>
                  </div>
                  <Calendar className="w-5 h-5 text-slate-400" />
               </div>
               
               <div className="p-0">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                         <tr>
                            <th className="px-6 py-4">Date Given</th>
                            <th className="px-6 py-4">Product / Vaccine</th>
                            <th className="px-6 py-4">Batch No.</th>
                            <th className="px-6 py-4">Next Due</th>
                            <th className="px-6 py-4 text-right">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vaccinations.map(vac => {
                          const isExpired = new Date(vac.nextDueDate) < new Date();
                          return (
                            <tr key={vac.id} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-6 py-4">
                                  <p className="font-bold text-slate-800 text-sm">{vac.dateGiven}</p>
                                  <p className="text-[10px] text-slate-400">{vac.clinicName}</p>
                               </td>
                               <td className="px-6 py-4">
                                  <p className="text-sm font-semibold text-blue-700">{vac.vaccineName}</p>
                                  <p className="text-xs text-slate-500">{vac.vaccineType}</p>
                               </td>
                               <td className="px-6 py-4">
                                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600">{vac.lotNumber}</span>
                               </td>
                               <td className="px-6 py-4 text-sm text-slate-600">
                                  {vac.nextDueDate}
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${isExpired ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {isExpired ? 'Expired' : 'Valid'}
                                  </span>
                               </td>
                            </tr>
                          );
                        })}
                        {vaccinations.length === 0 && (
                          <tr>
                             <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                <Shield className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>No medical records found for this pet.</p>
                             </td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                 </div>
               </div>
           </div>
        </div>
      </div>

      {/* --- CERTIFICATE MODAL --- */}
      {isCertModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex overflow-hidden">
              
              {/* Sidebar Controls */}
              <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
                 <div className="p-6 border-b border-slate-200 bg-white">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                       <Settings className="w-5 h-5 text-blue-600" /> Configure Layout
                    </h2>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Template Selection */}
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Layout className="w-4 h-4" /> Template Style
                       </label>
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                             onClick={() => setCertConfig({...certConfig, template: 'modern'})}
                             className={`p-3 rounded-xl border text-sm font-bold transition-all ${certConfig.template === 'modern' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                          >
                             Modern
                          </button>
                          <button 
                             onClick={() => setCertConfig({...certConfig, template: 'classic'})}
                             className={`p-3 rounded-xl border text-sm font-bold transition-all ${certConfig.template === 'classic' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                          >
                             Classic
                          </button>
                       </div>
                    </div>

                    {/* Branding */}
                    <div className="space-y-3">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Palette className="w-4 h-4" /> Theme Color
                       </label>
                       <div className="flex items-center gap-3">
                          <input 
                             type="color" 
                             value={certConfig.primaryColor}
                             onChange={(e) => setCertConfig({...certConfig, primaryColor: e.target.value})}
                             className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
                          />
                          <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">{certConfig.primaryColor}</span>
                       </div>
                    </div>

                    {/* Content Toggles */}
                    <div className="space-y-4">
                       <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Content Visibility
                       </label>
                       
                       <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                          <span className="text-sm font-medium text-slate-700">Pet Photo</span>
                          <div className={`w-10 h-6 rounded-full relative transition-colors ${certConfig.showPhoto ? 'bg-blue-600' : 'bg-slate-200'}`} onClick={() => setCertConfig({...certConfig, showPhoto: !certConfig.showPhoto})}>
                             <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${certConfig.showPhoto ? 'translate-x-4' : ''}`}></div>
                          </div>
                       </label>

                       <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                          <span className="text-sm font-medium text-slate-700">Owner Details</span>
                          <div className={`w-10 h-6 rounded-full relative transition-colors ${certConfig.showOwner ? 'bg-blue-600' : 'bg-slate-200'}`} onClick={() => setCertConfig({...certConfig, showOwner: !certConfig.showOwner})}>
                             <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${certConfig.showOwner ? 'translate-x-4' : ''}`}></div>
                          </div>
                       </label>

                       <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all">
                          <span className="text-sm font-medium text-slate-700">Vaccine History</span>
                          <div className={`w-10 h-6 rounded-full relative transition-colors ${certConfig.showVaccines ? 'bg-blue-600' : 'bg-slate-200'}`} onClick={() => setCertConfig({...certConfig, showVaccines: !certConfig.showVaccines})}>
                             <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${certConfig.showVaccines ? 'translate-x-4' : ''}`}></div>
                          </div>
                       </label>
                    </div>
                 </div>

                 <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <button onClick={handleDownload} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                       <Download className="w-4 h-4" /> Download PDF
                    </button>
                 </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 bg-slate-200/50 p-8 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
                 
                 {pdfPreviewUrl ? (
                    <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white animate-in zoom-in-95 duration-300 ring-1 ring-slate-900/5" style={{ height: '85vh', aspectRatio: '1/1.414' }}>
                       <iframe src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title="Certificate Preview" />
                    </div>
                 ) : (
                    <div className="flex flex-col items-center text-slate-400">
                       <Loader2 className="w-10 h-10 animate-spin mb-3" />
                       <p className="font-medium">Generating Preview...</p>
                    </div>
                 )}

                 <button onClick={() => setIsCertModalOpen(false)} className="absolute top-6 right-6 bg-white/80 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-all z-10">
                    <X className="w-6 h-6 text-slate-500" />
                 </button>
              </div>

           </div>
        </div>,
        document.body
      )}
    </div>
  );
};
