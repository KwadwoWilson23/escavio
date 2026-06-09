import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import env from './env.js'

export const supabase = createClient(
  env.supabaseUrl || 'http://localhost:54321',
  env.supabaseServiceKey || env.supabaseAnonKey || 'placeholder',
  {
    realtime: { transport: ws },
  }
)
