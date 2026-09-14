import {getAuth, getIdToken} from '@react-native-firebase/auth';
import api from './api';

async function authorizationHeaders() {
  const user = getAuth().currentUser;
  if (!user) {throw new Error('Please sign in again.');}
  return {Authorization: `Bearer ${await getIdToken(user)}`};
}

export async function claimDailyCoins() {
  const response = await api.post('/coins/daily-claim', {}, {headers: await authorizationHeaders()});
  return response.data.data;
}
