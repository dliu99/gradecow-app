import React, { useRef, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import DeviceInfo from 'react-native-device-info';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const handleNavigationStateChange = async (navState: any) => {
  if (navState.url.includes('nav-wrapper/student/portal/student/home')) {
    try {
      const cookies = await CookieManager.get(navState.url, true)
      const cookieHeader = Object.entries(cookies)
      .map(([name, c]) => `${name}=${c.value}`)
      .join(";");

      //verify cookies are valid
      const r1 = await fetch('http://localhost:3000/ic/verify', {
        method: 'POST',
        body: JSON.stringify({
          cookieHeader: cookieHeader,
        }),
      });
      if (r1.status !== 200) {
        console.log('Failed to verify cookiessss', r1.status, r1.statusText);
        return;
      }
      const d1 = await r1.json();

      const deviceID = uuidv4();
      //await DeviceInfo.getUniqueId().then(id => id.toString());
      const response = await fetch('http://localhost:3000/ic/auth', {
        method: 'POST',
        body: JSON.stringify({
          cookieHeader: cookieHeader,
          deviceType: 'iOS',
          deviceModel: DeviceInfo.getModel(),
          systemVersion: DeviceInfo.getSystemVersion(),
          deviceID: deviceID,
        }),
      });
      const data = await response.json();
      console.log('Auth response:', response.status, data);
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
  const [bootstrapComplete, setBootstrapComplete] = useState(false);
  const bootstrapAttempted = useRef(false);
  
  
  
  const handleLoadEnd = async () => {
    if (!bootstrapAttempted.current && webViewRef.current) {
      await CookieManager.set(uri, {
        name: 'campus_hybrid_app',
        value: 'student',
        domain: uri.split('/')[2],
        path: '/',
        expires: (Date.now() + 1000 * 60 * 60 * 24 * 30).toString(),
        secure: true,
        httpOnly: true,
      });
      bootstrapAttempted.current = true;
      
      // not sure if the following is necessary, but it works now so I'm leaving it
      const deviceID = uuidv4();
      const model = DeviceInfo.getModel();
      const deviceType = DeviceInfo.getDeviceType();
      const systemVersion = DeviceInfo.getSystemVersion();

      const script = `
        (function() {            
            const formData = new URLSearchParams({
              'appName': 'sanRamon',
              'deviceID': '${deviceID}',
              'deviceModel': '${model}',
              'deviceType': '${deviceType}',
              'systemVersion': '${systemVersion}',
              'appType': 'student',
              'appVersion': '1.11.4',
              'bootstrapped': '1',
              'registrationToken': 'null'
            });

            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://srvusd.infinitecampus.org/campus/mobile/hybridAppUtil.jsp', true);
            xhr.setRequestHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
            xhr.setRequestHeader('Accept-Language', 'en-US,en;q=0.9');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148');

            xhr.send(formData.toString());
        })();
        true;
      `;
      
      webViewRef.current.injectJavaScript(script);
    }
  };
  
  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: 'Sign in to Infinite Campus'}} />
      <WebView
        ref={webViewRef}
        source={{ uri: uri }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsBackForwardNavigationGestures={true}
      />
    </View>
  );
}

