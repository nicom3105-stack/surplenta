import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zkqadrnvnkldkbpdkboh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcWFkcm52bmtsZGticGRrYm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODYzNzksImV4cCI6MjA4ODg2MjM3OX0.0jnwqfKJbVEZLdo5vGWvdcdkbld-ysm5C-LzzXCnIgg'

export const supabase = createClient(supabaseUrl, supabaseKey)
