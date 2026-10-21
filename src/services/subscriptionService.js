import {getAuth, getIdToken} from '@react-native-firebase/auth';
import api from './api';

async function authorizationHeaders() {
  const user = getAuth().currentUser;
  if (!user) {throw new Error('Please sign in again.');}
  return {Authorization: `Bearer ${await getIdToken(user)}`};
}

export async function getSubscriptionPlans() {
  const response = await api.get('/commerce/subscription-plans', {headers: await authorizationHeaders()});
  return response.data?.data?.plans || [];
}

export async function getMySubscription() {
  const response = await api.get('/commerce/subscriptions/me', {headers: await authorizationHeaders()});
  return response.data?.data?.subscription || null;
}
