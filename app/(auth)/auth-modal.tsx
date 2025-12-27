import React, { useRef, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';


const handleNavigationStateChange = async (navState: any) => {
  if (navState.url.includes('campus/nav-wrapper/')) {
    try {
      const cookies = await CookieManager.getAll(true);
      console.log('Auth successful, cookies:', cookies);
      console.log('Cookies:', cookies);
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
  return (
    
    <View>
      <Stack.Screen options={{ title: 'Sign in to Infinite Campus'}} />
      {(
        <WebView
        ref={webViewRef}
        source={{ uri: "https://google.com" }}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />
      )}
    </View>
  );
}

