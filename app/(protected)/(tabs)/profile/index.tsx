import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useProfile, useAppList } from '@/hooks/use-ic';
import { App, AppTool } from '@/api/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { clearAuth } from '@/utils/storage';
import { useState } from 'react';

function ProfileCard({ label, value }: { label: string; value: string | null }) {
  return (
    <View className="flex-1 rounded-2xl border border-stone-700 p-5">
      <Text className="text-4xl font-bold text-white">{value ?? '—'}</Text>
      <Text className="mt-2 text-base text-stone-500">{label}</Text>
    </View>
  );
}

export default function Profile() {
  const { data: user, isLoading: userLoading, refetch: refetchUser } = useUser();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useProfile();
  const { refetch: refetchAppList, isFetching: appListFetching } = useAppList(false);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchUser(), refetchProfile()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          clearAuth();
          queryClient.clear();
          router.replace('/(auth)/onboarding');
        },
      },
    ]);
  };

  const isLoading = userLoading || profileLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-900">
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']} collapsable={false}>
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: 48,
          paddingBottom: 24,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            title="Refreshing..."
            titleColor="white"
            progressBackgroundColor="white"
          />
        }>
        <Text className="mb-6 text-3xl font-bold text-white">Profile</Text>

        {profile?.gpa && (
          <View className="mb-4 flex-row gap-4">
            <ProfileCard label="Unweighted GPA" value={profile.gpa.uw} />
            <ProfileCard label="Weighted GPA" value={profile.gpa.w} />
          </View>
        )}
        {profile?.absences !== null && profile?.tardies !== null && (
          <View className="mb-4 flex-row gap-4">
            <ProfileCard label="Absences" value={profile?.absences?.toString() ?? '—'} />
            <ProfileCard label="Tardies" value={profile?.tardies?.toString() ?? '—'} />
          </View>
        )}
        <Pressable
          onPress={() => router.push('/(protected)/(tabs)/profile/about')}
          className="mb-4 rounded-2xl border border-stone-700 p-5 active:scale-[0.97] active:opacity-80">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-white">About gradecow 🐂</Text>
            <Ionicons name="arrow-forward" size={24} color="#ffffff" />
          </View>
        </Pressable>

        <Pressable
          onPress={async () => {
            try {
              const result = await refetchAppList();
              const appListArray: App[] | undefined = result.data;
              const hasResponsiveSchedule = appListArray?.some((app: App) =>
                app.tools?.some(
                  (tool: AppTool) => tool.code === 'student.responsive-schedule' && tool.display
                )
              );
              if (hasResponsiveSchedule) {
                router.push('/(protected)/(tabs)/profile/responsive-schedule');
              } else {
                Alert.alert(
                  'Not available',
                  'Responsive scheduling is not available for your account.'
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Unable to check responsive scheduling right now.');
            }
          }}
          className="mb-4 rounded-2xl border border-stone-700 p-5 active:scale-[0.97] active:opacity-80"
          disabled={appListFetching}
          style={{ opacity: appListFetching ? 0.6 : 1 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-white">Responsive Schedule</Text>
            <Ionicons name="arrow-forward" size={24} color="#ffffff" />
          </View>
        </Pressable>

        <Pressable
          onPress={handleSignOut}
          className="mb-4 rounded-2xl bg-red-900/50 p-5 active:scale-[0.97] active:opacity-80">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-white">Sign Out</Text>
            <Ionicons name="log-out-outline" size={24} color="#fca5a5" />
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
