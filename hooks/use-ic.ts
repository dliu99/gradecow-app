import { useQuery } from '@tanstack/react-query'
import type { AppType } from '@/api/src'
import { hc } from 'hono/client'
import { Assignment, AssignmentDetail, CourseGradeDetailResponse, ExtractedCourse, userAccount, UserProfile } from '@/api/src/types'
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
  const { data: grades } = useGrades()
  const enrollmentID = grades?.[0]?.enrollmentID

  return useQuery({
    queryKey: ['ic', 'profile', enrollmentID],
    queryFn: async () => {
      const client = getClient()
      const res = await client.ic.user.profile.$get()
      if (!res.ok) throw createApiError(res.statusText, res.status)
      
      const profile = await res.json() as UserProfile

      if (enrollmentID) {
        const attendanceRes = await client.ic.attendance[':enrollmentID'].$get({
          param: { enrollmentID: enrollmentID.toString() },
        })
        if (attendanceRes.ok) {
          const attendance = await attendanceRes.json() as { absences: number, tardies: number }
          return { ...profile, ...attendance }
        }
      }
      return { ...profile, absences: null, tardies: null }
    },
  })
}

export function useAllGrades() {
  return useQuery({
    queryKey: ['ic', 'courseGrades'],
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

export function useAllGradesWithDetails() {
  return useQuery({
    queryKey: ['ic', 'allGradesWithDetails'],
    queryFn: async () => {
      const client = getClient()
      const coursesRes = await client.ic.courseGrades.$get()
      if (!coursesRes.ok) throw createApiError(coursesRes.statusText, coursesRes.status)
      
      const courses = await coursesRes.json() as ExtractedCourse[]
      
      const detailsPromises = courses.map(async (course) => {
        const detailRes = await client.ic.courseGrades[':sectionID'].$get({
          param: { sectionID: course.sectionID.toString() },
        })
        if (!detailRes.ok) return null
        return await detailRes.json() as CourseGradeDetailResponse
      })
      
      const details = await Promise.all(detailsPromises)
      const detailsMap = new Map(
        details.filter(Boolean).map(d => [d!.task.sectionID, d!])
      )
      
      return { courses, detailsMap }
    },
  })
}

export function useCourseGrade(sectionID: number) {
  return useQuery({
    queryKey: ['ic', 'courseGrade', sectionID],
    queryFn: async () => {
      const client = getClient()
      const res = await client.ic.courseGrades[':sectionID'].$get({
        param: { sectionID: sectionID.toString() },
      })
      if (res.ok) {
        return await res.json() as CourseGradeDetailResponse
      } else {
        throw createApiError(res.statusText, res.status)
      }
    },
    enabled: !!sectionID,
  })
}
