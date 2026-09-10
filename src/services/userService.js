import {getAuth, getIdToken} from '@react-native-firebase/auth';
import api from './api';

async function token() {
  const user = getAuth().currentUser;
  if (!user) {throw new Error('Please sign in again.');}
  return getIdToken(user);
}

export async function getMyProfile() {
  const response = await api.get('/users/me', {headers: {Authorization: `Bearer ${await token()}`}});
  return response.data.data.user;
}

export async function updateMyProfile(profile) {
  const response = await api.patch('/users/me', profile, {headers: {Authorization: `Bearer ${await token()}`}});
  return response.data.data.user;
}

export async function uploadProfilePhoto(asset) {
  const formData = new FormData();
  formData.append('photo', {uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'profile.jpg'});
  const response = await api.post('/users/me/photo', formData, {
    headers: {Authorization: `Bearer ${await token()}`, 'Content-Type': 'multipart/form-data'},
  });
  return response.data.data.user;
}
