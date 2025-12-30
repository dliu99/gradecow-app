import { createMMKV } from 'react-native-mmkv'

export const storage = createMMKV({
  id: 'gradecow-storage',
})

export function storeAuthSession(personId: number, sessionToken: string): void {
  console.log('storing auth session to mmkv', personId);
  storage.set('personId', personId)
  storage.set('sessionToken', sessionToken)
}

export function getAuthSession(): { personId: number; sessionToken: string } | null {
  const personId = storage.getNumber('personId')
  const sessionToken = storage.getString('sessionToken')
  
  if (!personId || !sessionToken) {
    return null
  }
  
  return { personId, sessionToken }
}

export function clearAuth(): void {
  storage.remove('personId')
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
    personId: number
    sessionToken: string
    }

    if (!data.ok) {
    clearAuth()
    return false
    }

    storeAuthSession(data.personId, data.sessionToken)
    return true
    } catch {
    clearAuth()
    return false
    }
    }
