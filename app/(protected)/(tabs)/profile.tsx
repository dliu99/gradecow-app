import { View, Text, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser, useProfile } from '@/hooks/use-ic'

function GpaCard({ label, value }: { label: string; value: string | null }) {
  return (
    <View className="bg-stone-800 rounded-2xl p-5 flex-1">
      <Text className="text-white text-4xl font-bold">{value ?? '—'}</Text>
      <Text className="text-stone-400 text-base mt-2">{label}</Text>
    </View>
  )
}

export default function Profile() {
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile, isLoading: profileLoading } = useProfile()

  const isLoading = userLoading || profileLoading

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
      <View className="flex-1 px-4 pt-8">
        <Text className="text-white text-4xl font-bold mb-8">
          {user?.firstName} {user?.lastName}
        </Text>

        {profile?.gpa && (
          <View className="flex-row gap-4">
            <GpaCard label="Weighted GPA" value={profile.gpa.w} />
            <GpaCard label="Unweighted GPA" value={profile.gpa.uw} />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
