import { View, Text, Pressable, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState, useCallback, useMemo } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { MenuView } from '@react-native-menu/menu'
import { GradeCard } from './GradeCard'
import { ModifiedCategory, ModifiedAssignment, calculatePercentImpact } from '@/utils/grade-calculator'

type CategoryAccordionProps = {
  category: ModifiedCategory
  allCategories: ModifiedCategory[]
  isWeighted: boolean
  defaultExpanded?: boolean
  onEditGrade: (assignment: ModifiedAssignment) => void
  onDropGrade: (assignment: ModifiedAssignment) => void
  onResetGrade: (objectSectionID: number) => void
  onAddAssignment: (category: ModifiedCategory) => void
  onResetCategory: (category: ModifiedCategory) => void
  onDeleteAssignment: (objectSectionID: number) => void
  onRenameAssignment: (assignment: ModifiedAssignment) => void
}

export function CategoryAccordion({ 
  category, 
  allCategories,
  isWeighted, 
  defaultExpanded = false,
  onEditGrade,
  onDropGrade,
  onResetGrade,
  onAddAssignment,
  onResetCategory,
  onDeleteAssignment,
  onRenameAssignment,
}: CategoryAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [contentHeight, setContentHeight] = useState(0)
  const animatedHeight = useSharedValue(defaultExpanded ? 1 : 0)
  const rotation = useSharedValue(defaultExpanded ? 180 : 0)

  const { calculatedPercent, originalPercent, hasModifications } = useMemo(() => {
    const gradedAssignments = category.assignments.filter(
      a => a.score !== null && !a.dropped && !a.notGraded
    )
    
    if (gradedAssignments.length === 0) {
      return { calculatedPercent: null, originalPercent: category.progress?.progressPercent ?? null, hasModifications: false }
    }
    
    let pointsEarned = 0
    let totalPoints = 0
    
    for (const assignment of gradedAssignments) {
      const score = parseFloat(assignment.score || '0')
      pointsEarned += score * assignment.multiplier
      totalPoints += assignment.totalPoints * assignment.multiplier
    }
    
    const percent = totalPoints > 0 ? (pointsEarned / totalPoints) * 100 : 0
    const origPercent = category.progress?.progressPercent ?? null
    const hasMods = category.assignments.some(a => a.isModified)
    
    return { 
      calculatedPercent: Math.round(percent * 100) / 100, 
      originalPercent: origPercent,
      hasModifications: hasMods
    }
  }, [category])

  const percentChange = useMemo(() => {
    if (!hasModifications || originalPercent === null || calculatedPercent === null) return null
    return Math.round((calculatedPercent - originalPercent) * 100) / 100
  }, [hasModifications, originalPercent, calculatedPercent])

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
    if (calculatedPercent === null) return 'text-stone-400'
    if (hasModifications) return 'text-yellow-400'
    return 'text-emerald-500'
  }

  const getChangeColor = () => {
    if (percentChange === null || percentChange === 0) return 'text-stone-500'
    if (percentChange > 0) return 'text-green-400'
    return 'text-red-400'
  }

  const formatChange = () => {
    if (percentChange === null || percentChange === 0) return null
    return percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`
  }

  const assignmentsWithImpact = category.assignments.map((assignment) => {
    const percentImpact = calculatePercentImpact(assignment, allCategories, isWeighted)
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

  const displayPercent = calculatedPercent ?? (category.progress?.progressPercent ?? null)

  return (
    <View className="bg-stone-800 rounded-2xl mb-4 overflow-hidden">
      <View className="flex-row items-center p-5">
        <Pressable onPress={toggleExpanded} className="flex-row items-center flex-1">
          <Animated.View style={animatedChevronStyle} className="mr-3">
            <Ionicons name="chevron-down" size={24} color="#a8a29e" />
          </Animated.View>
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
              {formatChange() && (
                <View className="flex-row items-center">
                  <Text className={`text-sm font-medium ${getChangeColor()}`}>
                    {formatChange()}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {displayPercent !== null && (
            <View className="items-center">
              <Text className={`text-2xl font-bold ${getProgressColor()}`}>
                {displayPercent}%
              </Text>
            </View>
          )}
        </Pressable>
        <MenuView
          onPressAction={({ nativeEvent }) => {
            switch (nativeEvent.event) {
              case 'add':
                onAddAssignment(category)
                break
              case 'reset':
                onResetCategory(category)
                break
            }
          }}
          actions={[
            { id: 'add', title: 'Add Assignment', image: 'plus.circle', imageColor: 'black' },
            { id: 'reset', title: 'Reset Category', image: 'arrow.counterclockwise', imageColor: 'red', attributes: { destructive: true } },
          ]}
        >
          <TouchableOpacity className="pl-3 py-2">
            <Ionicons name="ellipsis-vertical" size={22} color="#78716c" />
          </TouchableOpacity>
        </MenuView>
      </View>

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
                isModified={assignment.isModified}
                isVirtual={assignment.objectSectionID < 0}
                onEditGrade={() => onEditGrade(assignment)}
                onDropGrade={() => onDropGrade(assignment)}
                onResetGrade={() => onResetGrade(assignment.objectSectionID)}
                onDeleteAssignment={() => onDeleteAssignment(assignment.objectSectionID)}
                onRenameAssignment={() => onRenameAssignment(assignment)}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  )
}
