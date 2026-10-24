import {AppState} from 'react-native';
import {io} from 'socket.io-client';
import {getAuth, getIdToken} from '@react-native-firebase/auth';
import {SERVER_URL} from '../config/config';

let socket = null;
let appStateSubscription = null;

// Tells the server whether the app is on screen. When it isn't, incoming calls also go out as push notifications.
const isInApp = () => AppState.currentState === 'active';

// One app-wide connection shared by presence, chat updates and calls.
export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL.replace(/\/+$/, ''), {
      // Runs on every (re)connect, so an expired Firebase ID token is refreshed.
      auth: async callback => {
        try {
          const user = getAuth().currentUser;
          callback({token: user ? await getIdToken(user) : null, inApp: isInApp()});
        } catch (_) {
          callback({token: null});
        }
      },
      transports: ['websocket'],
    });
    appStateSubscription = AppState.addEventListener('change', () => {
      socket?.emit('app:state', {inApp: isInApp()});
    });
  }
  return socket;
}

export function disconnectSocket() {
  appStateSubscription?.remove();
  appStateSubscription = null;
  socket?.disconnect();
  socket = null;
}
