import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { CourseGradeAssignment } from '@/api/src/types'
import BottomSheet from '@gorhom/bottom-sheet'

type WhatIfModification = {
  score?: string | null
  dropped?: boolean
}

export type VirtualAssignment = {
  objectSectionID: number
  groupID: number
  assignmentName: string
  score: string
  totalPoints: number
  dropped?: boolean
}

type WhatIfContextType = {
  modifications: Map<number, WhatIfModification>
  virtualAssignments: VirtualAssignment[]
  editGrade: (objectSectionID: number, score: string | null) => void
  toggleDrop: (objectSectionID: number, currentDropped: boolean) => void
  resetGrade: (objectSectionID: number) => void
  resetAll: () => void
  editingAssignment: CourseGradeAssignment | null
  openEditSheet: (assignment: CourseGradeAssignment) => void
  closeEditSheet: () => void
  sheetRef: React.RefObject<BottomSheet | null>
  addingToGroupID: number | null
  addAssignment: (groupID: number, score: string, totalPoints: number) => void
  removeVirtualAssignment: (objectSectionID: number) => void
  removeVirtualAssignmentsForCategory: (groupID: number) => void
  openAddSheet: (groupID: number) => void
  closeAddSheet: () => void
  addSheetRef: React.RefObject<BottomSheet | null>
  getVirtualAssignmentCount: (groupID: number) => number
  renameVirtualAssignment: (objectSectionID: number, newName: string) => void
  renamingAssignment: CourseGradeAssignment | null
  openRenameSheet: (assignment: CourseGradeAssignment) => void
  closeRenameSheet: () => void
  renameSheetRef: React.RefObject<BottomSheet | null>
}

const WhatIfContext = createContext<WhatIfContextType | null>(null)

export function WhatIfProvider({ children }: { children: ReactNode }) {
  const [modifications, setModifications] = useState<Map<number, WhatIfModification>>(new Map())
  const [editingAssignment, setEditingAssignment] = useState<CourseGradeAssignment | null>(null)
  const [renamingAssignment, setRenamingAssignment] = useState<CourseGradeAssignment | null>(null)
  const [virtualAssignments, setVirtualAssignments] = useState<VirtualAssignment[]>([])
  const [addingToGroupID, setAddingToGroupID] = useState<number | null>(null)
  const sheetRef = useRef<BottomSheet>(null)
  const addSheetRef = useRef<BottomSheet>(null)
  const renameSheetRef = useRef<BottomSheet>(null)

  const editGrade = useCallback((objectSectionID: number, score: string | null) => {
    if (objectSectionID < 0) {
      setVirtualAssignments(prev => prev.map(a => 
        a.objectSectionID === objectSectionID 
          ? { ...a, score: score ?? '0' }
          : a
      ))
    } else {
      setModifications(prev => {
        const next = new Map(prev)
        const existing = next.get(objectSectionID) || {}
        next.set(objectSectionID, { ...existing, score })
        return next
      })
    }
  }, [])

  const toggleDrop = useCallback((objectSectionID: number, currentDropped: boolean) => {
    if (objectSectionID < 0) {
      setVirtualAssignments(prev => prev.map(a => 
        a.objectSectionID === objectSectionID 
          ? { ...a, dropped: !currentDropped }
          : a
      ))
    } else {
      setModifications(prev => {
        const next = new Map(prev)
        const existing = next.get(objectSectionID) || {}
        next.set(objectSectionID, { ...existing, dropped: !currentDropped })
        return next
      })
    }
  }, [])

  const resetGrade = useCallback((objectSectionID: number) => {
    if (objectSectionID < 0) {
      setVirtualAssignments(prev => prev.filter(a => a.objectSectionID !== objectSectionID))
    } else {
      setModifications(prev => {
        const next = new Map(prev)
        next.delete(objectSectionID)
        return next
      })
    }
  }, [])

  const resetAll = useCallback(() => {
    setModifications(new Map())
    setVirtualAssignments([])
  }, [])

  const openEditSheet = useCallback((assignment: CourseGradeAssignment) => {
    setEditingAssignment(assignment)
    sheetRef.current?.expand()
  }, [])

  const closeEditSheet = useCallback(() => {
    sheetRef.current?.close()
    setEditingAssignment(null)
  }, [])

  const getVirtualAssignmentCount = useCallback((groupID: number) => {
    return virtualAssignments.filter(a => a.groupID === groupID).length
  }, [virtualAssignments])

  const addAssignment = useCallback((groupID: number, score: string, totalPoints: number) => {
    const count = virtualAssignments.filter(a => a.groupID === groupID).length + 1
    const newAssignment: VirtualAssignment = {
      objectSectionID: -Date.now(),
      groupID,
      assignmentName: `My Assignment #${count}`,
      score,
      totalPoints,
    }
    setVirtualAssignments(prev => [...prev, newAssignment])
  }, [virtualAssignments])

  const removeVirtualAssignment = useCallback((objectSectionID: number) => {
    setVirtualAssignments(prev => prev.filter(a => a.objectSectionID !== objectSectionID))
  }, [])

  const removeVirtualAssignmentsForCategory = useCallback((groupID: number) => {
    setVirtualAssignments(prev => prev.filter(a => a.groupID !== groupID))
  }, [])

  const openAddSheet = useCallback((groupID: number) => {
    setAddingToGroupID(groupID)
    addSheetRef.current?.expand()
  }, [])

  const closeAddSheet = useCallback(() => {
    addSheetRef.current?.close()
    setAddingToGroupID(null)
  }, [])

  const renameVirtualAssignment = useCallback((objectSectionID: number, newName: string) => {
    setVirtualAssignments(prev => prev.map(a => 
      a.objectSectionID === objectSectionID 
        ? { ...a, assignmentName: newName }
        : a
    ))
  }, [])

  const openRenameSheet = useCallback((assignment: CourseGradeAssignment) => {
    setRenamingAssignment(assignment)
    renameSheetRef.current?.expand()
  }, [])

  const closeRenameSheet = useCallback(() => {
    renameSheetRef.current?.close()
    setRenamingAssignment(null)
  }, [])

  return (
    <WhatIfContext.Provider
      value={{
        modifications,
        virtualAssignments,
        editGrade,
        toggleDrop,
        resetGrade,
        resetAll,
        editingAssignment,
        openEditSheet,
        closeEditSheet,
        sheetRef,
        addingToGroupID,
        addAssignment,
        removeVirtualAssignment,
        removeVirtualAssignmentsForCategory,
        openAddSheet,
        closeAddSheet,
        addSheetRef,
        getVirtualAssignmentCount,
        renameVirtualAssignment,
        renamingAssignment,
        openRenameSheet,
        closeRenameSheet,
        renameSheetRef,
      }}
    >
      {children}
    </WhatIfContext.Provider>
  )
}

export function useWhatIf() {
  const context = useContext(WhatIfContext)
  if (!context) {
    throw new Error('useWhatIf must be used within a WhatIfProvider')
  }
  return context
}

