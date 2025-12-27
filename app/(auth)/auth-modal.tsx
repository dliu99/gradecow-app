import React, { useRef, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';


const handleNavigationStateChange = async (navState: any) => {
  if (navState.url.includes('home')) {
    try {
      const cookies = await CookieManager.getAll(true);
      console.log('Auth successful, cookies:', cookies);
      console.log('Cookies:', cookies);
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error getting cookies:', error);
      console.log('Error:', error);
    }
  }
};

const handleError = (error: any) => {
  console.error('WebView error:', error);
};

export default function AuthModal() {
  const webViewRef = useRef<WebView>(null);
  const { uri } = useLocalSearchParams<{ uri: string }>();
  
  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: 'Sign in to Infinite Campus'}} />
      <WebView
        ref={webViewRef}
        source={{ uri: uri }}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />
    </View>
  );
}

