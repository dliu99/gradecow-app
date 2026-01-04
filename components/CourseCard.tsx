import { View, Text, Pressable } from 'react-native'
import { ExtractedCourse } from '@/api/src/types'
import { Ionicons } from '@expo/vector-icons'

type CourseCardProps = {
  course: ExtractedCourse
}

export function CourseCard({ course }: CourseCardProps) {
  const handlePress = () => {
  }

  return (
    <Pressable onPress={handlePress} className="bg-stone-800 rounded-2xl p-5 mb-4">
      <View className="flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          <Text className="text-white text-2xl font-semibold leading-snug" numberOfLines={2}>
            {course.courseName}
          </Text>
          <Text className="text-stone-400 text-base mt-2" numberOfLines={1}>
            {course.teacher}
          </Text>
          <Text className="text-stone-500 text-base mt-1">Placeholder</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="items-center">
            <Text className="text-green-500 text-2xl font-semibold">
              {course.score ?? '-'}
            </Text>
            <Text className="text-green-500 text-2xl font-semibold">
              ({course.percent !== undefined ? `${course.percent}%` : '-'})
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="#ffffff" />
        </View>
      </View>
    </Pressable>
  )
}

