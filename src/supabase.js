import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcWFkcm52bmtsZGticGRrYm9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI4NjM3OSwiZXhwIjoyMDg4ODYyMzc5fQ.ztEJje7tyaJS6E_H1_UIFKziQcSl4f6jHfjQA4DYHhI"

export const supabase = createClient(supabaseUrl, supabaseKey)
