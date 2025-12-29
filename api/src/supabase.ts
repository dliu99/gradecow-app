import { createClient } from '@supabase/supabase-js'
import * as Iron from 'iron-webcrypto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://otgnosivxwcrosclmyxv.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not set')
}

const ironKey = process.env.IRON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseServiceKey || '', {
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

export async function createICSession(params: {
  personId: number
  districtUrl: string
  deviceType: string
  deviceModel: string
  systemVersion: string
  deviceId: string
  sessionToken: string
}): Promise<number | null> {
  const { data, error } = await supabase
    .from('ic_sessions')
    .insert({
      person_id: params.personId,
      district_url: params.districtUrl,
      device_type: params.deviceType,
      device_model: params.deviceModel,
      system_version: params.systemVersion,
      device_id: params.deviceId,
      session_token: params.sessionToken,
    })
    .select('person_id')
    .single()
  
  if (error) {
    console.error('Error creating IC session:', error)
    return null
  }
  
  return data?.person_id || null
}

export async function getICSession(personId: number): Promise<{
  person_id: number
  district_url: string
  device_type: string
  device_model: string
  system_version: string
  device_id: string
  session_token: string
} | null> {
  const { data, error } = await supabase
    .from('ic_sessions')
    .select('*')
    .eq('person_id', personId)
    .single()
  
  if (error) {
    console.error('Error getting IC session:', error)
    return null
  }
  
  return data
}

export async function updateICSessionToken(personId: number, sessionToken: string): Promise<boolean> {
  const { error } = await supabase
    .from('ic_sessions')
    .update({ session_token: sessionToken, updated_at: new Date().toISOString() })
    .eq('person_id', personId)
  
  if (error) {
    console.error('Error updating IC session token:', error)
    return false
  }
  
  return true
}
