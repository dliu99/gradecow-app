import { View, Text, ScrollView, RefreshControl } from "react-native";
import {SafeAreaView} from 'react-native-safe-area-context'
import { useAllGradesWithDetails } from '@/hooks/use-ic'
import { CourseCard } from '@/components/CourseCard'
import { CourseGradeDetailResponse, ExtractedCourse } from '@/api/src/types'
import { useMemo, useState } from 'react'

function computeCourseStats(courseData: CourseGradeDetailResponse | undefined) {
  if (!courseData?.categories) return { lastUpdated: null, recentImpact: undefined }
  
  const isWeighted = courseData.task.groupWeighted
  const totalCoursePoints = courseData.categories.reduce((sum, cat) => {
    return sum + cat.assignments.reduce((catSum, a) => catSum + (a.dropped ? 0 : a.totalPoints), 0)
  }, 0)
  
  let mostRecent: { date: string; impact: number } | null = null
  
  for (const category of courseData.categories) {
    const categoryTotalPoints = category.assignments.reduce((sum, a) => sum + (a.dropped ? 0 : a.totalPoints), 0)
    
    for (const assignment of category.assignments) {
      if (assignment.scoreModifiedDate && assignment.score !== null && !assignment.dropped) {
        const scorePercent = parseFloat(assignment.scorePercentage || '0')
        const deviation = scorePercent - 100
        
        let percentImpact = 0
        if (isWeighted && categoryTotalPoints > 0) {
          percentImpact = (deviation / 100) * (assignment.totalPoints / categoryTotalPoints) * category.weight
        } else if (totalCoursePoints > 0) {
          percentImpact = (deviation / 100) * (assignment.totalPoints / totalCoursePoints) * 100
        }
        
        if (!mostRecent || new Date(assignment.scoreModifiedDate) > new Date(mostRecent.date)) {
          mostRecent = { 
            date: assignment.scoreModifiedDate, 
            impact: Math.round(percentImpact * 100) / 100 
          }
        }
      }
    }
  }
  
  return { 
    lastUpdated: mostRecent?.date ?? null, 
    recentImpact: mostRecent?.impact 
  }
}

function CourseCardWithDetails({ 
  course, 
  courseData 
}: { 
  course: ExtractedCourse
  courseData: CourseGradeDetailResponse | undefined 
}) {
  const { lastUpdated, recentImpact } = useMemo(() => computeCourseStats(courseData), [courseData])
  
  return (
    <CourseCard 
      course={course} 
      lastUpdated={lastUpdated}
      recentImpact={recentImpact}
    />
  )
}

export default function Grades() {
  const [refreshing, setRefreshing] = useState(false)
  const { data, isLoading, refetch } = useAllGradesWithDetails()

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const courses = data?.courses
  const detailsMap = data?.detailsMap

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <ScrollView
          className="flex-1 px-5 pt-5"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
              title="Refreshing..."
              titleColor="white"
              progressBackgroundColor="white"
            />
          }
        >
        {isLoading ? (
          <Text className="text-stone-400 text-center mt-8">Loading...</Text>
        ) : courses && courses.length > 0 ? (
          <>
            <Text className="text-white text-3xl font-bold mt-4">Grades</Text>
            <View className="mt-4">
              {courses.map((course) => (
                <CourseCardWithDetails 
                  key={`${course.sectionID}-${course.termName}`} 
                  course={course}
                  courseData={detailsMap?.get(course.sectionID)}
                />
              ))}
            </View>
          </>
        ) : (
          <Text className="text-stone-400 text-center mt-8">No courses found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}