import { View, Text, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser, useProfile } from '@/hooks/use-ic'
import { UserProfile } from '@/api/src/types'

function ProfileCard({ label, value }: { label: string; value: string | null }) {
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
      <View className="flex-1 px-5 pt-9">
        <Text className="text-white text-3xl font-bold mb-4">
          {/*{user?.firstName} {user?.lastName}*/}
          Profile
        </Text>

        {profile?.gpa && (
          <View className="flex-row gap-4 mb-4">
            <ProfileCard label="Unweighted GPA" value={profile.gpa.uw} />
            <ProfileCard label="Weighted GPA" value={profile.gpa.w} />
            
          </View>
        )}
        {profile?.absences !== null && profile?.tardies !== null && (
          <View className="flex-row gap-4">
            <ProfileCard label="Absences" value={profile?.absences?.toString() ?? '—'} />
            <ProfileCard label="Tardies" value={profile?.tardies?.toString() ?? '—'} />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
