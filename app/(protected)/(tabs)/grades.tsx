import { View, Text, ScrollView } from "react-native";
import {SafeAreaView} from 'react-native-safe-area-context'
import { useAllGrades } from '@/hooks/use-ic'
import { CourseCard } from '@/components/CourseCard'

export default function Grades() {
  const { data: courses, isLoading } = useAllGrades()

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <ScrollView className="flex-1 px-5 pt-5">
        {isLoading ? (
          <Text className="text-stone-400 text-center mt-8">Loading...</Text>
        ) : courses && courses.length > 0 ? (
          <>
            <Text className="text-white text-3xl font-bold mt-4">Grades</Text>
            <View className="mt-4">
              {courses.map((course) => (
                <CourseCard key={`${course.sectionID}-${course.termName}`} course={course} />
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