import { View, Text, Pressable, useWindowDimensions } from 'react-native'
import { Assignment } from '@/api/src/types'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useRouter } from 'expo-router'

type AssignmentHeatmapProps = {
  assignments: Assignment[]
  courseNameMap: Map<number, string>
  currentDate: dayjs.Dayjs
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-stone-800'
  if (count === 1) return 'bg-emerald-900'
  if (count === 2) return 'bg-emerald-700'
  if (count === 3) return 'bg-emerald-500'
  return 'bg-emerald-400'
}

export function AssignmentHeatmap({ assignments, courseNameMap, currentDate }: AssignmentHeatmapProps) {
  const { width } = useWindowDimensions()
  const router = useRouter()

  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, Assignment[]>()
    for (const assignment of assignments) {
      const dateKey = dayjs(assignment.dueDate).startOf('day').format('YYYY-MM-DD')
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(assignment)
    }
    return map
  }, [assignments])

  const calendarDays = useMemo(() => {
    const startOfMonth = currentDate.startOf('month')
    const endOfMonth = currentDate.endOf('month')
    const startDayOfWeek = startOfMonth.day()
    const daysInMonth = endOfMonth.date()

    const days: { date: dayjs.Dayjs | null; dateKey: string | null }[] = []

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, dateKey: null })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = startOfMonth.date(day)
      days.push({ date, dateKey: date.format('YYYY-MM-DD') })
    }

    const remainingCells = 7 - (days.length % 7)
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        days.push({ date: null, dateKey: null })
      }
    }

    return days
  }, [currentDate])

  const cellSize = (width - 32 - 24) / 7
  const gap = 4

  return (
    <View className="mb-8">
      <View className="rounded-2xl p-4 border border-stone-700">
        <View className="flex-row mb-2">
          {WEEKDAYS.map((day, index) => (
            <View key={index} style={{ width: cellSize }} className="items-center">
              <Text className="text-stone-500 text-xs font-medium">{day}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap" style={{ gap }}>
          {calendarDays.map((day, index) => {
            const count = day.dateKey ? assignmentsByDate.get(day.dateKey)?.length ?? 0 : 0
            const isToday = day.dateKey === currentDate.format('YYYY-MM-DD')
            const hasAssignments = count > 0

            return (
              <Pressable
                key={index}
                onPress={() => hasAssignments && day.dateKey && router.push(`/(protected)/day-modal?date=${day.dateKey}`)}
                style={{ width: cellSize - gap, height: cellSize - gap }}
                className={`rounded-lg items-center active:scale-[0.97] active:opacity-80 justify-center ${day.date ? getIntensityClass(count) : 'bg-transparent'} ${isToday ? 'border-2 border-stone-700' : ''}`}
              >
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

