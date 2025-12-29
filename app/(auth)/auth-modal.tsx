import React, { useRef } from 'react';
import { View, Alert } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import DeviceInfo from 'react-native-device-info';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { storeAuthSession } from '../../utils/storage';


export default function AuthModal() {
  const webViewRef = useRef<WebView>(null);
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const bootstrapAttempted = useRef(false);
  
  const districtUrl = new URL(uri).hostname; // https://x.infinitecampus.org -> x.infinitecampus.org

  const handleNavigationStateChange = async (navState: any) => {
    if (navState.url.includes('nav-wrapper/student/portal/student/home')) {
      try {
        const cookies = await CookieManager.get(navState.url, true);
        const cookieHeader = Object.entries(cookies)
          .map(([name, c]) => `${name}=${c.value}`)
          .join(';');
        
        const districtUrl = new URL(navState.url).hostname;
      //verify cookies are valid
      const r1 = await fetch('http://localhost:3000/ic/verify', {
        method: 'POST',
        body: JSON.stringify({
          cookieHeader: cookieHeader,
          districtUrl: districtUrl,
        }),
      });
      if (r1.status !== 200) {
        console.log('Failed to verify cookiessss', r1.status, r1.statusText);
        Alert.alert('Error', 'Failed to verify login. Please try again.');
        return;
      }

      const verifyData = await r1.json() as {
        data: {
          personID: number;
          firstName: string;
          lastName: string;
          [key: string]: unknown;
        };
      };
      
      const personID = verifyData.data.personID;
      if (!personID) {
        console.error('No personID in verify response');
        Alert.alert('Error', 'Failed to get user information. Please try again.');
        return;
      }
      
      console.log('Verified user:', verifyData.data.firstName, verifyData.data.lastName, 'personID:', personID);
        const deviceID = uuidv4();
        
        const authResponse = await fetch('http://localhost:3000/ic/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cookieHeader: cookieHeader,
            deviceType: 'iOS',
            deviceModel: DeviceInfo.getModel(),
            systemVersion: DeviceInfo.getSystemVersion(),
            deviceID: deviceID,
            districtUrl: districtUrl,
            personID: personID,
          }),
        });
        
        const authData = await authResponse.json() as {
          ok: boolean;
          message?: string;
          personId: number;
          districtUrl: string;
          data?: unknown;
        };
        console.log('Auth response:', authResponse.status, authData);

        if (!authResponse.ok || !authData.ok) {
          console.error('Auth failed:', authData.message);
          Alert.alert('Error', authData.message || 'Authentication failed. Please try again.');
          return;
        }

        storeAuthSession(authData.personId, authData.districtUrl);
        console.log('Auth session stored successfully for personId:', authData.personId);

        router.replace('/dashboard');
      } catch (error) {
        console.error('Error during authentication:', error);
        Alert.alert('Error', 'An error occurred during login. Please try again.');
      }
    }
  };

  const handleError = (error: any) => {
    console.error('WebView error:', error);
    Alert.alert('Error', 'Failed to load login page. Please check your connection.');
  };

  const handleLoadEnd = async () => {
    if (!bootstrapAttempted.current && webViewRef.current) {
      await CookieManager.set(uri, {
        name: 'campus_hybrid_app',
        value: 'student',
        domain: districtUrl,
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
            xhr.open('POST', 'https://${districtUrl}/campus/mobile/hybridAppUtil.jsp', true);
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

