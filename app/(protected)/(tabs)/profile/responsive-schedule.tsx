import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import dayjs from 'dayjs'
import { useGrades, useResponsiveSchedule } from '@/hooks/use-ic'

function formatSessionDate(startDate: number, endDate: number) {
  const start = dayjs(startDate)
  const end = dayjs(endDate)

  if (!start.isValid()) return 'Unknown date'
  if (!end.isValid() || start.isSame(end, 'day')) {
    return start.format('MMM D, YYYY')
  }
  return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
}

export default function ResponsiveSchedule() {
  const { data: grades } = useGrades()
  const sectionID = grades?.[0]?.sectionID
  const calendarID = grades?.[0]?.calendarID
  const structureID = grades?.[0]?.structureID
  const { data: sessions, isLoading, isFetching, error, refetch } = useResponsiveSchedule(sectionID, calendarID, structureID)
  const [query, setQuery] = useState('')
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | null>(null)

  const filteredSessions = useMemo(() => {
    if (!sessions) return []
    const normalizedQuery = query.trim().toLowerCase()

    return sessions
      .map((session) => {
        const offerings = (session.offerings || []).filter((offering) => {
          const teacher = offering.teacherDisplay?.toLowerCase() || ''
          const name = offering.responsiveOfferingName?.toLowerCase() || ''
          return normalizedQuery.length === 0 || teacher.includes(normalizedQuery) || name.includes(normalizedQuery)
        })
        return { ...session, offerings }
      })
      .filter((session) => session.offerings.length > 0)
  }, [sessions, query])

  if (!sectionID) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center" edges={['top']}>
        <Text className="text-white text-lg">No course data available yet.</Text>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    )
  }

  const isEmpty = sessions && sessions.length === 0

  return (
    <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
      <ScrollView
        className="flex-1 px-4 pt-8"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="white"
            title="Refreshing..."
            titleColor="white"
          />
        }
      >
        <View className="mb-6">
          {/*<Text className="text-white text-4xl font-bold">Responsive Schedule</Text>}*/}
          {!isEmpty && (
            <Text className="text-stone-500 text-lg font-semibold mt-2">
              {sessions?.length} session{sessions?.length !== 1 ? 's' : ''} available
            </Text>
          )}
        </View>

        {error && (
          <View className="bg-red-900/40 rounded-2xl p-4 mb-4">
            <Text className="text-red-200">Unable to load. Pull to refresh.</Text>
          </View>
        )}

        {isEmpty && (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white text-xl font-medium">No responsive schedules available</Text>
          </View>
        )}

        {!isEmpty && sessions && sessions.length > 0 && (
          <TextInput
            className="bg-stone-800 rounded-2xl p-4 text-white text-base mb-4"
            placeholder="Search by teacher or class"
            placeholderTextColor="#78716c"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {filteredSessions.map((session) => (
          <View key={session.responsiveSessionID} className="mb-4">
            <Text className="text-white text-3xl font-bold">{session.sessionName}</Text>
            <Text className="text-stone-500 text-xl font-semibold mt-1 mb-3">
              {formatSessionDate(session.startDate, session.endDate)} · {session.sessionOpen ? 'Open' : 'Closed'}
            </Text>

            {session.offerings.map((offering) => {
              const isFull = offering.maxStudents > 0 && offering.currentStudents >= offering.maxStudents
              const isSelected = selectedOfferingId === offering.responsiveOfferingID
              return (
                <Pressable
                  key={offering.responsiveOfferingID}
                  onPress={() => setSelectedOfferingId(offering.responsiveOfferingID)}
                  className={`rounded-2xl p-4 mb-3 ${isSelected ? 'bg-stone-700' : 'bg-stone-800'}`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                      <Text className="text-white text-base font-semibold" numberOfLines={2}>{offering.responsiveOfferingName}</Text>
                      <Text className="text-stone-400 mt-1">{offering.teacherDisplay} · Room {offering.roomName || 'TBD'}</Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-sm font-medium ${isFull ? 'text-rose-400' : 'text-green-400'}`}>
                        {offering.currentStudents}/{offering.maxStudents}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )
            })}
          </View>
        ))}

        {!isEmpty && filteredSessions.length === 0 && query.length > 0 && (
          <View className="flex-1 items-center justify-center pt-10">
            <Text className="text-stone-400 text-base">No results for "{query}"</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
