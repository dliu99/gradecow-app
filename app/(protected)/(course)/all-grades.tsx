import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useCourseGrade } from '@/hooks/use-ic'
import { CategoryAccordion } from '@/components/CategoryAccordion'
import { useMemo } from 'react'
import { Button, ContextMenu, Host } from '@expo/ui/swift-ui'

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

  const { isWeighted, totalCoursePoints } = useMemo(() => {
    if (!courseData?.categories) return { isWeighted: false, totalCoursePoints: 0 }
    
    const weighted = courseData.task.groupWeighted
    const total = courseData.categories.reduce((sum, cat) => {
      return sum + cat.assignments.reduce((catSum, a) => catSum + (a.dropped ? 0 : a.totalPoints), 0)
    }, 0)
    
    return { isWeighted: weighted, totalCoursePoints: total }
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

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: 'All Grades',
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
              <View className="flex-1 mr-4">
                <Text className="text-white text-xl font-semibold" numberOfLines={2}>
                  {courseName}
                </Text>
                <Text className="text-stone-400 text-base mt-1">{taskName}</Text>
              </View>
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
              <Text className="text-white text-3xl font-bold mb-4">Categories</Text>
              {courseData?.categories && courseData.categories.length > 0 ? (
                <View className="mb-20">
                  {courseData.categories.map((category, index) => (
                    <CategoryAccordion
                      key={category.groupID}
                      category={category}
                      isWeighted={isWeighted}
                      totalCoursePoints={totalCoursePoints}
                      defaultExpanded={index === 0}
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
    </>
  )
}

