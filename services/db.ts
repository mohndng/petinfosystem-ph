



import { supabase } from './supabaseClient';
import { Pet, Owner, Vaccination, Incident, StrayReport, User, SystemSettings, AppNotification, Announcement, LocationDetails } from '../types';

// --- MULTI-TENANCY CONTEXT ---

const getCurrentBarangayId = (): string => {
  try {
    const session = localStorage.getItem('staff_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.barangayId) return parsed.barangayId;
    }
    const publicContext = sessionStorage.getItem('public_barangay_id');
    if (publicContext) {
      return publicContext;
    }
  } catch (e) {
    console.error("Could not parse session for barangayId", e);
  }
  return '';
};


// --- HELPERS ---

const uploadPhoto = async (base64Data: string, bucket: string, path: string): Promise<string> => {
  try {
    const barangayId = getCurrentBarangayId();
    if (!barangayId) throw new Error("No barangay context for upload.");

    const res = await fetch(base64Data);
    const blob = await res.blob();
    const fileExt = blob.type.split('/')[1] || 'jpg';
    const filePath = `${barangayId}/${path}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, { upsert: true });

    if (error) throw error;

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicData.publicUrl;
  } catch (error) {
    console.error("Upload failed", error);
    return base64Data;
  }
};

// Generate random alphanumeric code with symbols
const generateCode = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Mappers
const mapToSnakeCase = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = obj[key];
  }
  return newObj;
};

const mapPet = (data: any): Pet => ({
  id: data.id,
  barangayId: data.barangay_id,
  ownerId: data.owner_id,
  name: data.name,
  species: data.species,
  breed: data.breed,
  color: data.color,
  sex: data.sex,
  birthDate: data.birth_date,
  isSpayedNeutered: data.is_spayed_neutered,
  photoUrl: data.photo_url,
  registrationDate: data.registration_date,
  status: data.status
});

const mapOwner = (data: any): Owner => ({
  id: data.id,
  barangayId: data.barangay_id,
  fullName: data.full_name,
  contactNumber: data.contact_number,
  address: data.address,
  email: data.email
});

const mapVaccination = (data: any): Vaccination => ({
  id: data.id,
  barangayId: data.barangay_id,
  petId: data.pet_id,
  vaccineName: data.vaccine_name,
  vaccineType: data.vaccine_type,
  manufacturer: data.manufacturer,
  lotNumber: data.lot_number,
  dateGiven: data.date_given,
  expirationDate: data.expiration_date,
  nextDueDate: data.next_due_date,
  veterinarian: data.veterinarian,
  vetLicenseNo: data.vet_license_no,
  clinicName: data.clinic_name,
  weightKg: data.weight_kg,
  temperature: data.temperature,
  notes: data.notes
});

const mapIncident = (data: any): Incident => ({
  id: data.id,
  barangayId: data.barangay_id,
  petId: data.pet_id,
  victimName: data.victim_name,
  victimContact: data.victim_contact,
  date: data.incident_date,
  location: data.location,
  description: data.description,
  bodyPartBitten: data.body_part_bitten,
  isProvoked: data.is_provoked,
  status: data.status,
  observationStartDate: data.observation_start_date
});

const mapStray = (data: any): StrayReport => ({
  id: data.id,
  barangayId: data.barangay_id,
  reporterName: data.reporter_name,
  reporterContact: data.reporter_contact,
  species: data.species,
  location: data.location,
  description: data.description,
  photoUrl: data.photo_url,
  dateReported: data.date_reported,
  status: data.status,
  isEarTipped: data.is_ear_tipped,
  latitude: data.latitude,
  longitude: data.longitude
});

const mapUser = (data: any): User => {
  // Logic to determine the absolute latest activity timestamp
  // We compare the sign_in time vs the sign_out time to show the most recent action
  
  // Safely parse timestamps or default to 0
  const loginTime = data.last_sign_in_at ? new Date(data.last_sign_in_at).getTime() : 0;
  const logoutTime = data.last_sign_out_at ? new Date(data.last_sign_out_at).getTime() : 0;
  
  let latestActivity = undefined;

  // If we have a login time, start with that
  if (loginTime > 0) {
    latestActivity = data.last_sign_in_at;
  }

  // If logout happened AFTER login, show logout time
  if (logoutTime > loginTime) {
    latestActivity = data.last_sign_out_at;
  }

  return {
    id: data.id,
    barangayId: data.barangay_id,
    fullName: data.full_name,
    username: data.username,
    role: data.role,
    status: data.status,
    password: data.password,
    lastActive: latestActivity // Map the calculated latest activity
  };
};

const mapSettings = (data: any): SystemSettings => ({
  id: data.id,
  barangayId: data.barangay_id,
  barangayName: data.barangay_name,
  municipality: data.municipality,
  logoUrl: data.logo_url,
  reminderDays: data.reminder_days,
  supportEmail: data.support_email,
  emergencyHotline: data.emergency_hotline,
  communityCode: data.community_code,
  licenseUsed: data.license_used
});

const mapNotification = (data: any): AppNotification => ({
  id: data.id,
  barangayId: data.barangay_id,
  title: data.title,
  message: data.message,
  type: data.type,
  timestamp: data.created_at,
  isRead: data.is_read
});

const mapAnnouncement = (data: any): Announcement => {
  // Handle joined profile data for author name and role
  // Supabase might return an array or object depending on relationship cardinality
  const profileData = data.profiles 
    ? (Array.isArray(data.profiles) ? data.profiles[0] : data.profiles) 
    : null;

  const profileName = profileData?.full_name;
  const profileRole = profileData?.role;

  return {
    id: data.id,
    barangayId: data.barangay_id,
    authorId: data.author_id,
    // Prioritize joined name, fallback to column if exists, fallback to 'Unknown'
    authorName: profileName || data.author_name || 'Unknown', 
    // Prioritize joined role, fallback to column if exists, fallback to 'Staff'
    role: profileRole || data.role || 'Staff',
    title: data.title,
    content: data.content,
    datePosted: data.date_posted,
    category: data.category,
    photoUrl: data.photo_url,
    linkPreview: data.link_preview,
    likes: data.likes
  };
};


export const db = {
  // --- SETUP & VERIFICATION FLOW ---
  setup: {
    // Step 1: Generate the paired codes based on location
    initiateSession: async (location: LocationDetails) => {
      // 1. Pre-check: Is this location already registered?
      // This prevents proceeding if the barangay already has an admin.
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .ilike('barangay_name', location.barangay)
        .ilike('municipality', location.city)
        .maybeSingle();

      if (existing) {
        throw new Error(`Barangay ${location.barangay} in ${location.city} is already registered. Please login instead.`);
      }

      const publicCode = `PUB-${generateCode(4)}`;
      const secretCode = `SEC-${generateCode(4)}`;

      const { error } = await supabase.from('setup_verifications').insert({
        location_data: location,
        public_code: publicCode,
        secret_code: secretCode,
        is_verified: false
      });

      if (error) throw error;
      
      // For development/demo purposes, we log the secret code so you can use it.
      // In a real scenario, this would be sent to a physical terminal or admin phone.
      console.log("%c [SECURE LOG] SECRET CODE GENERATED: " + secretCode, "background: #222; color: #bada55; font-size: 16px; padding: 4px;");
      
      return { publicCode };
    },

    // Step 2: Verify the 2nd code matches the 1st code
    verifySession: async (publicCode: string, secretCodeInput: string) => {
      const { data, error } = await supabase
        .from('setup_verifications')
        .select('*')
        .eq('public_code', publicCode)
        .eq('secret_code', secretCodeInput) // Strict match
        .single();

      if (error || !data) return false;

      // Mark as verified
      await supabase.from('setup_verifications').update({ is_verified: true }).eq('id', data.id);
      return true;
    },

    // Step 3: Admin "Get Code" Request
    requestAdminAuthToken: async () => {
      const token = `ADM-${generateCode(6)}`;
      const { error } = await supabase.from('admin_auth_tokens').insert({
        token: token,
        is_used: false
      });
      
      if (error) throw error;
      
      // SIMULATION: Log the code for the "Authorized Personnel" to see
      console.log("%c [SECURE LOG] ADMIN AUTH TOKEN: " + token, "background: #red; color: #white; font-size: 16px; padding: 4px;");
      return true;
    },

    // Step 3b: Verify Admin Auth Token
    verifyAdminAuthToken: async (tokenInput: string) => {
      const { data, error } = await supabase
        .from('admin_auth_tokens')
        .select('*')
        .eq('token', tokenInput)
        .eq('is_used', false)
        .single();
        
      if (error || !data) return false;
      
      // Mark as used
      await supabase.from('admin_auth_tokens').update({ is_used: true }).eq('id', data.id);
      return true;
    },
    
    // Step 4: Create the Admin User and Settings
    finalizeSetup: async (adminName: string, adminUsername: string, adminPassword: string, location: LocationDetails) => {
       // Double check for race conditions
       const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .ilike('barangay_name', location.barangay)
        .ilike('municipality', location.city)
        .maybeSingle();

       if (existing) {
         throw new Error(`Barangay ${location.barangay} is already registered.`);
       }

       const barangayId = crypto.randomUUID();
       const userId = crypto.randomUUID();

       // 1. Create Settings
       const { error: settingsError } = await supabase.from('system_settings').insert({
          barangay_id: barangayId,
          barangay_name: location.barangay,
          municipality: location.city,
          community_code: generateCode(8),
          reminder_days: 30,
          support_email: 'admin@petinfosys.ph',
          emergency_hotline: '911'
       });

       if (settingsError) {
         // Fallback if the race condition hits the SQL constraint
         if (settingsError.code === '23505') { // Unique violation
            throw new Error(`Barangay ${location.barangay} is already registered.`);
         }
         throw settingsError;
       }

       // 2. Create Profile (Custom Auth)
       const { error: profileError } = await supabase.from('profiles').insert({
         id: userId,
         barangay_id: barangayId,
         full_name: adminName,
         username: adminUsername,
         role: 'Admin',
         status: 'Active',
         password: adminPassword // Stored as is for this custom flow
       });

       if (profileError) throw profileError;
       return { success: true };
    }
  },

  // --- PETS ---
  pets: {
    getAll: async (): Promise<Pet[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      const { data, error } = await supabase.from('pets').select('*').eq('barangay_id', barangayId);
      if (error) { console.error(error); return []; }
      return data.map((p: any) => ({ ...mapPet(p) }));
    },
    add: async (item: Omit<Pet, 'barangayId'>) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      
      let photoUrl = item.photoUrl;
      if (item.photoUrl.startsWith('data:')) {
        photoUrl = await uploadPhoto(item.photoUrl, 'pet-photos', `pets/${item.id}`);
      }

      const { error } = await supabase.from('pets').insert({
        ...mapToSnakeCase(item),
        barangay_id: barangayId,
        photo_url: photoUrl
      });
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    get: async (id: string): Promise<Pet | undefined> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return undefined;
      const { data, error } = await supabase.from('pets').select('*').eq('id', id).eq('barangay_id', barangayId).single();
      if (error || !data) return undefined;
      return mapPet(data);
    },
    delete: async (id: string) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      
      await supabase.from('vaccinations').delete().eq('pet_id', id).eq('barangay_id', barangayId);
      await supabase.from('incidents').update({ pet_id: null }).eq('pet_id', id).eq('barangay_id', barangayId);

      const { error } = await supabase.from('pets').delete().eq('id', id).eq('barangay_id', barangayId);
      
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
  },

  // --- OWNERS ---
  owners: {
    getAll: async (): Promise<Owner[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      const { data, error } = await supabase.from('owners').select('*').eq('barangay_id', barangayId);
      if (error) { console.error(error); return []; }
      return data.map((o: any) => ({ ...mapOwner(o) }));
    },
    add: async (item: Omit<Owner, 'barangayId'>) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      const { error } = await supabase.from('owners').insert({
        ...mapToSnakeCase(item),
        barangay_id: barangayId,
      });
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    get: async (id: string): Promise<Owner | undefined> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return undefined;
      const { data, error } = await supabase.from('owners').select('*').eq('id', id).eq('barangay_id', barangayId).single();
      if (error || !data) return undefined;
      return mapOwner(data);
    },
  },

  // --- VACCINATIONS ---
  vaccinations: {
    getAll: async (): Promise<Vaccination[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      const { data, error } = await supabase.from('vaccinations').select('*').eq('barangay_id', barangayId);
      if (error) return [];
      return data.map((v: any) => mapVaccination(v));
    },
    add: async (item: Omit<Vaccination, 'barangayId'>) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      const { error } = await supabase.from('vaccinations').insert({
        ...mapToSnakeCase(item),
        barangay_id: barangayId,
      });
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    getByPetId: async (petId: string): Promise<Vaccination[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      const { data, error } = await supabase.from('vaccinations').select('*').eq('pet_id', petId).eq('barangay_id', barangayId);
      if (error) return [];
      return data.map((v: any) => mapVaccination(v));
    },
  },

  // --- INCIDENTS ---
  incidents: {
    getAll: async (): Promise<Incident[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      const { data, error } = await supabase.from('incidents').select('*').eq('barangay_id', barangayId);
      if (error) return [];
      return data.map((i: any) => mapIncident(i));
    },
    add: async (item: Omit<Incident, 'barangayId'>) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      const { error } = await supabase.from('incidents').insert({
        id: item.id,
        barangay_id: barangayId,
        pet_id: item.petId,
        victim_name: item.victimName,
        victim_contact: item.victimContact,
        incident_date: item.date, 
        location: item.location,
        description: item.description,
        body_part_bitten: item.bodyPartBitten,
        is_provoked: item.isProvoked,
        status: item.status,
        observation_start_date: item.observationStartDate
      });
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    update: async (item: Incident) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      const { error } = await supabase.from('incidents').update({
        status: item.status
      }).eq('id', item.id).eq('barangay_id', barangayId);
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    }
  },

  // --- STRAYS ---
  strays: {
    getAll: async (): Promise<StrayReport[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      const { data, error } = await supabase.from('stray_reports').select('*').eq('barangay_id', barangayId);
      if (error) return [];
      return data.map((s: any) => mapStray(s));
    },
    add: async (item: Omit<StrayReport, 'barangayId'>) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      let photoUrl = item.photoUrl;
      if (item.photoUrl && item.photoUrl.startsWith('data:')) {
        photoUrl = await uploadPhoto(item.photoUrl, 'stray-photos', `strays/${item.id}`);
      }
      const { error } = await supabase.from('stray_reports').insert({
        ...mapToSnakeCase(item),
        reporter_name: item.reporterName,
        reporter_contact: item.reporterContact, // Added
        barangay_id: barangayId,
        photo_url: photoUrl,
        latitude: item.latitude, // Added
        longitude: item.longitude // Added
      });
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    update: async (id: string, newStatus: StrayReport['status']) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      const { error } = await supabase
        .from('stray_reports')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('barangay_id', barangayId);
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
  },

  // --- USERS (PROFILES + AUTH) ---
  users: {
    getAll: async (): Promise<User[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      const { data, error } = await supabase.from('profiles').select('*').eq('barangay_id', barangayId);
      if (error) return [];
      return data.map((u: any) => mapUser(u));
    },
    add: async (item: User) => {
       if (!item.barangayId) throw new Error("Cannot create a user without a barangayId.");
       const { error } = await supabase.from('profiles').insert({
        id: item.id, 
        barangay_id: item.barangayId,
        username: item.username,
        full_name: item.fullName,
        role: item.role,
        status: item.status,
        password: item.password 
      });
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    update: async (item: User) => {
      const { error } = await supabase.from('profiles').update({
        full_name: item.fullName,
        role: item.role,
        status: item.status,
        password: item.password
      }).eq('id', item.id).eq('barangay_id', item.barangayId);
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    delete: async (id: string) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      const { error } = await supabase.from('profiles').delete().eq('id', id).eq('barangay_id', barangayId);
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    getById: async (id: string): Promise<User | undefined> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (error || !data) return undefined;
      return mapUser(data);
    },
    login: async (identifier: string, password: string): Promise<User | undefined> => {
      try {
        const cleanIdentifier = identifier.trim();
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', cleanIdentifier);

        if (error) throw error;

        if (data && data.length > 0) {
          const matchedUser = data.find(u => u.password === password);
          if (matchedUser) {
            return mapUser(matchedUser);
          }
        }
      } catch (e) {
        console.error("DB Login check failed", e);
      }
      return undefined;
    },
    // LOG SESSION START (Updates last_sign_in_at)
    logSessionStart: async (id: string) => {
      try {
        const { error } = await supabase.from('profiles').update({ last_sign_in_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      } catch(e) {
        console.error("Failed to update sign-in timestamp", e);
        // Note: If RLS is enabled on profiles, this update might fail for unauthenticated clients.
        // Ensure policies allow update or use a service key if needed (not recommended on client).
      }
    },
    // LOG SESSION END (Updates last_sign_out_at)
    logSessionEnd: async (id: string) => {
      try {
        const { error } = await supabase.from('profiles').update({ last_sign_out_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      } catch(e) {
        console.error("Failed to update sign-out timestamp", e);
      }
    }
  },

  // --- SETTINGS ---
  settings: {
    getByBarangayId: async (barangayId: string): Promise<SystemSettings> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('barangay_id', barangayId)
        .limit(1)
        .single();
      
      if (error || !data) {
        return {
          barangayId: '', barangayName: '', municipality: '', logoUrl: '', reminderDays: 30,
          supportEmail: '', emergencyHotline: '', communityCode: 'SETUP-REQUIRED'
        };
      }
      return mapSettings(data);
    },
    getByCommunityCode: async (code: string): Promise<SystemSettings | null> => {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('community_code', code)
          .limit(1)
          .single();

        if (error || !data) return null;
        return mapSettings(data);
    },
    update: async (settings: SystemSettings) => {
      const { error } = await supabase
        .from('system_settings')
        .update(mapToSnakeCase(settings))
        .eq('barangay_id', settings.barangayId);
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
  },

  // --- NOTIFICATIONS ---
  notifications: {
    getAll: async (): Promise<AppNotification[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('barangay_id', barangayId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      return data.map((n: any) => mapNotification(n));
    },
    add: async (item: Omit<AppNotification, 'id' | 'timestamp' | 'isRead' | 'barangayId'>) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return; // Silent fail if no context
      const { error } = await supabase.from('notifications').insert({
        barangay_id: barangayId,
        title: item.title,
        message: item.message,
        type: item.type,
        is_read: false
      });
      if (error) console.error("Notif failed", error);
      window.dispatchEvent(new Event('notificationUpdated'));
    },
    markAsRead: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) console.error(error);
      window.dispatchEvent(new Event('notificationUpdated'));
    },
    markAllAsRead: async () => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('barangay_id', barangayId);
      if (error) console.error(error);
      window.dispatchEvent(new Event('notificationUpdated'));
    }
  },

  // --- ANNOUNCEMENTS ---
  announcements: {
    getAll: async (): Promise<Announcement[]> => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) return [];
      
      // Attempt to join with profiles to get author name and role
      let { data, error } = await supabase
        .from('announcements')
        .select('*, profiles(full_name, role)') // Fetches role from profile relation
        .eq('barangay_id', barangayId)
        .order('date_posted', { ascending: false });

      // Fallback if join fails (e.g. FK missing)
      if (error) {
         console.warn("Announcement fetch fallback: ", error.message);
         const res = await supabase
          .from('announcements')
          .select('*')
          .eq('barangay_id', barangayId)
          .order('date_posted', { ascending: false });
         data = res.data;
         error = res.error;
      }
      
      if (error) return [];
      return (data || []).map((a: any) => mapAnnouncement(a));
    },
    add: async (item: Omit<Announcement, 'barangayId'>) => {
      const barangayId = getCurrentBarangayId();
      if (!barangayId) throw new Error("User context is not set.");
      
      // We do NOT send author_name or role here to prevent schema errors if the columns are missing.
      // We rely on author_id relationship with profiles.
      const { error } = await supabase.from('announcements').insert({
        id: item.id,
        barangay_id: barangayId,
        author_id: item.authorId,
        // author_name: item.authorName, // Removed to fix PGRST204
        // role: item.role, // Removed to fix PGRST204
        title: item.title,
        content: item.content,
        date_posted: item.datePosted,
        category: item.category,
        photo_url: item.photoUrl,
        link_preview: item.linkPreview,
        likes: item.likes
      });
      if (error) throw error;
      window.dispatchEvent(new Event('dbUpdated'));
    },
    delete: async (id: string) => {
       const barangayId = getCurrentBarangayId();
       if (!barangayId) throw new Error("User context is not set.");
       const { error } = await supabase.from('announcements').delete().eq('id', id).eq('barangay_id', barangayId);
       if (error) throw error;
       window.dispatchEvent(new Event('dbUpdated'));
    }
  }
};