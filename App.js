import React, {useCallback, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/splash/SplashScreen';
import ToastProvider from './src/components/ui/ToastProvider';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const finishSplash = useCallback(() => setShowSplash(false), []);
  return (
    <SafeAreaProvider>
      <ToastProvider>
      {showSplash ? <SplashScreen onFinish={finishSplash} /> : (
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      )}
      </ToastProvider>
    </SafeAreaProvider>
  );
};

export default App;
