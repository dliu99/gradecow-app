import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useCourseGrade } from '@/hooks/use-ic'
import { CategoryAccordion } from '@/components/CategoryAccordion'
import { GenericGradeCard } from '@/components/GenericGradeCard'
import { AddAssignmentSheet } from '@/components/AddAssignmentSheet'
import { RenameAssignmentSheet } from '@/components/RenameAssignmentSheet'
import { useMemo } from 'react'
import { MenuView } from '@react-native-menu/menu'
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

  const { modifications, virtualAssignments, openEditSheet, toggleDrop, resetGrade, resetAll, openAddSheet, removeVirtualAssignmentsForCategory, removeVirtualAssignment, openRenameSheet } = useWhatIf()

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

  const handleEditGrade = (assignment: ModifiedAssignment) => {
    openEditSheet(assignment)
  }

  const handleDropGrade = (assignment: ModifiedAssignment) => {
    toggleDrop(assignment.objectSectionID, assignment.dropped ?? false)
  }

  const handleResetGrade = (objectSectionID: number) => {
    resetGrade(objectSectionID)
  }

  const handleAddAssignment = (category: ModifiedCategory) => {
    openAddSheet(category.groupID)
  }

  const handleResetCategory = (category: ModifiedCategory) => {
    category.assignments.forEach(assignment => {
      resetGrade(assignment.objectSectionID)
    })
    removeVirtualAssignmentsForCategory(category.groupID)
  }

  const handleDeleteAssignment = (objectSectionID: number) => {
    removeVirtualAssignment(objectSectionID)
  }

  const handleRenameAssignment = (assignment: ModifiedAssignment) => {
    openRenameSheet(assignment)
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: 'All Grades',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#fff',
          headerRight: () => (
            <MenuView
              onPressAction={({ nativeEvent }) => {
                if (nativeEvent.event === 'reset') resetAll()
              }}
              actions={[
                { id: 'reset', title: 'Reset All', image: 'arrow.counterclockwise', imageColor: 'red', attributes: { destructive: true } },
              ]}
            >
              <TouchableOpacity style={{ padding: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
              </TouchableOpacity>
            </MenuView>
          ),
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
              <Text className="text-white text-3xl font-bold mb-4">Categories</Text>
              {modifiedCategories && modifiedCategories.length > 0 ? (
                <View className="mb-20">
                  {modifiedCategories.map((category, index) => (
                    <CategoryAccordion
                      key={category.groupID}
                      category={category}
                      allCategories={modifiedCategories}
                      isWeighted={isWeighted}
                      defaultExpanded={index === 0}
                      onEditGrade={handleEditGrade}
                      onDropGrade={handleDropGrade}
                      onResetGrade={handleResetGrade}
                      onAddAssignment={handleAddAssignment}
                      onResetCategory={handleResetCategory}
                      onDeleteAssignment={handleDeleteAssignment}
                      onRenameAssignment={handleRenameAssignment}
                    />
                  ))}
                </View>
              ) : (
                <View className="bg-stone-800 rounded-2xl p-5">
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
      <RenameAssignmentSheet />
    </>
  )
}
