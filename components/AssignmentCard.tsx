import { View, Text, Pressable } from 'react-native'
import { Assignment } from '@/api/src/types'
import dayjs from 'dayjs'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

type AssignmentCardProps = {
  assignment: Assignment
  courseName?: string
  compact?: boolean
  now: dayjs.Dayjs
}

function formatRelativeTime(dueDate: dayjs.Dayjs, now: dayjs.Dayjs): string {
  const diffHours = dueDate.diff(now, 'hour')
  const diffDays = dueDate.startOf('day').diff(now.startOf('day'), 'day')
  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d ago`
  }
  if (diffHours < 1) {
    const diffMinutes = dueDate.diff(now, 'minute')
    if (diffMinutes <= 0) return 'now'
    return `in ${diffMinutes}m`
  }

  if (diffHours < 24 && diffDays === 0) {
    return `in ${diffHours}h`
  }

  if (diffDays === 0) {
    return 'today'
  }

  if (diffDays === 1) {
    return 'in 1d'
  }

  return `in ${diffDays}d`
}



export function AssignmentCard({ assignment, courseName, compact, now }: AssignmentCardProps) {
  const router = useRouter()
  const dueDate = dayjs(assignment.dueDate)
  const relativeTime = formatRelativeTime(dueDate, now)

  const handlePress = () => {
    router.push({
      pathname: '/(protected)/assignment-modal',
      params: {
        objectSectionID: assignment.objectSectionID.toString(),
        assignmentName: assignment.assignmentName,
      },
    })
  }

  

  return (
    <Pressable onPress={handlePress} className="bg-stone-800 rounded-2xl p-5 mb-4">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-4">
          <Text className="text-white text-xl font-semibold leading-snug" numberOfLines={2}>
            {assignment.assignmentName}
          </Text>
          {courseName && (
            <Text className="text-stone-400 text-base mt-2" numberOfLines={1}>
              {courseName}
            </Text>
          )}
          {assignment.totalPoints && (
            <Text className="text-stone-500 text-base mt-1">{assignment.totalPoints} pts • {relativeTime.endsWith('ago') ? <Text className="text-red-500 text-base">{relativeTime}</Text> : <Text className="text-green-500 text-base">{relativeTime}</Text>} <Text className="text-stone-500 text-base">@ {dueDate.format('h:mm A')}</Text></Text>
            )}
          </View>
          <View className="items-center justify-center">
            <Ionicons name="arrow-forward" size={24} color="#ffffff" />
          </View>
        </View>
      </Pressable>
    )
  }
