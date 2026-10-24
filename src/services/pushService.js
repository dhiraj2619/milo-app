import {PermissionsAndroid, Platform} from 'react-native';
import {getAuth, getIdToken} from '@react-native-firebase/auth';
import {getInitialNotification, getMessaging, getToken, onNotificationOpenedApp, onTokenRefresh, requestPermission} from '@react-native-firebase/messaging';
import api from './api';
import {navigateToMain} from '../navigation/navigationRef';

// Push notifications reach users whose app is closed: incoming calls, missed calls and likes.
// Tapping a call notification just opens the app; the server re-sends the ringing call
// over the socket once it connects.

let registeredToken = null;

async function authHeaders() {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  return {Authorization: `Bearer ${await getIdToken(user)}`};
}

async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await requestPermission(getMessaging());
  return status > 0; // AUTHORIZED or PROVISIONAL
}

async function sendToken(token) {
  await api.put('/users/me/push-token', {token}, {headers: await authHeaders()});
  registeredToken = token;
}

// Registers this device for the signed-in user. Returns an unsubscribe function.
export function registerForPush() {
  let active = true;
  (async () => {
    try {
      // Without permission the token still works for data, but nothing is shown, so skip it.
      if (!(await requestNotificationPermission()) || !active) return;
      const token = await getToken(getMessaging());
      if (active && token) await sendToken(token);
    } catch (error) {
      console.warn('Push registration failed:', error?.message || error);
    }
  })();
  const unsubscribe = onTokenRefresh(getMessaging(), token => {
    if (active) sendToken(token).catch(() => { });
  });
  // Tapping a notification: open the screen it is about. Calls need nothing here (see above).
  const openFrom = message => {
    if (active && message?.data?.type === 'like') navigateToMain('MiloSpecial');
  };
  const stopOpened = onNotificationOpenedApp(getMessaging(), openFrom);
  getInitialNotification(getMessaging()).then(openFrom).catch(() => { });
  return () => {
    active = false;
    unsubscribe();
    stopOpened();
  };
}

// Call before signing out, while the ID token is still valid, so this phone stops getting that user's calls.
export async function unregisterFromPush() {
  const token = registeredToken;
  registeredToken = null;
  if (!token) return;
  try {
    await api.delete('/users/me/push-token', {data: {token}, headers: await authHeaders(), timeout: 5000});
  } catch (_) {
    // Signing out must not fail because of this; the server drops dead tokens on its own.
  }
}
