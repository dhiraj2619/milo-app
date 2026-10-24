/**
 * @format
 */

import './src/polyfills/structuredClone';

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Call notifications are displayed by Android itself; nothing to do in the background.
setBackgroundMessageHandler(getMessaging(), async () => { });

AppRegistry.registerComponent(appName, () => App);

