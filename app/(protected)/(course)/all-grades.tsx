import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useCourseGrade } from '@/hooks/use-ic'
import { CategoryAccordion } from '@/components/CategoryAccordion'
import { GenericGradeCard } from '@/components/GenericGradeCard'
import { AddAssignmentSheet } from '@/components/AddAssignmentSheet'
import { useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useWhatIf } from './_context'
import { applyWhatIfModifications, recalculateGrade, ModifiedAssignment, ModifiedCategory, percentToLetterGrade } from '@/utils/grade-calculator'

export default function AllGradesModal() {
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

  const { editMode, toggleEditMode, modifications, virtualAssignments, editGrade, toggleDrop, resetAll, openAddSheet, removeVirtualAssignmentsForCategory, removeVirtualAssignment } = useWhatIf()

  const { modifiedCategories, calculatedGrade, originalPercent, hasModifications, isWeighted } = useMemo(() => {
    if (!courseData?.categories) {
      return { 
        modifiedCategories: [], 
        calculatedGrade: null, 
        originalPercent: percent ? parseFloat(percent) : null,
        hasModifications: false,
        isWeighted: false
      }
    }
    
    const modified = applyWhatIfModifications(courseData.categories, modifications, virtualAssignments)
    const weighted = courseData.task.groupWeighted
    const calculated = recalculateGrade(modified, weighted)
    const origPercent = percent ? parseFloat(percent) : (courseData.task.progressPercent ?? courseData.task.percent ?? null)
    const hasMods = modifications.size > 0 || virtualAssignments.length > 0
    
    return { 
      modifiedCategories: modified, 
      calculatedGrade: calculated,
      originalPercent: origPercent,
      hasModifications: hasMods,
      isWeighted: weighted
    }
  }, [courseData, modifications, virtualAssignments, percent])

  if (!sectionID) {
    router.back()
    return null
  }

  const displayPercent = calculatedGrade?.percent ?? (percent ? parseFloat(percent) : null)
  const displayScore = hasModifications && displayPercent !== null
    ? percentToLetterGrade(displayPercent)
    : score
  const percentChange = hasModifications && originalPercent !== null && displayPercent !== null
    ? Math.round((displayPercent - originalPercent) * 100) / 100
    : null

  const handleScoreChange = (assignment: ModifiedAssignment, score: string | null) => {
    editGrade(assignment.objectSectionID, score)
  }

  const handleDropGrade = (assignment: ModifiedAssignment) => {
    toggleDrop(assignment.objectSectionID, assignment.dropped ?? false)
  }

  const handleAddAssignment = (category: ModifiedCategory) => {
    openAddSheet(category.groupID)
  }

  const handleResetCategory = (category: ModifiedCategory) => {
    removeVirtualAssignmentsForCategory(category.groupID)
  }

  const handleDeleteAssignment = (objectSectionID: number) => {
    removeVirtualAssignment(objectSectionID)
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: 'All Grades',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#fff',
        }}
      />
      <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
        <ScrollView className="flex-1 px-4 pt-6">
          <GenericGradeCard
            courseName={courseName}
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
                trackColor={{ false: '#44403c', true: '#f59e0b' }}
                thumbColor="#fff"
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
              <Text className="text-stone-100 text-2xl font-bold mb-4">Categories</Text>
              {modifiedCategories && modifiedCategories.length > 0 ? (
                <View className="mb-20">
                  {modifiedCategories.map((category, index) => (
                    <CategoryAccordion
                      key={category.groupID}
                      category={category}
                      allCategories={modifiedCategories}
                      isWeighted={isWeighted}
                      editMode={editMode}
                      defaultExpanded={index === 0}
                      onScoreChange={handleScoreChange}
                      onDropGrade={handleDropGrade}
                      onAddAssignment={handleAddAssignment}
                      onResetCategory={handleResetCategory}
                      onDeleteAssignment={handleDeleteAssignment}
                    />
                  ))}
                </View>
              ) : (
                <View className="border border-stone-700 rounded-2xl p-5">
                  <Text className="text-stone-400 text-center text-lg">
                    No categories found
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <AddAssignmentSheet />
    </>
  )
}
