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

  const getGradeColor = () => {
    if (hasModifications) return 'text-amber-400'
    return 'text-green-400'
  }

  return (
    <View className="rounded-2xl p-5 border border-stone-700 mb-6">
      <Text className="text-stone-400 text-lg   mb-4 tracking-medium">
        {taskName}
      </Text>
      
      <View className="flex-row items-end justify-between items-center">
        <View>
          <Text className={`text-5xl font-bold ${getGradeColor()}`}>
            {displayPercent !== null ? `${Math.round(displayPercent * 100) / 100}%` : '—'}
          </Text>
        </View>
        
        {formatChange() && (
          <View className={`flex-row items-center px-2 py-1 rounded-md ${percentChange! > 0 ? 'bg-green-600' : 'bg-red-600'}`}>

            <Text className={`text-base font-semibold ml-1 text-white text-lg`}>
              {formatChange()}
            </Text>
          </View>
        )}
      </View>

      {courseName && (
        <Text className="text-stone-400 text-base mt-4" numberOfLines={1}>
          {courseName}
        </Text>
      )}
    </View>
  )
}
