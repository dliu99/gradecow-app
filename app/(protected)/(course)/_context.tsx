import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
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
  editMode: boolean
  toggleEditMode: () => void
  modifications: Map<number, WhatIfModification>
  virtualAssignments: VirtualAssignment[]
  editGrade: (objectSectionID: number, score: string | null) => void
  toggleDrop: (objectSectionID: number, currentDropped: boolean) => void
  resetAll: () => void
  addingToGroupID: number | null
  addAssignment: (groupID: number, score: string, totalPoints: number) => void
  removeVirtualAssignment: (objectSectionID: number) => void
  removeVirtualAssignmentsForCategory: (groupID: number) => void
  openAddSheet: (groupID: number) => void
  closeAddSheet: () => void
  addSheetRef: React.RefObject<BottomSheet | null>
  getVirtualAssignmentCount: (groupID: number) => number
  renameVirtualAssignment: (objectSectionID: number, newName: string) => void
}

const WhatIfContext = createContext<WhatIfContextType | null>(null)

export function WhatIfProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false)
  const [modifications, setModifications] = useState<Map<number, WhatIfModification>>(new Map())
  const [virtualAssignments, setVirtualAssignments] = useState<VirtualAssignment[]>([])
  const [addingToGroupID, setAddingToGroupID] = useState<number | null>(null)
  const addSheetRef = useRef<BottomSheet>(null)

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev)
  }, [])

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

  const resetAll = useCallback(() => {
    setModifications(new Map())
    setVirtualAssignments([])
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

  return (
    <WhatIfContext.Provider
      value={{
        editMode,
        toggleEditMode,
        modifications,
        virtualAssignments,
        editGrade,
        toggleDrop,
        resetAll,
        addingToGroupID,
        addAssignment,
        removeVirtualAssignment,
        removeVirtualAssignmentsForCategory,
        openAddSheet,
        closeAddSheet,
        addSheetRef,
        getVirtualAssignmentCount,
        renameVirtualAssignment,
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
