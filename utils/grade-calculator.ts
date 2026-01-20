import { CourseGradeCategory, CourseGradeAssignment } from '@/api/src/types'
import { VirtualAssignment } from '@/app/(protected)/(course)/_context'

export function percentToLetterGrade(percent: number): string {
  if (percent >= 97) return 'A+'
  if (percent >= 93) return 'A'
  if (percent >= 90) return 'A-'
  if (percent >= 87) return 'B+'
  if (percent >= 83) return 'B'
  if (percent >= 80) return 'B-'
  if (percent >= 77) return 'C+'
  if (percent >= 73) return 'C'
  if (percent >= 70) return 'C-'
  if (percent >= 67) return 'D+'
  if (percent >= 63) return 'D'
  if (percent >= 60) return 'D-'
  return 'F'
}

type WhatIfModification = {
  score?: string | null
  dropped?: boolean
}

export type ModifiedAssignment = CourseGradeAssignment & {
  isModified: boolean
  originalScore: string | null
  originalDropped: boolean | null
}

export type ModifiedCategory = Omit<CourseGradeCategory, 'assignments'> & {
  assignments: ModifiedAssignment[]
}

export function applyWhatIfModifications(
  categories: CourseGradeCategory[],
  modifications: Map<number, WhatIfModification>,
  virtualAssignments: VirtualAssignment[] = []
): ModifiedCategory[] {
  return categories.map(category => {
    const modifiedAssignments = category.assignments.map(assignment => {
      const mod = modifications.get(assignment.objectSectionID)
      const isModified = !!mod && (mod.score !== undefined || mod.dropped !== undefined)
      
      let modifiedScore = assignment.score
      let modifiedScorePoints = assignment.scorePoints
      let modifiedScorePercentage = assignment.scorePercentage
      let modifiedDropped = assignment.dropped
      
      if (mod) {
        if (mod.score !== undefined) {
          modifiedScore = mod.score
          if (mod.score !== null) {
            const scoreNum = parseFloat(mod.score)
            modifiedScorePoints = mod.score
            modifiedScorePercentage = assignment.totalPoints > 0 
              ? ((scoreNum / assignment.totalPoints) * 100).toFixed(2)
              : '0'
          }
        }
        if (mod.dropped !== undefined) {
          modifiedDropped = mod.dropped
        }
      }
      
      return {
        ...assignment,
        score: modifiedScore,
        scorePoints: modifiedScorePoints,
        scorePercentage: modifiedScorePercentage,
        dropped: modifiedDropped,
        isModified,
        originalScore: assignment.score,
        originalDropped: assignment.dropped,
      }
    })

    const categoryVirtualAssignments = virtualAssignments
      .filter(va => va.groupID === category.groupID)
      .map(va => {
        const scoreNum = parseFloat(va.score)
        const scorePercentage = va.totalPoints > 0 
          ? ((scoreNum / va.totalPoints) * 100).toFixed(2)
          : '0'
        return {
          objectSectionID: va.objectSectionID,
          assignmentName: va.assignmentName,
          sectionID: 0,
          dueDate: new Date().toISOString(),
          assignedDate: new Date().toISOString(),
          scoreModifiedDate: new Date().toISOString(),
          termIDs: [],
          score: va.score,
          scorePoints: va.score,
          scorePercentage,
          totalPoints: va.totalPoints,
          comments: null,
          feedback: null,
          late: null,
          missing: null,
          dropped: va.dropped ?? null,
          incomplete: null,
          turnedIn: null,
          notGraded: false,
          multiplier: 1,
          isModified: true,
          originalScore: null,
          originalDropped: null,
        } as ModifiedAssignment
      })

    return {
      ...category,
      assignments: [...modifiedAssignments, ...categoryVirtualAssignments],
    }
  })
}

export function recalculateGrade(
  categories: ModifiedCategory[],
  isWeighted: boolean
): { percent: number; pointsEarned: number; totalPoints: number } {
  if (isWeighted) {
    let weightedSum = 0
    let totalWeight = 0
    
    for (const category of categories) {
      const gradedAssignments = category.assignments.filter(
        a => a.score !== null && !a.dropped && !a.notGraded
      )
      
      if (gradedAssignments.length === 0) continue
      
      let categoryPointsEarned = 0
      let categoryTotalPoints = 0
      
      for (const assignment of gradedAssignments) {
        const score = parseFloat(assignment.score || '0')
        categoryPointsEarned += score * assignment.multiplier
        categoryTotalPoints += assignment.totalPoints * assignment.multiplier
      }
      
      if (categoryTotalPoints > 0) {
        const categoryPercent = (categoryPointsEarned / categoryTotalPoints) * 100
        weightedSum += categoryPercent * category.weight
        totalWeight += category.weight
      }
    }
    
    const percent = totalWeight > 0 ? weightedSum / totalWeight : 0
    
    let totalPointsEarned = 0
    let totalPointsAll = 0
    for (const category of categories) {
      for (const assignment of category.assignments) {
        if (assignment.score !== null && !assignment.dropped && !assignment.notGraded) {
          totalPointsEarned += parseFloat(assignment.score || '0') * assignment.multiplier
          totalPointsAll += assignment.totalPoints * assignment.multiplier
        }
      }
    }
    
    return { percent, pointsEarned: totalPointsEarned, totalPoints: totalPointsAll }
  } else {
    let totalPointsEarned = 0
    let totalPoints = 0
    
    for (const category of categories) {
      for (const assignment of category.assignments) {
        if (assignment.score !== null && !assignment.dropped && !assignment.notGraded) {
          totalPointsEarned += parseFloat(assignment.score || '0') * assignment.multiplier
          totalPoints += assignment.totalPoints * assignment.multiplier
        }
      }
    }
    
    const percent = totalPoints > 0 ? (totalPointsEarned / totalPoints) * 100 : 0
    return { percent, pointsEarned: totalPointsEarned, totalPoints }
  }
}

function calculateGradeWithoutAssignment(
  categories: ModifiedCategory[],
  targetObjectSectionID: number,
  isWeighted: boolean
): number {
  if (isWeighted) {
    let weightedSum = 0
    let totalWeight = 0
    
    for (const category of categories) {
      const gradedAssignments = category.assignments.filter(
        a => a.score !== null && !a.dropped && !a.notGraded && a.objectSectionID !== targetObjectSectionID
      )
      
      if (gradedAssignments.length === 0) continue
      
      let categoryPointsEarned = 0
      let categoryTotalPoints = 0
      
      for (const assignment of gradedAssignments) {
        const score = parseFloat(assignment.score || '0')
        categoryPointsEarned += score * assignment.multiplier
        categoryTotalPoints += assignment.totalPoints * assignment.multiplier
      }
      
      if (categoryTotalPoints > 0) {
        const categoryPercent = (categoryPointsEarned / categoryTotalPoints) * 100
        weightedSum += categoryPercent * category.weight
        totalWeight += category.weight
      }
    }
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  } else {
    let totalPointsEarned = 0
    let totalPoints = 0
    
    for (const category of categories) {
      for (const assignment of category.assignments) {
        if (assignment.score !== null && !assignment.dropped && !assignment.notGraded && assignment.objectSectionID !== targetObjectSectionID) {
          totalPointsEarned += parseFloat(assignment.score || '0') * assignment.multiplier
          totalPoints += assignment.totalPoints * assignment.multiplier
        }
      }
    }
    
    return totalPoints > 0 ? (totalPointsEarned / totalPoints) * 100 : 0
  }
}

export function calculatePercentImpact(
  assignment: ModifiedAssignment,
  categories: ModifiedCategory[],
  isWeighted: boolean
): number {
  if (assignment.score === null || assignment.dropped || assignment.notGraded) return 0
  
  const currentGrade = recalculateGrade(categories, isWeighted).percent
  const gradeWithoutAssignment = calculateGradeWithoutAssignment(categories, assignment.objectSectionID, isWeighted)
  
  return currentGrade - gradeWithoutAssignment
}

export function calculatePercentImpactFromRaw(
  assignment: CourseGradeAssignment,
  categories: CourseGradeCategory[],
  isWeighted: boolean
): number {
  if (assignment.score === null || assignment.dropped || assignment.notGraded) return 0
  
  const modifiedCategories: ModifiedCategory[] = categories.map(cat => ({
    ...cat,
    assignments: cat.assignments.map(a => ({
      ...a,
      isModified: false,
      originalScore: a.score,
      originalDropped: a.dropped,
    }))
  }))
  
  const currentGrade = recalculateGrade(modifiedCategories, isWeighted).percent
  const gradeWithoutAssignment = calculateGradeWithoutAssignment(modifiedCategories, assignment.objectSectionID, isWeighted)
  
  return currentGrade - gradeWithoutAssignment
}
