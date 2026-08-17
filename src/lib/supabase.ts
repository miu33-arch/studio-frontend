import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uxjqlhmallfydxaaunpr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4anFsaG1hbGxmeWR4YWF1bnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODUxNTQsImV4cCI6MjEwMTk2MTE1NH0.pkl4hkP2Xx6xYPRwJ4E0aeuR-pImq2PlpE-xG_yXdLg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);