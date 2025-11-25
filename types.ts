
export interface Owner {
  id: string;
  barangayId: string;
  fullName: string;
  contactNumber: string;
  address: string; // Purok/Sitio
  email?: string;
}

export interface Vaccination {
  id: string;
  barangayId: string;
  petId: string;
  // Medical Info
  vaccineName: string; // e.g., "Nobivac Rabies", "Vanguard 5-in-1"
  // Refined Types for clearer records
  vaccineType: 'Core - Anti-Rabies' | 'Core - Multi (5-in-1)' | 'Core - Multi (6-in-1)' | 'Non-Core (Optional)' | 'Deworming' | 'External Parasite'; 
  manufacturer?: string; // e.g., Zoetis, Boehringer Ingelheim
  lotNumber: string; // CRITICAL for legality
  
  // Dates
  dateGiven: string;
  expirationDate: string; // Of the medicine BOTTLE (Batch Expiry)
  nextDueDate: string; // When the IMMUNITY expires

  // Vitals at time of injection (Standard Vet Practice)
  weightKg?: number;
  temperature?: number; // Celsius

  // Administrator Info (RA 9482 Compliance)
  veterinarian: string;
  vetLicenseNo: string; // PRC License Number
  clinicName: string; // Or "Barangay Health Center"
  
  notes?: string;
}

export interface Pet {
  id: string;
  barangayId: string;
  ownerId: string;
  name: string;
  species: 'Dog' | 'Cat';
  breed: string;
  color: string;
  sex: 'Male' | 'Female';
  birthDate?: string;
  isSpayedNeutered: boolean;
  photoUrl: string;
  registrationDate: string;
  status: 'Alive' | 'Deceased' | 'Lost' | 'Transferred';
}

export interface Incident {
  id: string;
  barangayId: string;
  petId?: string; // Can be null if stray
  victimName: string;
  victimContact: string;
  date: string;
  location: string;
  description: string;
  bodyPartBitten: string;
  isProvoked: boolean;
  status: 'Observation' | 'Cleared' | 'Deceased' | 'Escaped';
  observationStartDate: string;
}

export interface StrayReport {
  id: string;
  barangayId: string;
  reporterName: string; // New field for public reporter
  reporterContact?: string; // New field for verification
  species: 'Dog' | 'Cat';
  location: string;
  description: string;
  photoUrl?: string;
  dateReported: string;
  status: 'Pending' | 'Reported' | 'Captured' | 'Resolved' | 'Rejected'; // Added Pending and Rejected for approval workflow
  isEarTipped: boolean;
  latitude?: number; // For GPS Verification
  longitude?: number;
}

export interface User {
  id: string;
  barangayId: string;
  fullName: string;
  username: string;
  role: 'Admin' | 'Staff' | 'Guest'; // Added Guest for public context
  password?: string; // In a real app, this would be hashed
  status: 'Active' | 'Inactive';
  email?: string;
  lastActive?: string;
}

export interface SystemSettings {
  id?: string;
  barangayId: string;
  barangayName: string;
  municipality: string;
  logoUrl: string;
  reminderDays: number;
  supportEmail: string;
  emergencyHotline: string;
  communityCode: string; // New field for access control
  licenseUsed?: string;
}

export interface AppNotification {
  id: string;
  barangayId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'system';
  timestamp: string;
  isRead: boolean;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  domain: string;
}

export interface Announcement {
  id: string;
  barangayId: string;
  authorId: string; // User ID
  authorName: string;
  role: 'Admin' | 'Staff';
  title: string;
  content: string;
  datePosted: string;
  category: 'Event' | 'News' | 'Advisory' | 'Health';
  photoUrl?: string;
  linkPreview?: LinkPreview;
  likes: number;
}

export interface LocationDetails {
  region: string;
  province: string;
  city: string;
  barangay: string;
}