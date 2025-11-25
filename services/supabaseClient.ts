
import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const SUPABASE_URL = 'https://barprscxjqdvwqbvturd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcnByc2N4anFkdndxYnZ0dXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTg0NTgsImV4cCI6MjA3OTM5NDQ1OH0.fAliKWO8d_dvnrNhuy8EComMiM9aUhaJXEL8c5NatNg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
