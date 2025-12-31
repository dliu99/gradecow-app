import { Hono } from "hono"
import { ContentfulStatusCode } from "hono/utils/http-status"
import * as Iron from 'iron-webcrypto'
import { Session, Variables, Enrollment, ExtractedCourse, Assignment, AssignmentDetail } from './types'
const ironKey = process.env.IRON_KEY as string



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
ic.use(async (c, next) => {
    const sessionToken = c.req.header('Authorization')
    if (!sessionToken) {
        return c.json({ ok: false, message: 'Unauthorized' }, 401)
    }
    try {
        const session = await Iron.unseal(sessionToken, ironKey, Iron.defaults)
        c.set('session', session as Session)
    } catch (error) {
        return c.json({ ok: false, message: 'Invalid session token' }, 401)
    }
    await next()
})

ic.get('/', async (c) => {
    return c.json({ ok: true, session: c.get('session') })
})

ic.get('/course-grades', async (c) => {
    const session = c.get('session')
    const baseUrl = session.baseURL
    console.log(session.cookie)
    console.log(`https://${baseUrl}/resources/portal/grades`)
    const response = await fetch(`https://${baseUrl}/resources/portal/grades`, {
        headers: { Cookie: session.cookie }
    })

    if (response.status !== 200) {
        return c.json({ ok: false, message: response.statusText }, response.status as ContentfulStatusCode)
    }

    const data = await response.json() as Enrollment[]
    const grades = extractCourseGrades(data)
    return c.json({ ok: true, grades })
})

ic.get('/assignments', async (c) => {
    const session = c.get('session')
    const response = await fetch(`https://${session.baseURL}/api/portal/assignment/listView`, {
        headers: { Cookie: session.cookie }
    })

    if (response.status !== 200) {
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

    return c.json({ ok: true, assignments })
})

ic.get('/assignments/:objectSectionID', async (c) => {
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

    return c.json({ ok: true, detail })
})
export default ic