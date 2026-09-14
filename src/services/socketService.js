import {io} from 'socket.io-client';
import {SERVER_URL} from '../config/config';

export function createPresenceSocket(idToken) {
  return io(SERVER_URL.replace(/\/+$/, ''), {
    auth: {token: idToken},
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}
