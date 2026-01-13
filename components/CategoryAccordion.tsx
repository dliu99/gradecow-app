import { View, Text, Pressable } from 'react-native'
import { CourseGradeCategory, CourseGradeAssignment } from '@/api/src/types'
import { Ionicons } from '@expo/vector-icons'
import { useState, useCallback } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { GradeCard } from './GradeCard'

type CategoryAccordionProps = {
  category: CourseGradeCategory
  isWeighted: boolean
  totalCoursePoints: number
  defaultExpanded?: boolean
}

type AssignmentWithImpact = CourseGradeAssignment & {
  percentImpact: number
}

export function CategoryAccordion({ 
  category, 
  isWeighted, 
  totalCoursePoints,
  defaultExpanded = false 
}: CategoryAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [contentHeight, setContentHeight] = useState(0)
  const animatedHeight = useSharedValue(defaultExpanded ? 1 : 0)
  const rotation = useSharedValue(defaultExpanded ? 180 : 0)

  const toggleExpanded = useCallback(() => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    animatedHeight.value = withTiming(newExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    })
    rotation.value = withTiming(newExpanded ? 180 : 0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    })
  }, [expanded, animatedHeight, rotation])

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value * contentHeight,
    opacity: animatedHeight.value,
    overflow: 'hidden',
  }))

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const onContentLayout = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    const height = event.nativeEvent.layout.height
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height)
      if (expanded) {
        animatedHeight.value = 1
      }
    }
  }, [contentHeight, expanded, animatedHeight])

  const getProgressColor = () => {
    const percent = category.progress?.progressPercent
    if (percent === null || percent === undefined) return 'text-stone-400'
    //if (percent >= 90) return 'text-green-400'
    if (percent >= 80) return 'text-green-400'
    if (percent >= 70) return 'text-yellow-400'
    if (percent >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const categoryTotalPoints = category.assignments.reduce(
    (sum, a) => sum + (a.dropped ? 0 : a.totalPoints), 
    0
  )

  const assignmentsWithImpact: AssignmentWithImpact[] = category.assignments.map((assignment) => {
    let percentImpact = 0
    
    if (assignment.score !== null && !assignment.dropped) {
      const scorePercent = parseFloat(assignment.scorePercentage || '0')
      const deviation = scorePercent - 100
      
      if (isWeighted && categoryTotalPoints > 0) {
        percentImpact = (deviation / 100) * (assignment.totalPoints / categoryTotalPoints) * category.weight
      } else if (totalCoursePoints > 0) {
        percentImpact = (deviation / 100) * (assignment.totalPoints / totalCoursePoints) * 100
      }
    }
    
    return {
      ...assignment,
      percentImpact: Math.round(percentImpact * 100) / 100,
    }
  })

  const sortedAssignments = [...assignmentsWithImpact].sort((a, b) => {
    const dateA = a.scoreModifiedDate || a.dueDate
    const dateB = b.scoreModifiedDate || b.dueDate
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  return (
    <View className="bg-stone-800 rounded-2xl mb-4 overflow-hidden">
      <Pressable 
        onPress={toggleExpanded}
        className="p-5"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-4">
            <Text className="text-white text-xl font-semibold" numberOfLines={2}>
              {category.name}
            </Text>
            <View className="flex-row items-center mt-2 gap-3">
              {category.weight > 0 && (
                <View className="bg-stone-700 px-2.5 py-1 rounded-lg">
                  <Text className="text-stone-300 text-sm font-medium">
                    {category.weight}%
                  </Text>
                </View>
              )}
              <Text className="text-stone-500 text-base">
                {category.assignments.length} assignment{category.assignments.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            {category.progress?.progressPercent !== null && category.progress?.progressPercent !== undefined && (
              <View className="items-center">
                <Text className={`text-2xl font-bold ${getProgressColor()}`}>
                  {category.progress.progressScore ?? '—'}
                </Text>
                <Text className={`text-lg font-medium ${getProgressColor()}`}>
                  {Math.round(category.progress.progressPercent * 100) / 100}%
                </Text>
              </View>
            )}
            <Animated.View style={animatedChevronStyle} className="pl-2"> 
              <Ionicons name="chevron-down" size={24} color="#a8a29e" />
            </Animated.View>
          </View>
        </View>
      </Pressable>

      <Animated.View style={animatedContainerStyle}>
        <View 
          onLayout={onContentLayout}
          style={{ position: expanded ? 'relative' : 'absolute', width: '100%' }}
        >
          <View className="">
            {sortedAssignments.map((assignment) => (
              <GradeCard
                key={assignment.objectSectionID}
                assignment={assignment}
                percentImpact={assignment.percentImpact}
                onEditGrade={() => console.log('Edit', assignment.assignmentName)}
                onDropGrade={() => console.log('Drop/Undrop', assignment.assignmentName)}
                onResetGrade={() => console.log('Reset', assignment.assignmentName)}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  )
}


