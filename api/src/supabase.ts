import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as Iron from 'iron-webcrypto'
import { env } from 'cloudflare:workers'

function getEnv(): Env {
  return env as Env
}

function getSupabase(): SupabaseClient {
  const e = getEnv()
  const supabaseUrl = e.EXPO_PUBLIC_SUPABASE_URL || 'https://otgnosivxwcrosclmyxv.supabase.co'
  const supabaseServiceKey = e.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
  })
}

export async function sealSessionData(data: object): Promise<string> {
  const ironKey = getEnv().IRON_KEY
  return await Iron.seal(data, ironKey, Iron.defaults)
}

export async function unsealSessionData<T = object>(sealed: string): Promise<T> {
  const ironKey = getEnv().IRON_KEY
  return await Iron.unseal(sealed, ironKey, Iron.defaults) as T
}

export async function createICSession(userID: number, personId: number, sessionToken: string): Promise<string | null> {
  const supabase = getSupabase()
  const uuid = `${userID}.${personId}`
  
  const { data, error } = await supabase
    .from('ic_sessions')
    .upsert({
      uuid: uuid,
      user_id: userID,
      person_id: personId,
      session_token: sessionToken,
    })
    .select('uuid')
    .single()
  
  if (error) {
    console.error('Error creating IC session:', error)
    return null
  }
  
  return data?.uuid || null
}
