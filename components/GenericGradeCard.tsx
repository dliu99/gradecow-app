import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type CourseGradeCardProps = {
  courseName?: string
  taskName: string
  score?: string | null
  displayPercent: number | null
  percentChange: number | null
  hasModifications: boolean
}

export function GenericGradeCard({
  courseName,
  taskName,
  score,
  displayPercent,
  percentChange,
  hasModifications,
}: CourseGradeCardProps) {
  const getScoreColor = () => {
    //if (hasModifications) return 'text-yellow-400'
    return 'text-emerald-500'
  }

  const getChangeColor = () => {
    if (percentChange === null || percentChange === 0) return 'text-stone-500'
    if (percentChange > 0) return 'text-green-400'
    return 'text-red-400'
  }

  const formatChange = () => {
    if (percentChange === null) return null
    if (percentChange === 0) return null
    return percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`
  }

  return (
    <View className="bg-stone-800 rounded-2xl p-6 mb-6">
      <View className="flex-row items-center justify-between">
        <View className={`flex-1 ${courseName ? 'mr-4' : ''}`}>
          {courseName && (
            <Text className="text-white text-xl font-semibold" numberOfLines={2}>
              {courseName}
            </Text>
          )}
          <Text className={`text-xl ${courseName ? 'text-stone-400 text-base mt-1' : 'text-stone-400 font-medium'}`}>
            {taskName}
          </Text>
          {formatChange() && (
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name={percentChange! > 0 ? 'caret-up-outline' : 'caret-down-outline'} 
                size={14} 
                color={percentChange! > 0 ? '#4ade80' : '#f87171'} 
              />
              <Text className={`text-base font-medium ${getChangeColor()}`}>
                {formatChange()}
              </Text>
            </View>
          )}
        </View>
        <View className="items-center">
          <Text className={`text-2xl font-bold ${getScoreColor()}`}>
            {score ?? '—'}
          </Text>
          {displayPercent !== null && (
            <Text className={`text-2xl font-semibold ${getScoreColor()}`}>
              ({Math.round(displayPercent * 100) / 100}%)
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

