export type Session = {
  cookie: string
  baseURL: string
  deviceId: string
  deviceModel: string
  deviceType: string
  systemVersion: string
  userID: number
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
  teacherDisplay: string
  sectionID: number
  structureID: number
  dropped: boolean
  gradingTasks: GradingTask[]
}

export type Term = {
  termName: string
  termSeq: number
  calendarID: number
  courses: Course[]
}

export type Enrollment = {
  enrollmentID: number
  terms: Term[]
}

export type ExtractedCourse = {
  courseName: string
  teacher: string
  sectionID: number
  calendarID: number
  structureID: number
  enrollmentID: number
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
  gradingAlignments: [{
    "weight": number,
            //"scoringType": "p",
            "totalPoints": number,
            "sectionID": number,
  }]
  curriculumContent: {
    objectID: number
    name: string
    type: number
    description: { blobID: string; content: string; skipSanitize: boolean } | null
    curriculumBlocks: any[]
  }
  submissions: any[]
  scores: [{
    "scorePoints": string,
    "scorePercentage": string,
    "comments": any,

  }]
  hasRubricScores: boolean
}

export type userAccount = {
  personID: number
  username: string
  firstName: string
  lastName: string
  homepage: string
}

export type UserProfile = {
  gpa: { uw: string | null; w: string | null } | null
  absences: number | null
  tardies: number | null
}

export type CourseGradeTerm = {
  calendarID: number
  termID: number
  structureID: number
  termName: string
  termScheduleID: number
  termScheduleName: string
  termSeq: number
  isPrimary: boolean
  startDate: string
  endDate: string
}

export type CourseGradeAssignment = {
  objectSectionID: number
  assignmentName: string
  sectionID: number
  dueDate: string
  assignedDate: string
  scoreModifiedDate: string | null
  termIDs: number[]
  score: string | null
  scorePoints: string | null
  scorePercentage: string | null
  totalPoints: number
  comments: string | null
  feedback: string | null
  late: boolean | null
  missing: boolean | null
  dropped: boolean | null
  incomplete: boolean | null
  turnedIn: boolean | null
  notGraded: boolean
  multiplier: number
}

export type CategoryProgress = {
  progressScore: string | null
  progressPercent: number | null
  progressPointsEarned: number | null
  progressTotalPoints: number | null
}

export type CourseGradeCategory = {
  groupID: number
  name: string
  weight: number
  assignments: CourseGradeAssignment[]
  progress: CategoryProgress | null
}

export type CourseGradeTask = {
  taskID: number
  taskName: string
  termID: number
  termName: string
  termSeq: number
  courseName: string
  sectionID: number
  score: string | null
  percent: number | null
  progressScore: string | null
  progressPercent: number | null
  progressPointsEarned: number | null
  progressTotalPoints: number | null
  comments: string | null
  hasAssignments: boolean
  hasDetail: boolean
  groupWeighted: boolean
}

export type CourseGradeDetailResponse = {
  task: CourseGradeTask
  categories: CourseGradeCategory[]
}

export type CourseGradeAPIResponse = {
  terms: CourseGradeTerm[]
  details: Array<{
    task: any
    categories: any[]
    children: any
  }>
}

export type AppTool = {
  code: string //student.responsive-schedule
  name: string
  url: string
  display: boolean
  sequence: number
}

export type App = {
  id: number
  tools: AppTool[]
}

export type ResponsiveScheduleOffering = {
  responsiveOfferingID: number
  responsiveOfferingName: string
  description: string
  maxStudents: number
  courseNumber: string
  sectionNumber: string
  teacherDisplay: string
  roomName: string
  currentStudents: number
  rosterID: number
  teacherRequest: boolean
  reason: string
}

export type ResponsiveScheduleSession = {
  responsiveSessionID: number
  sessionName: string
  startDate: number
  endDate: number
  sessionOpen: boolean
  offerings: ResponsiveScheduleOffering[]
}
