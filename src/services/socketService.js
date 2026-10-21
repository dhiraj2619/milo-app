import {io} from 'socket.io-client';
import {getAuth, getIdToken} from '@react-native-firebase/auth';
import {SERVER_URL} from '../config/config';

let socket = null;

// One app-wide connection shared by presence, chat updates and calls.
export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL.replace(/\/+$/, ''), {
      // Runs on every (re)connect, so an expired Firebase ID token is refreshed.
      auth: async callback => {
        try {
          const user = getAuth().currentUser;
          callback({token: user ? await getIdToken(user) : null});
        } catch (_) {
          callback({token: null});
        }
      },
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
