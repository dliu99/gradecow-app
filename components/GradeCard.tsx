import { View, Text, Pressable } from 'react-native'
import { CourseGradeAssignment } from '@/api/src/types'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Button, ContextMenu, Host, Submenu } from '@expo/ui/swift-ui'

type GradeCardProps = {
  assignment: CourseGradeAssignment
  percentImpact?: number
  onEditGrade?: () => void
  onDropGrade?: () => void
  onResetGrade?: () => void
}

const formatRelativeDate = (dateString: string | null) => {
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
  
  return { relativeStr, timeStr }
}

export function GradeCard({ assignment, percentImpact, onEditGrade, onDropGrade, onResetGrade }: GradeCardProps) {
  const router = useRouter()

  const handlePress = () => {
    router.push({
      pathname: '/(protected)/assignment-modal',
      params: {
        objectSectionID: assignment.objectSectionID.toString(),
        assignmentName: assignment.assignmentName,
      },
    })
  }

  const scoreDisplay = assignment.score ?? '—'
  const percentDisplay = assignment.scorePercentage ? `${assignment.scorePercentage}%` : null
  const dateInfo = formatRelativeDate(assignment.scoreModifiedDate)

  const getScoreColor = () => {
    if (assignment.dropped) return 'text-stone-500'
    if (assignment.missing) return 'text-red-400'
    if (!assignment.score) return 'text-stone-500'
    const percent = parseFloat(assignment.scorePercentage || '0')
    //if (percent >= 90) return 'text-green-400'
    if (percent >= 80) return 'text-green-400'
    if (percent >= 70) return 'text-yellow-400'
    if (percent >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const getImpactColor = () => {
    if (percentImpact === undefined || percentImpact === 0) return 'text-stone-500'
    if (percentImpact > 0) return 'text-green-400'
    return 'text-red-400'
  }

  const formatImpact = () => {
    if (percentImpact === undefined) return null
    if (percentImpact === 0) return '0%'
    const rounded = Math.round(percentImpact * 100) / 100
    return percentImpact > 0 ? `+${rounded}%` : `${rounded}%`
  }

  return (
    <View className="bg-stone-800 rounded-2xl mb-3 overflow-hidden">

        <View className="flex-row justify-between items-center p-5">
          <View className="flex-1 mr-4">
            <Text 
              className={`text-xl font-semibold leading-snug ${assignment.dropped ? 'text-stone-500 line-through' : 'text-white'}`} 
              numberOfLines={2}
            >
              {assignment.assignmentName}
            </Text>
            <View className="flex-row items-center mt-2 gap-2 flex-wrap">
              {assignment.missing && (
                <View className="bg-red-500/20 px-2 py-0.5 rounded">
                  <Text className="text-red-400 text-sm font-medium">Missing</Text>
                </View>
              )}
              {assignment.late && (
                <View className="bg-orange-500/20 px-2 py-0.5 rounded">
                  <Text className="text-orange-400 text-sm font-medium">Late</Text>
                </View>
              )}
              {assignment.dropped && (
                <View className="bg-stone-600/30 px-2 py-0.5 rounded">
                  <Text className="text-stone-400 text-sm font-medium">Dropped</Text>
                </View>
              )}
              <Text className="text-stone-500 text-base font-medium">
                {assignment.totalPoints} pts
              </Text>
              {formatImpact() && (
                <Text className={`text-base font-medium ${getImpactColor()}`}>
                  {formatImpact()}
                </Text>
              )}
            </View>
            {dateInfo && (
              <Text className="text-stone-500 text-sm mt-1">
                {dateInfo.relativeStr} at {dateInfo.timeStr}
              </Text>
            )}
          </View>
          <View className="flex-row items-center">
            <View className="items-end">
              <Text className={`text-2xl font-bold ${getScoreColor()}`}>
                {scoreDisplay} / {assignment.totalPoints}
              </Text>
              {percentDisplay && (
                <Text className={`text-lg font-medium ${getScoreColor()}`}>
                  {Math.round(parseFloat(percentDisplay) * 100) / 100}%
                </Text>
              )}
            </View>
            <Host>
              <ContextMenu>
                <ContextMenu.Items>
                  <Submenu button={<Button systemImage="pencil" onPress={() => onEditGrade?.()}>What-If Grades</Button>}>
                  <Button
                    systemImage="pencil"
                    onPress={() => onEditGrade?.()}>
                      Edit</Button>
                  <Button
                    systemImage={assignment.dropped ? 'arrow.uturn.backward' : 'trash'}
                    onPress={() => onDropGrade?.()}>
                      {assignment.dropped ? 'Undrop' : 'Drop'}</Button>
                  <Button
                    systemImage="arrow.counterclockwise"
                    role="destructive"
                    onPress={() => onResetGrade?.()}>
                      
                      Reset Grade</Button>
                  </Submenu>
                  
                      <Button
                    systemImage="doc.text"
                    onPress={() => onResetGrade?.()}>
                      View Assignment</Button>
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <View className="pl-2">
                    <Ionicons name="ellipsis-vertical" size={22} color="#78716c" />
                  </View>
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>
          </View>
        </View>

    </View>
  )
}

