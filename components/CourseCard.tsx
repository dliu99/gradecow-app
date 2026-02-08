import { View, Text, Pressable } from 'react-native'
import { ExtractedCourse } from '@/api/src/types'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

type CourseCardProps = {
  course: ExtractedCourse
  lastUpdated?: string | null
  recentImpact?: number
}

const formatRelativeDate = (dateString: string | null | undefined) => {
  if (!dateString) return null
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  
  let relativeStr = ''
  if (diffDays > 0) {
    relativeStr = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  } else if (diffHours > 0) {
    relativeStr = diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
  } else if (diffMinutes > 0) {
    relativeStr = diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`
  } else {
    relativeStr = 'just now'
  }
  
  return `${relativeStr} at ${timeStr}`
}

export function CourseCard({ course, lastUpdated, recentImpact }: CourseCardProps) {
  const router = useRouter()

  const handlePress = () => {
    router.push({
      pathname: '/(protected)/(course)',
      params: {
        sectionID: course.sectionID.toString(),
        courseName: course.courseName,
        teacher: course.teacher,
        score: course.score ?? '',
        percent: course.percent?.toString() ?? '',
        termName: course.termName,
        taskName: course.taskName,
      },
    })
  }
  /*
  const getScoreColor = () => {
    if (!course.percent) return 'text-stone-400'
    //if (course.percent >= 90) return 'text-green-400'
    if (course.percent >= 80) return 'text-green-400'
    if (course.percent >= 70) return 'text-yellow-400'
    if (course.percent >= 60) return 'text-orange-400'
    return 'text-red-400'
  }*/

  const getImpactColor = () => {
    if (recentImpact === undefined || recentImpact === 0) return 'text-stone-500'
    if (recentImpact > 0) return 'text-green-400'
    return 'text-red-400'
  }

  const formatImpact = () => {
    if (recentImpact === undefined) return null
    if (recentImpact === 0) return '0%'
    const rounded = Math.round(recentImpact * 100) / 100
    return recentImpact > 0 ? `+${rounded}%` : `${rounded}%`
  }

  const dateDisplay = formatRelativeDate(lastUpdated)

  return (
    <Pressable onPress={handlePress} className="rounded-2xl p-5 border border-stone-700 mb-4 active:scale-[0.97] active:opacity-80">
      <View className="flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          <Text className="text-stone-100 text-2xl mb-2 font-semibold leading-snug" numberOfLines={2}>
            {course.courseName}
          </Text>
          {dateDisplay ? (
            <View className="flex-row items-center">
              {dateDisplay.includes('hour') || dateDisplay.includes('minute') ? (
                <Text className="text-base font-medium">
                  <Text className="text-green-400">{dateDisplay.split(' at ')[0]}</Text>
                  <Text className="text-stone-500">{' at ' + dateDisplay.split(' at ')[1]}</Text>
                </Text>
              ) : (
                <Text className="text-stone-500 text-base">
                  {dateDisplay}
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-stone-500 text-base mt-1">{course.termName}</Text>
          )}
        </View>
        <View className="flex-col items-end  justify-center">
          
            <Text className={`text-2xl font-bold text-stone-100 bg-stone-900`}>
              {course.score ?? '-'} ({course.percent !== undefined ? `${course.percent}%` : '-'})
              
            </Text>
            <Text>
            {formatImpact() ? 
            (
              getImpactColor() === 'text-green-400' ? (
                <Text className={`${getImpactColor()}`}><Ionicons name="caret-up-outline" className={`${getImpactColor()}`} /></Text>
              ) : getImpactColor() === 'text-red-400' ? (
                <Text className={`${getImpactColor()}`}><Ionicons name="caret-down-outline" className={`${getImpactColor()}`} /></Text>
              ) : null
            ) : null}
            {formatImpact() && (
            <Text className={`${getImpactColor()} text-base`}>({formatImpact()}) </Text>)}
            </Text>

        </View>

      </View>
    </Pressable>
  )
}
