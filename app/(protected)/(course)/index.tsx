import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useCourseGrade } from '@/hooks/use-ic'
import { GradeCard } from '@/components/GradeCard'
import { CourseGradeAssignment, CourseGradeCategory } from '@/api/src/types'
import { useMemo } from 'react'
import { Button, ContextMenu, Host } from '@expo/ui/swift-ui'
import { Ionicons } from '@expo/vector-icons'

type AssignmentWithImpact = CourseGradeAssignment & { 
  percentImpact: number
  categoryWeight: number
}

export default function CourseModal() {
  const router = useRouter()
  const { sectionID, courseName, teacher, score, percent, termName, taskName } = useLocalSearchParams<{
    sectionID: string
    courseName: string
    teacher: string
    score?: string
    percent?: string
    termName: string
    taskName: string
  }>()

  const { data: courseData, isLoading, error } = useCourseGrade(
    sectionID ? parseInt(sectionID, 10) : 0
  )

  const recentGrades = useMemo(() => {
    if (!courseData?.categories) return []
    
    const isWeighted = courseData.task.groupWeighted
    const totalCoursePoints = courseData.categories.reduce((sum, cat) => {
      return sum + cat.assignments.reduce((catSum, a) => catSum + (a.dropped ? 0 : a.totalPoints), 0)
    }, 0)
    
    const allAssignments: AssignmentWithImpact[] = []
    for (const category of courseData.categories) {
      const categoryTotalPoints = category.assignments.reduce((sum, a) => sum + (a.dropped ? 0 : a.totalPoints), 0)
      
      for (const assignment of category.assignments) {
        let percentImpact = 0
        
        if (assignment.score !== null && !assignment.dropped) {
          const scorePercent = parseFloat(assignment.scorePercentage || '0')
          const deviation = scorePercent - 100
          
          if (isWeighted && categoryTotalPoints > 0) {
            percentImpact = (deviation / 100) * (assignment.totalPoints / categoryTotalPoints) * category.weight
          } else if (totalCoursePoints > 0) {
            percentImpact = (deviation / 100) * (assignment.totalPoints / totalCoursePoints) * 100
          }
        }
        
        allAssignments.push({ 
          ...assignment, 
          percentImpact: Math.round(percentImpact * 100) / 100,
          categoryWeight: category.weight
        })
      }
    }
    
    return allAssignments
      .filter((a) => a.score !== null || a.missing)
      .sort((a, b) => {
        const dateA = a.scoreModifiedDate || a.dueDate
        const dateB = b.scoreModifiedDate || b.dueDate
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
      .slice(0, 5)
  }, [courseData])

  if (!sectionID) {
    router.back()
    return null
  }

  const getScoreColor = () => {
    if (!percent) return 'text-stone-400'
    const p = parseFloat(percent)
    if (p >= 90) return 'text-green-400'
    if (p >= 80) return 'text-green-500'
    if (p >= 70) return 'text-yellow-400'
    if (p >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const handleWhatIfCalculator = () => {
    console.log('What-If Calculator pressed')
  }

  const handleResetAll = () => {
    console.log('Reset All pressed')
  }

  const handleSeeAllGrades = () => {
    router.push({
      pathname: '/(protected)/(course)/all-grades',
      params: {
        sectionID,
        courseName,
        teacher,
        score: score ?? '',
        percent: percent ?? '',
        termName,
        taskName,
      },
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: courseName,
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#fff',
          headerRight: () => (
            <Host style={{ width: 44, height: 44 }}>
              <ContextMenu>
                <ContextMenu.Items>
                  <Button
                    systemImage="function"
                    onPress={handleWhatIfCalculator}
                    >What-If Calculator</Button>
                  <Button
                    systemImage="arrow.counterclockwise"
                    role="destructive"
                    onPress={handleResetAll}
                  >Reset All</Button>
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <Button systemImage="ellipsis.circle" />
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
        <ScrollView className="flex-1 px-4 pt-6">

          <View className="bg-stone-800 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-stone-400 text-xl font-medium">{taskName}</Text>
              <View className="items-center">
                <Text className={`text-2xl font-bold ${getScoreColor()}`}>
                  {score ?? '—'}
                </Text>
                {percent && (
                  <Text className={`text-2xl font-semibold ${getScoreColor()}`}>
                    ({percent}%)
                  </Text>
                )}
              </View>
            </View>
          </View>

          {isLoading ? (
            <View className="py-10">
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : error ? (
            <View className="bg-stone-800 rounded-2xl p-5">
              <Text className="text-red-400 text-center text-lg">
                Failed to load grades
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-white text-3xl font-bold mb-4">Recent Grades</Text>
              {recentGrades.length > 0 ? (
                recentGrades.map((assignment) => (
                  <GradeCard
                    key={assignment.objectSectionID}
                    assignment={assignment}
                    percentImpact={assignment.percentImpact}
                    onEditGrade={() => console.log('Edit', assignment.assignmentName)}
                    onDropGrade={() => console.log('Drop/Undrop', assignment.assignmentName)}
                    onResetGrade={() => console.log('Reset', assignment.assignmentName)}
                  />
                ))
              ) : (
                <View className="bg-stone-800 rounded-2xl p-5">
                  <Text className="text-stone-400 text-center text-lg">
                    No grades yet
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSeeAllGrades}
                className="bg-stone-800 rounded-2xl py-5 px-6 mt-2 mb-20 flex-row items-center justify-between"
              >
                <Text className="text-white text-lg font-medium">
                  See all grades
                </Text>
                <Ionicons name="arrow-forward" size={22} color="#a8a29e" />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

