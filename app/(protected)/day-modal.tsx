import { View, ScrollView } from 'react-native'
//import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useAllAssignments, useGrades } from '@/hooks/use-ic'
import { AssignmentCard } from '@/components/AssignmentCard'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useHeaderHeight } from '@react-navigation/elements'

export default function DayModal() {
  const router = useRouter()
  const headerHeight = useHeaderHeight()
  const { date } = useLocalSearchParams<{ date: string }>()
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

  const selectedDayjs = date ? dayjs(date) : null
  const currentDate = useMemo(() => dayjs(), [])

  const selectedAssignments = useMemo(() => {
    if (!assignments || !date) return []
    const dateKey = dayjs(date).startOf('day').format('YYYY-MM-DD')
    return assignments.filter((assignment) => {
      const assignmentDateKey = dayjs(assignment.dueDate).startOf('day').format('YYYY-MM-DD')
      return assignmentDateKey === dateKey
    })
  }, [assignments, date])

  if (!date || !selectedDayjs) {
    router.back()
    return null
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: selectedDayjs.format('dddd, MMMM D'),
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontSize: 18, fontWeight: '600' },
        }}
      />
      <View className="flex-1 bg-neutral-900">
        <ScrollView 
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: headerHeight + 20 }}
        >
          <View className="mb-10">
            {selectedAssignments.map((assignment) => (
              <AssignmentCard
                key={`${assignment.objectSectionID}-${assignment.assignmentName}`}
                assignment={assignment}
                courseName={courseNameMap.get(assignment.sectionID)}
                now={currentDate}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  )
}

