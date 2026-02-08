import { View, Text, ScrollView, RefreshControl } from "react-native";
import {SafeAreaView} from 'react-native-safe-area-context'
import { useAllGradesWithDetails } from '@/hooks/use-ic'
import { CourseCard } from '@/components/CourseCard'
import { CourseGradeDetailResponse, ExtractedCourse } from '@/api/src/types'
import { useMemo, useState } from 'react'
import { calculatePercentImpactFromRaw } from '@/utils/grade-calculator'

function computeCourseStats(courseData: CourseGradeDetailResponse | undefined) {
  if (!courseData?.categories) return { lastUpdated: null, recentImpact: undefined }
  
  const isWeighted = courseData.task.groupWeighted
  
  let mostRecent: { date: string; impact: number } | null = null
  
  for (const category of courseData.categories) {
    for (const assignment of category.assignments) {
      if (assignment.scoreModifiedDate && assignment.score !== null && !assignment.dropped) {
        const percentImpact = calculatePercentImpactFromRaw(assignment, courseData.categories, isWeighted)
        
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
          className="flex-1 px-4 pt-8"
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
          <Text className="text-stone-400 text-center mb-6">Loading...</Text>
        ) : courses && courses.length > 0 ? (
          <>
            <Text className="text-white text-4xl font-bold">Grades</Text>
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
