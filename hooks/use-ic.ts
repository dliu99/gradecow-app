import { useQuery } from '@tanstack/react-query'
import type { AppType } from '@/api/src'
import { hc } from 'hono/client'
import { Assignment, ExtractedCourse } from '@/api/src/types'
const client = hc<AppType>(process.env.EXPO_PUBLIC_API_URL!)

export function useGrades() {
  return useQuery({
    queryKey: ['ic', 'grades'],
    queryFn: async () => {
      const res = await client.ic['courseGrades'].$get()
      if (res.ok) {
       return await res.json() as ExtractedCourse[]
      } else {
        throw new Error(res.statusText)
      }
    }
  })
}

export function useAllAssignments() {
  return useQuery({
    queryKey: ['ic', 'allAssignments'],
    queryFn: async () => {
      const res = await client.ic.assignments.$get()
      if (res.ok) {
        return await res.json() as Assignment[]
      } else {
        throw new Error(res.statusText)
      }
    }
  })
}