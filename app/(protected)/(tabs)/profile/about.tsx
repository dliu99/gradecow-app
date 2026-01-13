import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function About() {
  return (
    <SafeAreaView className="flex-1 bg-neutral-900" edges={['top']}>
      <View className="flex-1 px-5 pt-9">
      <Text className="text-white text-lg font-base mt-9">
        • Any feedback or suggestions? Email me at <Link asChild href="mailto:devin78988@gmail.com" className="text-blue-500"><Text className="text-blue-500 underline">devin78988@gmail.com</Text></Link>
        </Text>
        <Text className="text-white text-lg font-base mt-2">
        • Thanks to Armaan Aggarwal for <Link asChild href="https://bessy.io" className="text-blue-500"><Text className="text-blue-500 underline">Bessy (no longer available on App Store)</Text></Link>, the main inspiration for this app
          </Text>
      </View>
    </SafeAreaView>
  )
}