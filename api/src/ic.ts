import { Hono } from "hono"
import { ContentfulStatusCode } from "hono/utils/http-status"
import * as Iron from 'iron-webcrypto'
import { Session, Variables, Enrollment, ExtractedCourse, Assignment, AssignmentDetail, userAccount, UserProfile, CourseGradeTerm, CourseGradeAPIResponse, CourseGradeDetailResponse, CourseGradeCategory, CourseGradeAssignment, CategoryProgress, CourseGradeTask } from './types'
const ironKey = process.env.IRON_KEY as string

const getActiveTermIDs = (terms: CourseGradeTerm[], now: Date = new Date()): number[] => {
  const sorted = [...terms].sort((a, b) => a.termSeq - b.termSeq)
  const nowStr = now.toISOString().split('T')[0]

  const t1 = sorted.find(t => t.termSeq === 1)
  const t2 = sorted.find(t => t.termSeq === 2)
  const t3 = sorted.find(t => t.termSeq === 3)
  const t4 = sorted.find(t => t.termSeq === 4)

  const inSemester2 = t3 && nowStr >= t3.startDate
  
  if (inSemester2 && t3 && t4) {
    return [t3.termID, t4.termID]
  }
  if (t1 && t2) {
    return [t1.termID, t2.termID]
  }
  return sorted.map(t => t.termID)
}



const extractCourseGrades = (enrollments: Enrollment[]): ExtractedCourse[] => {
  return enrollments.flatMap(enrollment => {
    const sortedTerms = [...(enrollment.terms || [])].sort((a, b) => b.termSeq - a.termSeq)
    const processedCourses = new Set<number>()
    const results: ExtractedCourse[] = []

    for (const term of sortedTerms) {
      for (const course of term.courses || []) {
        if (processedCourses.has(course.sectionID) || course.dropped) continue

        const hasGradeData = course.gradingTasks?.some((t) =>
          t.progressScore && t.progressPercent && t.hasAssignments && t.hasDetail
        )
        if (!hasGradeData) continue

        const semesterTask = course.gradingTasks.find((t) =>
          t.taskName === 'Semester Grade' && (t.hasAssignments && t.hasDetail)
        )
        const progressTask = course.gradingTasks.find((t) =>
          t.taskName === 'Progress Grade' && (t.score || t.percent)
        )
        const task = semesterTask || progressTask || course.gradingTasks[0]

        results.push({
          courseName: course.courseName,
          sectionID: course.sectionID,
          enrollmentID: enrollment.enrollmentID,
          score: task?.progressScore || task?.score,
          percent: task?.progressPercent || task?.percent,
          termName: term.termName,
          taskName: task?.taskName || 'Unknown'
        })

        processedCourses.add(course.sectionID)
      }
    }

    return results
  })
}

const ic = new Hono<{ Variables: Variables }>()
  .use(async (c, next) => {
      const sessionToken = c.req.header('Authorization')
      if (!sessionToken) {
          return c.json({ ok: false, message: 'Unauthorized, no session' }, 401)
      }
      try {
          const session = await Iron.unseal(sessionToken, ironKey, Iron.defaults)
          c.set('session', session as Session)
      } catch (error) {
          return c.json({ ok: false, message: 'Invalid session token' }, 401)
      }
      await next()
  })
  .get('/user', async (c) => {
    const session = c.get('session')
    const baseUrl = session.baseURL
    const response = await fetch(`https://${baseUrl}/resources/my/userAccount`, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'User-Agent': 'StudentApp/1.11.4 Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Cookie': session.cookie
      }
    })
    const data = await response.json() as userAccount
    return c.json(data)
  })
  .get('/user/profile', async (c) => {
    const session = c.get('session')
    const baseUrl = session.baseURL

    type GpaEntry = { type: string; gpa: string; unweighted: boolean }

    const gpaRes = await fetch(`https://${baseUrl}/api/campus/grading/gpas/my/gpa`, {
      headers: { Cookie: session.cookie }
    })

    let gpa: UserProfile['gpa'] = null
    if (gpaRes.ok) {
      const gpaData = await gpaRes.json() as GpaEntry[]
      const cumulative = gpaData.filter(g => g.type === 'Cumulative')
      const uw = cumulative.find(g => g.unweighted)?.gpa ?? null
      const w = cumulative.find(g => !g.unweighted)?.gpa ?? null
      if (uw || w) gpa = { uw, w }
    }

    return c.json({ gpa, absences: null, tardies: null } satisfies UserProfile)
  })
  .get('/courseGrades', async (c) => {
      const session = c.get('session')
      const baseUrl = session.baseURL
      const response = await fetch(`https://${baseUrl}/resources/portal/grades`, {
          headers: { Cookie: session.cookie }
      })

      if (response.status !== 200) {
          return c.json('IC error: '+response.statusText, response.status as ContentfulStatusCode)
      }

      const data = await response.json() as Enrollment[]
      const grades = extractCourseGrades(data)
      return c.json(grades)
  })
  .get('/courseGrades/:sectionID', async (c) => {
    const session = c.get('session')
    const sectionID = c.req.param('sectionID')
    const response = await fetch(`https://${session.baseURL}/resources/portal/grades/detail/${sectionID}`, {
      headers: { Cookie: session.cookie }
    })

    if (response.status !== 200) {
      return c.json({ ok: false, message: response.statusText }, response.status as ContentfulStatusCode)
    }

    const data = await response.json() as CourseGradeAPIResponse
    const activeTermIDs = getActiveTermIDs(data.terms)

    const detail = data.details.find(d =>
      d.task.taskName === 'Semester Grade' &&
      activeTermIDs.includes(d.task.termID) &&
      d.categories.length > 0
    ) || data.details.find(d => d.categories.length > 0)

    if (!detail) {
      return c.json({ ok: false, message: 'No grade detail found' }, 404)
    }

    const task: CourseGradeTask = {
      taskID: detail.task.taskID,
      taskName: detail.task.taskName,
      termID: detail.task.termID,
      termName: detail.task.termName,
      termSeq: detail.task.termSeq,
      courseName: detail.task.courseName,
      sectionID: detail.task.sectionID,
      score: detail.task.score ?? null,
      percent: detail.task.percent ?? null,
      progressScore: detail.task.progressScore ?? null,
      progressPercent: detail.task.progressPercent ?? null,
      progressPointsEarned: detail.task.progressPointsEarned ?? null,
      progressTotalPoints: detail.task.progressTotalPoints ?? null,
      comments: detail.task.comments ?? null,
      hasAssignments: detail.task.hasAssignments,
      hasDetail: detail.task.hasDetail,
      groupWeighted: detail.task.groupWeighted
    }

    const categories: CourseGradeCategory[] = detail.categories.map(cat => {
      const assignments: CourseGradeAssignment[] = (cat.assignments || [])
        .filter((a: any) => (a.termIDs || []).some((id: number) => activeTermIDs.includes(id)))
        .map((a: any) => ({
          objectSectionID: a.objectSectionID,
          assignmentName: a.assignmentName,
          sectionID: a.sectionID,
          dueDate: a.dueDate,
          assignedDate: a.assignedDate,
          scoreModifiedDate: a.scoreModifiedDate,
          termIDs: a.termIDs || [],
          score: a.score,
          scorePoints: a.scorePoints,
          scorePercentage: a.scorePercentage,
          totalPoints: a.totalPoints,
          comments: a.comments,
          feedback: a.feedback,
          late: a.late,
          missing: a.missing,
          dropped: a.dropped,
          incomplete: a.incomplete,
          turnedIn: a.turnedIn,
          notGraded: a.notGraded ?? false,
          multiplier: a.multiplier ?? 1
        }))

      const progress: CategoryProgress | null = cat.progress ? {
        progressScore: cat.progress.progressScore,
        progressPercent: cat.progress.progressPercent,
        progressPointsEarned: cat.progress.progressPointsEarned,
        progressTotalPoints: cat.progress.progressTotalPoints
      } : null

      return {
        groupID: cat.groupID,
        name: cat.name,
        weight: cat.weight,
        assignments,
        progress
      }
    })

    const result: CourseGradeDetailResponse = { task, categories }
    return c.json(result)
  })
  .get('/assignments', async (c) => {
      const session = c.get('session')
      const response = await fetch(`https://${session.baseURL}/api/portal/assignment/listView`, {
          headers: { Cookie: session.cookie }
      })

      if (response.status !== 200) {
        console.log('Failed to get assignments', response.statusText)
          return c.json({ ok: false, message: response.statusText }, response.status as ContentfulStatusCode)
      }

      const data = await response.json() as any[]
      const assignments: Assignment[] = data.map(a => ({
          assignmentName: a.assignmentName,
          objectSectionID: a.objectSectionID,
          sectionID: a.sectionID,
          dueDate: a.dueDate,
          assignedDate: a.assignedDate,
          scoreModifiedDate: a.scoreModifiedDate,
          scorePoints: a.scorePoints,
          score: a.score,
          scorePercentage: a.scorePercentage,
          totalPoints: a.totalPoints,
          comments: a.comments,
          feedback: a.feedback
      }))
console.log('fetched assignments')
return c.json(assignments)
  })

  .get('/assignments/:objectSectionID', async (c) => {
      const session = c.get('session')
      const objectSectionID = c.req.param('objectSectionID')
      const response = await fetch(`https://${session.baseURL}/api/instruction/curriculum/section/content/${objectSectionID}?personID=${session.personID}`, {
          headers: { Cookie: session.cookie }
      })

      if (response.status !== 200) {
          return c.json({ ok: false, message: response.statusText }, response.status as ContentfulStatusCode)
      }

      const data = await response.json()
      const detail: AssignmentDetail = {
          curriculumAlignmentID: data.curriculumAlignmentID,
          sectionID: data.sectionID,
          startDate: data.startDate,
          endDate: data.endDate,
          active: data.active,
          objectID: data.objectID,
          notGraded: data.notGraded,
          modifiedDate: data.modifiedDate,
          releaseScoresTimeStamp: data.releaseScoresTimeStamp,
          gradingAlignments: data.gradingAlignments,
          curriculumContent: data.curriculumContent,
          submissions: data.submissions,
          scores: data.scores,
          hasRubricScores: data.hasRubricScores
      }

      return c.json(detail)
  })
  .get('/attendance/:enrollmentID', async (c) => {
    const session = c.get('session')
    const enrollmentID = c.req.param('enrollmentID')
    const response = await fetch(`https://${session.baseURL}/resources/portal/attendance/${enrollmentID}`, {
      headers: { Cookie: session.cookie }
    })
    if (response.status !== 200) {
      return c.json({ ok: false, message: 'IC error: ' + response.statusText }, response.status as ContentfulStatusCode)
    }
    const data = await response.json()
    // total absences and tardies are the sum across all courses in all terms
    let absences = 0
    let tardies = 0
    if (data && Array.isArray(data.terms)) {
      for (const term of data.terms) {
        if (Array.isArray(term.courses)) {
          for (const course of term.courses) {
            if (Array.isArray(course.absentList)) {
              absences += course.absentList.length
            }
            if (Array.isArray(course.tardyList)) {
              tardies += course.tardyList.length
            }
          }
        }
      }
    }
    return c.json({ absences, tardies })
  })
  
export default ic