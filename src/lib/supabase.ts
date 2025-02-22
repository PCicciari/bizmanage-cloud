
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://your-project-url.supabase.co";
const supabaseAnonKey = "your-anon-key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key are required!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
