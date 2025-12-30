import { createMMKV } from 'react-native-mmkv'

export const storage = createMMKV({
  id: 'gradecow-storage',
})

export function setPersonId(personId: number): void {
  storage.set('personId', personId)
}

export function getPersonId(): number | undefined {
  return storage.getNumber('personId')
}

export function removePersonId(): void {
  storage.remove('personId')
}

export function setSessionToken(token: string): void {
  storage.set('sessionToken', token)
}

export function getSessionToken(): string | undefined {
  return storage.getString('sessionToken')
}

export function removeSessionToken(): void {
  storage.remove('sessionToken')
}

export function setAuthenticated(value: boolean): void {
  storage.set('isAuthenticated', value)
}

export function isAuthenticated(): boolean {
  return storage.getBoolean('isAuthenticated') ?? false
}

export function clearAuth(): void {
  removePersonId()
  removeSessionToken()
  setAuthenticated(false)
}

export function storeAuthSession(personId: number, sessionToken: string): void {
  setPersonId(personId)
  setSessionToken(sessionToken)
  setAuthenticated(true)
}

export function getAuthSession(): { personId: number; sessionToken: string } | null {
  const personId = getPersonId()
  const sessionToken = getSessionToken()
  
  if (!personId || !sessionToken) {
    return null
  }
  
  return { personId, sessionToken }
}
