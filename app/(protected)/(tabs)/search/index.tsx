import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAllAssignments, useGrades } from '@/hooks/use-ic'
import { AssignmentCard } from '@/components/AssignmentCard'
import { Assignment } from '@/api/src/types'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useSearch } from './_context'

function getAllUpcomingAssignments(assignments: Assignment[], today: dayjs.Dayjs): Assignment[] {
  const todayStart = today.startOf('day')
  return assignments
    .filter((a) => {
      const dueDate = dayjs(a.dueDate)
      return dueDate.isValid() && (dueDate.startOf('day').isSame(todayStart) || dueDate.isAfter(todayStart))
    })
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
}

export default function Search() {
  const { query } = useSearch()
  const { data: assignments, isLoading: assignmentsLoading } = useAllAssignments()
  const { data: grades, isLoading: gradesLoading } = useGrades()

  const courseNameMap = useMemo(() => {
    const map = new Map<number, string>()
    if (grades) {
      for (const course of grades) {
        map.set(course.sectionID, course.courseName)
      }
    }
    return map
  }, [grades])

  const today = useMemo(() => dayjs(), [])

  const upcomingAssignments = useMemo(() => {
    if (!assignments) return []
    return getAllUpcomingAssignments(assignments, today)
  }, [assignments, today])

  const filteredAssignments = useMemo(() => {
    if (!query.trim()) return upcomingAssignments
    const lowerQuery = query.toLowerCase()
    return upcomingAssignments.filter((a) => {
      const nameMatch = a.assignmentName?.toLowerCase().includes(lowerQuery)
      const courseName = courseNameMap.get(a.sectionID)
      const courseMatch = courseName?.toLowerCase().includes(lowerQuery)
      return nameMatch || courseMatch
    })
  }, [upcomingAssignments, query, courseNameMap])

  const byDate = useMemo(() => {
    const map = new Map<string, Assignment[]>()
    for (const a of filteredAssignments) {
      const dateKey = dayjs(a.dueDate).startOf('day').format('YYYY-MM-DD')
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(a)
    }
    return map
  }, [filteredAssignments])

  const isLoading = assignmentsLoading || gradesLoading

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900" edges={[]}>
      <ScrollView 
        className="flex-1 px-5" 
        contentInsetAdjustmentBehavior="automatic"
      >
        {filteredAssignments.length === 0 ? (
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-white text-xl font-medium">
              {query.trim() ? 'No matching assignments' : 'No upcoming assignments'}
            </Text>
          </View>
        ) : (
          <>
            {/*<Text className="text-white text-3xl font-bold mt-9">Assignments</Text>*/}
            {Array.from(byDate.entries()).map(([dateKey, dateAssignments]) => {
              const date = dayjs(dateKey)
              return (
                <View key={dateKey}>
                  <Text className="text-stone-500 text-xl font-semibold mt-2 mb-2">{date.format('dddd, MMMM D')}</Text>
                  {dateAssignments.map((assignment) => (
                    <AssignmentCard
                      key={`${assignment.objectSectionID}-${assignment.assignmentName}`}
                      assignment={assignment}
                      courseName={courseNameMap.get(assignment.sectionID)}
                      now={today}
                    />
                  ))}
                </View>
              )
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
