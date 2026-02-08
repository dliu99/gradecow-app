import { createMMKV } from 'react-native-mmkv'

export const storage = createMMKV({
  id: 'gradecow-storage',
})

export function storeAuthSession(uuid: string, sessionToken: string): void {
  console.log('storing auth session to mmkv', uuid);
  storage.set('uuid', uuid)
  storage.set('sessionToken', sessionToken)
}

export function getAuthSession(): { uuid: string; sessionToken: string } | null {
  const uuid = storage.getString('uuid')
  const sessionToken = storage.getString('sessionToken')
  
  if (!uuid || !sessionToken) {
    return null
  }
  
  return { uuid, sessionToken }
}

export function clearAuth(): void {
  storage.remove('uuid')
  storage.remove('sessionToken')
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

export async function verifyAndRefreshAuth(): Promise<boolean> {
    console.log('verifying and refreshing auth', API_BASE_URL);
    const session = getAuthSession()
    if (!session) {
      return false
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            sessionToken: session.sessionToken,
        }),
  })

    if (!response.ok) {
        clearAuth()
        console.log('verify response', response)
        return false
    }

    const data = await response.json() as {
    ok: boolean
    uuid: string
    sessionToken: string
    }

    if (!data.ok) {
    clearAuth()
    return false
    }

    storeAuthSession(data.uuid, data.sessionToken)
    return true
    } catch {
    clearAuth()
    return false
    }
    }
