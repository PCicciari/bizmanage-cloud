
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://auefskrrsnenxohdnfmt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZWZza3Jyc25lbnhvaGRuZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTcwMjgsImV4cCI6MjA1NTgzMzAyOH0.1LwTRnDDDB0rexBQUbx9FNU3kjtKcW4Rk4KvNC_N_WI";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key are required!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
