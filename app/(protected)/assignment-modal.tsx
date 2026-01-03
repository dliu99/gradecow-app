import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useAssignment } from '@/hooks/use-ic'
import dayjs from 'dayjs'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export default function AssignmentModal() {
  const router = useRouter()
  const { objectSectionID, assignmentName } = useLocalSearchParams<{
    objectSectionID: string
    assignmentName?: string
  }>()

  const { data: assignment, isLoading, error } = useAssignment(
    objectSectionID ? parseInt(objectSectionID, 10) : 0
  )

  if (!objectSectionID) {
    router.back()
    return null
  }

  const startDate = assignment?.startDate ? dayjs(assignment.startDate) : null
  const endDate = assignment?.endDate ? dayjs(assignment.endDate) : null
  const description = assignment?.curriculumContent?.description
  const score = assignment?.scores?.[0]

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: assignmentName || 'Assignment',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontSize: 18, fontWeight: '600' },
        }}
      />
      <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-red-400 text-center text-lg">
              Failed to load assignment details
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-6">
            {score && (
              <View className="bg-stone-800 rounded-2xl p-5 mb-4">
                <Text className="text-white text-xl font-semibold mb-3">
                  Grade
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-4xl font-bold">
                    {score.score ?? '—'}
                  </Text>
                  {score.totalPoints && (
                    <Text className="text-stone-400 text-xl ml-1">
                      / {score.totalPoints}
                    </Text>
                  )}
                  {score.percent != null && (
                    <Text className="text-emerald-400 text-xl ml-3">
                      {score.percent}%
                    </Text>
                  )}
                </View>
              </View>
            )}

<View className="bg-stone-800 rounded-2xl p-5 mb-4">
  <View className="flex-row items-center justify-between mb-2">
    <Text className="text-white text-xl font-bold">Due</Text>
    <Text className="text-green-400 text-lg font-semibold">in {endDate?.startOf('day').diff(dayjs().startOf('day'), 'day') ?? "-"} days</Text>
  </View>
  <Text className="text-stone-300 text-lg font-semibold">
    {endDate ? endDate.format('dddd, MMM D') : '—'}
  </Text>
  <Text className="text-stone-300 text-base">
    at {endDate ? endDate.format('h:mm A') : '—'}
  </Text>
  <Text className="text-stone-600 text-sm mt-3">
    Assigned {startDate ? startDate.format('MMM D, h:mm A') : '—'}
  </Text>
</View>

            {description?.content && (
              <View className="bg-stone-800 rounded-2xl p-5 mb-10">
                <Text className="text-white text-xl font-bold mb-3">
                  Description
                </Text>
                <Text className="text-stone-300 text-base leading-relaxed">
                  {stripHtml(description.content)}
                </Text>
              </View>
            )}

            {!score && !description?.content && (
              <View className="bg-stone-800 rounded-2xl p-5 mb-4">
                <Text className="text-stone-400 text-center">
                  No additional details available
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  )
}

