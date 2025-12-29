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

export function setDistrictUrl(url: string): void {
  storage.set('districtUrl', url)
}

export function getDistrictUrl(): string | undefined {
  return storage.getString('districtUrl')
}

export function removeDistrictUrl(): void {
  storage.remove('districtUrl')
}

export function setAuthenticated(value: boolean): void {
  storage.set('isAuthenticated', value)
}

export function isAuthenticated(): boolean {
  return storage.getBoolean('isAuthenticated') ?? false
}

export function clearAuth(): void {
  removePersonId()
  removeDistrictUrl()
  setAuthenticated(false)
}

export function storeAuthSession(personId: number, districtUrl: string): void {
  setPersonId(personId)
  setDistrictUrl(districtUrl)
  setAuthenticated(true)
}

export function getAuthSession(): { personId: number; districtUrl: string } | null {
  const personId = getPersonId()
  const districtUrl = getDistrictUrl()
  
  if (!personId || !districtUrl) {
    return null
  }
  
  return { personId, districtUrl }
}
