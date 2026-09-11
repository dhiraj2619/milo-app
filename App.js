import React, {useCallback, useEffect, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/splash/SplashScreen';
import ToastProvider from './src/components/ui/ToastProvider';
import {getAuth} from '@react-native-firebase/auth';
import {clearSessionProfile, getSessionProfile, saveSessionProfile} from './src/services/sessionService';
import {getMyProfile} from './src/services/userService';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const finishSplash = useCallback(() => setShowSplash(false), []);
  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged(async user => {
      if (!user) {
        await clearSessionProfile();
        setSignedIn(false);
        setSessionReady(true);
        return;
      }
      let profile = await getSessionProfile().catch(() => null);
      if (!profile?.profileCompleted) {
        profile = await getMyProfile().catch(() => null);
        if (profile?.profileCompleted) {
          await saveSessionProfile(profile);
        }
      }
      setSignedIn(profile?.profileCompleted === true);
      setSessionReady(true);
    });
    return unsubscribe;
  }, []);
  return (
    <SafeAreaProvider>
      <ToastProvider>
      {showSplash || !sessionReady ? <SplashScreen onFinish={finishSplash} /> : (
        <NavigationContainer>
          <RootNavigator signedIn={signedIn} />
        </NavigationContainer>
      )}
      </ToastProvider>
    </SafeAreaProvider>
  );
};

export default App;
