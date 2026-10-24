import {getAuth, getIdToken} from '@react-native-firebase/auth';
import api from './api';
import {getSocket} from './socketService';

async function headers() {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  return {Authorization: `Bearer ${await getIdToken(user)}`};
}

// Everything on the MILO Special screen in one request.
export async function getSpecialHome() {
  const response = await api.get('/special', {headers: await headers()});
  return response.data.data;
}

// "Show another" on Today's Match. Rejects with response.data.reason === 'insufficient_coins' when out of coins.
export async function showAnotherMatch() {
  const response = await api.post('/special/match/next', null, {headers: await headers()});
  return response.data.data;
}

export async function answerDailyQuestion(answer) {
  const response = await api.post('/special/question', {answer}, {headers: await headers()});
  return response.data.data.myAnswer;
}

// Room queue. Resolves to {ok, matched} or {ok: false, reason} ('limit', 'already_in_call', 'network').
// When matched, the call arrives as "call:matched" and CallProvider takes over.
export function joinRoom(room) {
  return new Promise(resolve => {
    getSocket().timeout(10000).emit('match:join', {room}, (error, ack) => resolve(error ? {ok: false, reason: 'network'} : ack));
  });
}

export function leaveRoom() {
  getSocket().emit('match:leave');
}
