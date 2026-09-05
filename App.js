import React, {useCallback, useState} from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/splash/SplashScreen';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const finishSplash = useCallback(() => setShowSplash(false), []);
  return (
    <SafeAreaProvider>
      {showSplash ? <SplashScreen onFinish={finishSplash} /> : (
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
};

export default App;
