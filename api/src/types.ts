export type Session = {
  cookie: string
  baseURL: string
  deviceId: string
  deviceModel: string
  deviceType: string
  systemVersion: string
  personID: number
}

export type Variables = {
  session: Session
}

export type GradingTask = {
  taskName: string
  hasAssignments: boolean
  hasDetail: boolean
  score?: string
  percent?: number
  progressScore?: string
  progressPercent?: number
}

export type Course = {
  courseName: string
  sectionID: number
  dropped: boolean
  gradingTasks: GradingTask[]
}

export type Term = {
  termName: string
  termSeq: number
  courses: Course[]
}

export type Enrollment = {
  terms: Term[]
}

export type ExtractedCourse = {
  courseName: string
  sectionID: number
  score: string | undefined
  percent: number | undefined
  termName: string
  taskName: string
}

export type Assignment = {
  assignmentName: string
  objectSectionID: number
  sectionID: number
  dueDate: string
  assignedDate: string
  scoreModifiedDate: string
  scorePoints: string
  score: string
  scorePercentage: string
  totalPoints: number
  comments: string | null
  feedback: string | null
}

export type AssignmentDetail = {
  curriculumAlignmentID: number
  sectionID: number
  startDate: string
  endDate: string
  active: boolean
  objectID: number
  notGraded: boolean
  modifiedDate: string
  releaseScoresTimeStamp: string
  gradingAlignments: any[]
  curriculumContent: {
    objectID: number
    name: string
    type: number
    description: string | null
    curriculumBlocks: any[]
  }
  submissions: any[]
  scores: any[]
  hasRubricScores: boolean
}