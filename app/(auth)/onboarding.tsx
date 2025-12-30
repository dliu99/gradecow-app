import { Stack, Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, View, Text } from 'react-native';
import { Button } from '@/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Home() {
  const sentences = [
    ' stay on top of every assignment',
    ' see your grades update in real time',
    ' get gentle reminders before due dates hit',
    ' keep everything organized in one place',
  ];

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [sentenceIndex, setSentenceIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const runCycle = () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        if (!isMounted) return;
        setSentenceIndex((prev) => (prev + 1) % sentences.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          if (!isMounted) return;
          timeoutId = setTimeout(runCycle, 1500);
        });
      });
    };

    timeoutId = setTimeout(runCycle, 1500);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      fadeAnim.stopAnimation();
    };
  }, [fadeAnim, sentences.length]);

  return (
    <SafeAreaView className="flex flex-1 bg-teal-950">
      <Stack.Screen options={{ title: 'Home' }}/>
      <View className="flex flex-1 w-full items-center justify-between px-6 pt-16 pb-12">
        <View className="flex-1 w-full items-center justify-center">
          <View className="w-80 px-4 items-center">
            <Text className="text-white text-2xl font-bold text-center">
              gradecow 🐂 helps you
            </Text>
            <Animated.Text
              style={{ opacity: fadeAnim, minHeight: 48, textAlign: 'center' }}
              className="text-white text-2xl font-bold leading-snug"
            >
              {sentences[sentenceIndex]}
            </Animated.Text>
          </View>
        </View>
        <View className="w-full items-center">
          <Link href="/school-select" asChild>
            <Button title="Sign in with Infinite Campus" className="w-full bg-slate-100 items-left">
            <Text className="text-slate-950 text-lg font-semibold text-left">Sign in with Infinite Campus</Text>
            </Button>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

