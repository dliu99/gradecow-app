import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useAssignment } from '@/hooks/use-ic'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

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

function formatDueText(daysUntil: number): { text: string; color: string } {
  if (daysUntil < 0) {
    const daysPast = Math.abs(daysUntil)
    return { text: `${daysPast} day${daysPast === 1 ? '' : 's'} ago`, color: 'text-red-400' }
  }
  if (daysUntil === 0) {
    return { text: 'today', color: 'text-yellow-400' }
  }
  if (daysUntil === 1) {
    return { text: 'tomorrow', color: 'text-green-500' }
  }
  return { text: `in ${daysUntil} days`, color: 'text-green-500' }
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
  const scoreData = assignment?.scores?.[0]
  const totalPoints = assignment?.gradingAlignments?.[0]?.totalPoints

  const daysUntil = endDate ? endDate.startOf('day').diff(dayjs().startOf('day'), 'day') : null
  const dueInfo = daysUntil !== null ? formatDueText(daysUntil) : null

  const scorePoints = scoreData?.scorePoints
  const scorePercentage = scoreData?.scorePercentage ? parseFloat(scoreData.scorePercentage).toFixed(2) : null
  const hasScore = scorePoints != null && scorePoints !== ''
  const hasTotalPoints = totalPoints != null
  const hasPercent = scorePercentage != null

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
          <ScrollView className="flex-1 px-4 pt-8">
            {scoreData && (
              <View className=" rounded-2xl p-5 mb-4 border border-stone-700">
                <Text className="text-stone-500 text-lg font-semibold mb-2">
                  Grade
                </Text>
                <View className="flex-row items-baseline">
                  {hasScore && hasTotalPoints ? (
                    <>
                      <Text className="text-white text-4xl font-bold">
                        {scorePoints}/{totalPoints}
                      </Text>
                      {hasPercent && (
                        <Text className="text-green-500 text-xl font-semibold ml-3">
                          ({scorePercentage}%)
                        </Text>
                      )}
                    </>
                  ) : hasScore ? (
                    <>
                      <Text className="text-white text-4xl font-bold">
                        {scorePoints}
                      </Text>
                      {hasPercent && (
                        <Text className="text-green-500 text-xl font-semibold ml-3">
                          ({scorePercentage}%)
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text className="text-stone-400 text-2xl font-bold">
                      Not graded
                    </Text>
                  )}
                </View>
                {assignment?.modifiedDate && (
                  <Text className="text-stone-500 text-sm mt-3">
                    Updated {dayjs(assignment.modifiedDate).fromNow()} at {dayjs(assignment.modifiedDate).format('h:mm A')}
                  </Text>
                )}
              </View>
            )}

            <View className="rounded-2xl p-5 mb-4 border border-stone-700">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-stone-500 text-lg font-semibold">Due</Text>
                {dueInfo && (
                  <Text className={`${dueInfo.color} text-lg font-semibold`}>
                    {dueInfo.text}
                  </Text>
                )}
              </View>
              <Text className="text-white text-2xl font-bold">
                {endDate ? endDate.format('dddd, MMM D') : '—'}
              </Text>
              <Text className="text-stone-400 text-base mt-1">
                at {endDate ? endDate.format('h:mm A') : '—'}
              </Text>
              <Text className="text-stone-500 text-sm mt-3">
                Assigned {startDate ? startDate.format('MMM D, h:mm A') : '—'}
              </Text>
            </View>

            {description?.content && (
              <View className="rounded-2xl p-5 mb-10 border border-stone-700">
                <Text className="text-stone-500 text-lg font-semibold mb-2">
                  Description
                </Text>
                <Text className="text-white text-base leading-relaxed">
                  {stripHtml(description.content)}
                </Text>
              </View>
            )}

            {!scoreData && !description?.content && (
              <View className="bg-stone-800/50 rounded-2xl p-5 mb-4 border border-stone-700">
                <Text className="text-stone-500 text-center">
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
