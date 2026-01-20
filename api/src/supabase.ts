import { createClient } from '@supabase/supabase-js'
import * as Iron from 'iron-webcrypto'
import { env } from 'cloudflare:workers'

const ironKey = (env as Env).IRON_KEY as string
const supabaseUrl = (env as Env).EXPO_PUBLIC_SUPABASE_URL || 'https://otgnosivxwcrosclmyxv.supabase.co'
const supabaseServiceKey = (env as Env).SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not set')
}



export const supabase = createClient(supabaseUrl, supabaseServiceKey as string, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
})

export async function sealSessionData(data: object): Promise<string> {
  
  return await Iron.seal(data, ironKey, Iron.defaults)
}

export async function unsealSessionData<T = object>(sealed: string): Promise<T> {

  return await Iron.unseal(sealed, ironKey, Iron.defaults) as T
}

export async function createICSession(personId: number, sessionToken: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('ic_sessions')
    .upsert({
      person_id: personId,
      session_token: sessionToken,
    })
    .select('person_id')
    .single()
  
  if (error) {
    console.error('Error creating IC session:', error)
    return null
  }
  
  return data?.person_id || null
}
