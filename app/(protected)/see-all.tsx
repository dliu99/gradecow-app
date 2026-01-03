import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAllAssignments, useGrades } from '@/hooks/use-ic'
import { AssignmentCard } from '@/components/AssignmentCard'
import { Assignment } from '@/api/src/types'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import { Ionicons } from '@expo/vector-icons'



function getBeyondAssignments(assignments: Assignment[], today: dayjs.Dayjs): Assignment[] {
  const todayStart = today.startOf('day')
  const twoWeeksFromNow = todayStart.add(14, 'day')

  return assignments
    .filter((a) => {
      const dueDate = dayjs(a.dueDate)
      return dueDate.isValid() && (dueDate.startOf('day').isSame(twoWeeksFromNow) || dueDate.isAfter(twoWeeksFromNow))
    })
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
}

export default function SeeAll() {
  const router = useRouter()
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

  const beyondAssignments = useMemo(() => {
    if (!assignments) return []
    return getBeyondAssignments(assignments, today)
  }, [assignments, today])

  const byDate = useMemo(() => {
    const map = new Map<string, Assignment[]>()
    for (const a of beyondAssignments) {
      const dateKey = dayjs(a.dueDate).startOf('day').format('YYYY-MM-DD')
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(a)
    }
    return map
  }, [beyondAssignments])

  const isLoading = assignmentsLoading || gradesLoading

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    )
  }

  const glassAvailable = isLiquidGlassAvailable()

  return (

    <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>

        <Pressable
          onPress={() => router.back()}
          className="absolute left-6 bottom-8 z-10"
        >
          {glassAvailable ? (
            <GlassView
            isInteractive
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </GlassView>
          ) : (
            <View className="rounded-full bg-stone-800 items-center justify-center" style={{ width: 56, height: 56 }}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </View>
          )}
        </Pressable>
      <ScrollView className="flex-1 px-6 pt-8">
        {beyondAssignments.length === 0 ? (
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-white text-xl font-medium">No assignments beyond 2 weeks</Text>
          </View>
        ) : (
          <>
            <Text className="text-white text-3xl font-bold">All Upcoming</Text>
            {Array.from(byDate.entries()).map(([dateKey, dateAssignments]) => {
              const date = dayjs(dateKey)
              return (
                <View key={dateKey} className="">
                  <Text className="text-stone-500 text-xl font-semibold mt-5 mb-2">{date.format('dddd, MMMM D')}</Text>
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
