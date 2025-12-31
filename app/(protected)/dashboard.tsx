import { Stack, Link } from 'expo-router';
import { View, Text } from 'react-native';
import { Button } from '@/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  return (
    <SafeAreaView className="flex flex-1 bg-teal-950">
      
      <View className="flex flex-1 w-full items-center justify-between px-6 pt-16 pb-12">
        <View className="flex-1 w-full items-center justify-center">
          <View className="w-80 px-4 items-center">
            <Text className="text-white text-2xl font-bold text-center">
              Good morning,
            </Text>
          </View>
        </View>
        
      </View>
    </SafeAreaView>
  );
}