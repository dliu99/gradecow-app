import { useQuery } from '@tanstack/react-query'
import type { AppType } from '@/api/src'
import { hc } from 'hono/client'
import { Assignment, AssignmentDetail, ExtractedCourse, userAccount, UserProfile } from '@/api/src/types'
import { getAuthSession } from '@/utils/storage'

function getClient() {
  const session = getAuthSession()
  return hc<AppType>(process.env.EXPO_PUBLIC_API_URL!, {
    headers: {
      Authorization: session?.sessionToken ?? '',
    },
  })
}

function createApiError(statusText: string, status: number): Error & { status: number } {
  const error = new Error(statusText) as Error & { status: number }
  error.status = status
  return error
}

export function useUser() {
  return useQuery({
    queryKey: ['ic', 'user'],
    queryFn: async () => {
      const client = getClient()
      const res = await client.ic.user.$get()
      if (res.ok) {
        const data = (await res.json()) as unknown as userAccount
        console.log('[useUser] Response:', data)
        return data
      } else {
        throw createApiError(res.statusText, res.status)
      }
    },
  })
}

export function useGrades() {
  return useQuery({
    queryKey: ['ic', 'grades'],
    queryFn: async () => {
      const client = getClient()
      const res = await client.ic.courseGrades.$get()
      if (res.ok) {
        return (await res.json()) as ExtractedCourse[]
      } else {
        throw createApiError(res.statusText, res.status)
      }
    },
  })
}

export function useAllAssignments() {
  return useQuery({
    queryKey: ['ic', 'allAssignments'],
    queryFn: async () => {
      const client = getClient()
      const res = await client.ic.assignments.$get()
      if (res.ok) {
        return await res.json() as Assignment[]
      } else {
        throw createApiError(res.statusText, res.status)
      }
    },
  })
}

export function useAssignment(objectSectionID: number) {
  return useQuery({
    queryKey: ['ic', 'assignment', objectSectionID],
    queryFn: async () => {
      const client = getClient()
      const res = await client.ic.assignments[':objectSectionID'].$get({
        param: { objectSectionID: objectSectionID.toString() },
      })
      if (res.ok) {
        return await res.json() as AssignmentDetail
      } else {
        throw createApiError(res.statusText, res.status)
      }
    },
    enabled: !!objectSectionID,
  })
}

export function useProfile() {
  return useQuery({
    queryKey: ['ic', 'profile'],
    queryFn: async () => {
      const client = getClient()
      const res = await client.ic.user.profile.$get()
      if (res.ok) {
        return await res.json() as UserProfile
      } else {
        throw createApiError(res.statusText, res.status)
      }
    },
  })
}
