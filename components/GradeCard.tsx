import { View, Text, TouchableOpacity } from 'react-native'
import { CourseGradeAssignment } from '@/api/src/types'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { MenuView } from '@react-native-menu/menu'

type GradeCardProps = {
  assignment: CourseGradeAssignment
  percentImpact?: number
  isModified?: boolean
  isVirtual?: boolean
  onEditGrade?: () => void
  onDropGrade?: () => void
  onResetGrade?: () => void
  onDeleteAssignment?: () => void
  onRenameAssignment?: () => void
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

export function GradeCard({ assignment, percentImpact, isModified, isVirtual, onEditGrade, onDropGrade, onResetGrade, onDeleteAssignment, onRenameAssignment }: GradeCardProps) {
  const router = useRouter()

  const scoreDisplay = assignment.score ?? '—'
  const percentDisplay = assignment.scorePercentage ? `${assignment.scorePercentage}%` : null
  const dateInfo = formatRelativeDate(assignment.scoreModifiedDate)

  const getScoreColor = () => {
    if (assignment.dropped) return 'text-stone-500'
    if (assignment.missing) return 'text-red-400'
    if (!assignment.score) return 'text-stone-500'
    if (isModified) return 'text-yellow-400'
    return 'text-emerald-500'
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

              <Text className="text-stone-500 text-base font-medium">
                {assignment.totalPoints} pts
              </Text>
              {formatImpact() && (
                <Text className={`text-base font-medium ${isModified ? 'text-yellow-400' : getImpactColor()}`}>
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
            <MenuView
              onPressAction={({ nativeEvent }) => {
                switch (nativeEvent.event) {
                  case 'edit':
                    onEditGrade?.()
                    break
                  case 'drop':
                    onDropGrade?.()
                    break
                  case 'reset':
                    onResetGrade?.()
                    break
                  case 'delete':
                    onDeleteAssignment?.()
                    break
                  case 'rename':
                    onRenameAssignment?.()
                    break
                  case 'view':
                    router.push({
                      pathname: '/(protected)/assignment-modal',
                      params: {
                        objectSectionID: assignment.objectSectionID.toString(),
                        assignmentName: assignment.assignmentName,
                      },
                    })
                    break
                }
              }}
              actions={isVirtual ? [
                { id: 'edit', title: 'Edit Score', image: 'pencil', imageColor: 'black' },
                { id: 'drop', title: assignment.dropped ? 'Undrop' : 'Drop', image: assignment.dropped ? 'arrow.uturn.backward' : 'minus.circle', imageColor: 'black' },
                { id: 'rename', title: 'Rename', image: 'character.cursor.ibeam', imageColor: 'black' },
                { id: 'delete', title: 'Delete', image: 'trash', imageColor: 'red', attributes: { destructive: true } },
              ] : [
                {
                  id: 'whatif',
                  title: 'What-If Grades',
                  image: 'slash.circle',
                  imageColor: 'black',
                  subactions: [
                    { id: 'edit', title: 'Edit', image: 'pencil', imageColor: 'black' },
                    { id: 'drop', title: assignment.dropped ? 'Undrop' : 'Drop', image: assignment.dropped ? 'arrow.uturn.backward' : 'trash', imageColor: 'black' },
                    { id: 'reset', title: 'Reset Grade', image: 'arrow.counterclockwise', imageColor: 'red', attributes: { destructive: true } },
                  ],
                },
                { id: 'view', title: 'View Assignment', image: 'doc.text', imageColor: 'black' },
              ]}
            >
              <TouchableOpacity className="pl-2 py-2">
                <Ionicons name="ellipsis-vertical" size={22} color="#78716c" />
              </TouchableOpacity>
            </MenuView>
          </View>
        </View>

    </View>
  )
}
