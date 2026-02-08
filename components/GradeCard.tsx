import { View, Text, TouchableOpacity, TextInput, Pressable } from 'react-native'
import { CourseGradeAssignment } from '@/api/src/types'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { MenuView } from '@react-native-menu/menu'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

type GradeCardProps = {
  assignment: CourseGradeAssignment
  percentImpact?: number
  isModified?: boolean
  isVirtual?: boolean
  isCategory?: boolean
  editMode?: boolean
  onScoreChange?: (score: string | null) => void
  onTotalPointsChange?: (totalPoints: string | null) => void
  onDropGrade?: () => void
  onDeleteAssignment?: () => void
}

export function GradeCard({ 
  assignment, 
  percentImpact, 
  isModified, 
  isVirtual, 
  isCategory,
  editMode,
  onScoreChange,
  onTotalPointsChange,
  onDropGrade, 
  onDeleteAssignment,
}: GradeCardProps) {
  const router = useRouter()
  const [localScore, setLocalScore] = useState(assignment.score ?? '')
  const [localTotalPoints, setLocalTotalPoints] = useState(assignment.totalPoints?.toString() ?? '')

  useEffect(() => {
    setLocalScore(assignment.score ?? '')
  }, [assignment.score])

  useEffect(() => {
    setLocalTotalPoints(assignment.totalPoints?.toString() ?? '')
  }, [assignment.totalPoints])

  const handleScoreSubmit = () => {
    onScoreChange?.(localScore === '' ? null : localScore)
  }

  const handleTotalPointsSubmit = () => {
    onTotalPointsChange?.(localTotalPoints === '' ? null : localTotalPoints)
  }

  const handlePress = () => {
    if (!isVirtual && !editMode) {
      router.push({
        pathname: '/(protected)/assignment-modal',
        params: {
          objectSectionID: assignment.objectSectionID.toString(),
          assignmentName: assignment.assignmentName,
        },
      })
    }
  }

  const scoreDisplay = assignment.score ?? '—'
  const percentDisplay = assignment.scorePercentage ? `${assignment.scorePercentage}%` : null

  const getScoreColor = () => {
    if (assignment.dropped) return 'text-stone-500'
    if (assignment.missing) return 'text-red-400'
    if (!assignment.score) return 'text-stone-500'
    if (isModified) return 'text-amber-400'
    return 'text-stone-50'
  }

  const getImpactColor = () => {
    if (percentImpact === undefined || percentImpact === 0) return 'text-stone-500'
    if (percentImpact > 0) return 'text-green-400'
    return 'text-red-400'
  }

  const formatImpact = () => {
    if (percentImpact === undefined) return null
    if (percentImpact === 0) return null
    const rounded = Math.round(percentImpact * 100) / 100
    return percentImpact > 0 ? `+${rounded}%` : `${rounded}%`
  }

  const getBorderColor = () => {
    if (isModified) return 'border-amber-500/50'
    return 'border-stone-700'
  }

  const menuActions = isVirtual 
    ? [
        { id: 'drop', title: assignment.dropped ? 'Undrop' : 'Drop', image: assignment.dropped ? 'arrow.uturn.backward' : 'minus.circle', imageColor: 'black' },
        { id: 'delete', title: 'Delete', image: 'trash', imageColor: 'red', attributes: { destructive: true } },
      ]
    : [
        { id: 'drop', title: assignment.dropped ? 'Undrop' : 'Drop', image: assignment.dropped ? 'arrow.uturn.backward' : 'minus.circle', imageColor: 'black' },
      ]

  const showMenu = editMode || isVirtual

  const containerClass = isCategory
    ? `py-3 px-2 ${!editMode && !isVirtual ? 'active:opacity-80' : ''}`
    : `rounded-2xl p-5 border ${getBorderColor()} mb-3 ${!editMode && !isVirtual ? 'active:scale-[0.98] active:opacity-80' : ''}`

  return (
    <Pressable 
      onPress={handlePress}
      className={containerClass}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          <Text 
            className={`text-xl font-semibold leading-snug ${assignment.dropped ? 'text-stone-500 line-through' : 'text-stone-50'}`} 
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
            {isVirtual && (
              <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                <Text className="text-amber-400 text-sm font-medium">Modified</Text>
              </View>
            )}
            <Text className="text-stone-500 text-base">
              {assignment.totalPoints} pts • {assignment.scoreModifiedDate ? dayjs(assignment.scoreModifiedDate).fromNow() : '—'} {formatImpact() && (
              <Text className={`text-base font-medium ${isModified ? 'text-amber-400' : getImpactColor()}`}>
              {formatImpact()}
              </Text>
            )}
            </Text>
            
          </View>
        </View>
        <View className="flex-row items-center justify-center">
          {editMode ? (
            <View className="items-end mr-1 justify-center">
              <View className="flex-row items-center">
                <TextInput
                  className="bg-stone-800 text-stone-50 text-xl font-bold px-3 py-2 rounded-lg w-16 text-center"
                  value={localScore}
                  onChangeText={setLocalScore}
                  onBlur={handleScoreSubmit}
                  onSubmitEditing={handleScoreSubmit}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor="#78716c"
                  returnKeyType="done"
                />
                <Text className="text-stone-500 text-xl font-bold mx-1">/</Text>
                <TextInput
                  className="bg-stone-800 text-stone-500 text-xl font-bold px-3 py-2 rounded-lg w-16 text-center"
                  value={localTotalPoints}
                  onChangeText={setLocalTotalPoints}
                  onBlur={handleTotalPointsSubmit}
                  onSubmitEditing={handleTotalPointsSubmit}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor="#78716c"
                  returnKeyType="done"
                />
              </View>
              {percentDisplay && (
                <Text className={`text-base ${getScoreColor()}`}>
                  {Math.round(parseFloat(percentDisplay) * 100) / 100}%
                </Text>
              )}
            </View>
          ) : (
            <View className="items-end mr-1 justify-center">
              <Text className={`text-xl font-bold ${getScoreColor()}`}>
                {scoreDisplay} / {assignment.totalPoints}
              </Text>
              {percentDisplay && (
                <Text className={`text-base ${getScoreColor()}`}>
                  {Math.round(parseFloat(percentDisplay) * 100) / 100}%
                </Text>
              )}
            </View>
          )}
          {showMenu && (
            <MenuView
              onPressAction={({ nativeEvent }) => {
                switch (nativeEvent.event) {
                  case 'drop':
                    onDropGrade?.()
                    break
                  case 'delete':
                    onDeleteAssignment?.()
                    break
                }
              }}
              actions={menuActions}
            >
              <TouchableOpacity className="pl-3 py-2">
                <Ionicons name="ellipsis-horizontal" size={20} color="#a8a29e" />
              </TouchableOpacity>
            </MenuView>
          )}
          {!showMenu && (
            <Ionicons name="chevron-forward" size={20} color="#78716c" />
          )}
        </View>
      </View>
    </Pressable>
  )
}
