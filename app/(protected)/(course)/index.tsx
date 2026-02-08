import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useCourseGrade } from '@/hooks/use-ic'
import { GradeCard } from '@/components/GradeCard'
import { GenericGradeCard } from '@/components/GenericGradeCard'
import { useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useWhatIf } from './_context'
import { applyWhatIfModifications, recalculateGrade, ModifiedAssignment, calculatePercentImpact, percentToLetterGrade } from '@/utils/grade-calculator'

type AssignmentWithImpact = ModifiedAssignment & { 
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

  const { editMode, toggleEditMode, modifications, virtualAssignments, editGrade, toggleDrop, resetAll } = useWhatIf()

  const { modifiedCategories, calculatedGrade, originalPercent, hasModifications } = useMemo(() => {
    if (!courseData?.categories) {
      return { 
        modifiedCategories: [], 
        calculatedGrade: null, 
        originalPercent: percent ? parseFloat(percent) : null,
        hasModifications: false 
      }
    }
    
    const modified = applyWhatIfModifications(courseData.categories, modifications, virtualAssignments)
    const isWeighted = courseData.task.groupWeighted
    const calculated = recalculateGrade(modified, isWeighted)
    const origPercent = percent ? parseFloat(percent) : (courseData.task.progressPercent ?? courseData.task.percent ?? null)
    const hasMods = modifications.size > 0 || virtualAssignments.length > 0
    
    return { 
      modifiedCategories: modified, 
      calculatedGrade: calculated,
      originalPercent: origPercent,
      hasModifications: hasMods
    }
  }, [courseData, modifications, virtualAssignments, percent])

  const recentGrades = useMemo(() => {
    if (!modifiedCategories.length) return []
    
    const isWeighted = courseData?.task.groupWeighted ?? false
    
    const allAssignments: AssignmentWithImpact[] = []
    for (const category of modifiedCategories) {
      for (const assignment of category.assignments) {
        const percentImpact = calculatePercentImpact(assignment, modifiedCategories, isWeighted)
        
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
  }, [modifiedCategories, courseData])

  if (!sectionID) {
    router.back()
    return null
  }

  const displayPercent = hasModifications 
  ? calculatedGrade?.percent ?? null
  : (courseData?.task.progressPercent ?? courseData?.task.percent ?? (percent ? parseFloat(percent) : null))
  
  const displayScore = hasModifications && displayPercent !== null
    ? percentToLetterGrade(displayPercent)
    : score
  
  const percentChange = hasModifications && originalPercent !== null && displayPercent !== null
    ? Math.round((displayPercent - originalPercent) * 100) / 100
    : null

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
        }}
      />
      <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
        <ScrollView className="flex-1 px-4 pt-6">
          <GenericGradeCard
            taskName={taskName}
            score={displayScore}
            displayPercent={displayPercent}
            percentChange={percentChange}
            hasModifications={hasModifications}
          />

          <View className="flex-row items-center justify-between mb-6 px-1">
            <View className="flex-row items-center">
              <Switch
                value={editMode}
                onValueChange={toggleEditMode}

              />
              <Text className="text-stone-300 text-base ml-3">Edit Grades</Text>
            </View>
            {hasModifications && (
              <TouchableOpacity onPress={resetAll} className="flex-row items-center">
                <Ionicons name="refresh" size={18} color="#f87171" />
                <Text className="text-red-400 text-base ml-1">Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View className="py-10">
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : error ? (
            <View className="border border-stone-700 rounded-2xl p-5">
              <Text className="text-red-400 text-center text-lg">
                Failed to load grades
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-stone-100 text-2xl font-bold mb-4">Recent Grades</Text>
              {recentGrades.length > 0 ? (
                recentGrades.map((assignment) => (
                  <GradeCard
                    key={assignment.objectSectionID}
                    assignment={assignment}
                    percentImpact={assignment.percentImpact}
                    isModified={assignment.isModified}
                    editMode={editMode}
                    onScoreChange={(score) => editGrade(assignment.objectSectionID, score)}
                    onDropGrade={() => toggleDrop(assignment.objectSectionID, assignment.dropped ?? false)}
                  />
                ))
              ) : (
                <View className="border border-stone-700 rounded-2xl p-5">
                  <Text className="text-stone-400 text-center text-lg">
                    No grades yet
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSeeAllGrades}
                className="border border-stone-700 rounded-2xl py-5 px-6 mt-2 mb-20 flex-row items-center justify-between active:scale-[0.98] active:opacity-80"
              >
                <Text className="text-stone-100 text-lg font-medium">
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
