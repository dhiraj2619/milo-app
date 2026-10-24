import {getAuth, getIdToken} from '@react-native-firebase/auth';
import api from './api';
import {getSessionProfile, saveSessionProfile} from './sessionService';

async function token() {
  const user = getAuth().currentUser;
  if (!user) {throw new Error('Please sign in again.');}
  return getIdToken(user);
}

function responseProfile(response) {
  const data = response?.data?.data;
  return data?.user || response?.data?.user || data || null;
}

async function cachedProfileForCurrentUser() {
  const cached = await getSessionProfile();
  const currentUser = getAuth().currentUser;
  if (!cached || !currentUser) return null;
  return cached.firebaseUid === currentUser.uid ? cached : null;
}

export async function getMyProfile() {
  try {
    const response = await api.get('/users/me', {headers: {Authorization: `Bearer ${await token()}`}});
    const profile = responseProfile(response);
    if (profile?.nickname || profile?.phone || profile?.firebaseUid) {
      await saveSessionProfile(profile);
      return profile;
    }
    const cached = await cachedProfileForCurrentUser();
    if (cached) return cached;
    throw new Error('Your profile was not returned by the server.');
  } catch (error) {
    const cached = await cachedProfileForCurrentUser();
    if (cached) return cached;
    throw error;
  }
}

export async function getDiscoverProfiles({page = 1, limit = 12, language} = {}) {
  const response = await api.get('/users/discover', {
    headers: {Authorization: `Bearer ${await token()}`},
    params: {page, limit, ...(language ? {language} : {})},
  });
  return response.data.data;
}

export async function updateMyProfile(profile) {
  const response = await api.patch('/users/me', profile, {headers: {Authorization: `Bearer ${await token()}`}});
  const updatedProfile = responseProfile(response);
  if (updatedProfile) await saveSessionProfile(updatedProfile);
  return updatedProfile;
}

export async function uploadProfilePhoto(asset) {
  const formData = new FormData();
  formData.append('photo', {uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'profile.jpg'});
  // fetch sets the multipart boundary itself; axios does not do this reliably for React Native uploads.
  const response = await fetch(`${api.defaults.baseURL}/users/me/photo`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${await token()}`, Accept: 'application/json'},
    body: formData,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error(body?.message || 'Could not upload your photo. Please try again.'), {response: {data: body}});
  }
  const updatedProfile = responseProfile({data: body});
  if (updatedProfile) await saveSessionProfile(updatedProfile);
  return updatedProfile;
}
// Back to the avatar: removes the uploaded profile photo.
export async function removeProfilePhoto() {
  const response = await api.delete('/users/me/photo', {headers: {Authorization: `Bearer ${await token()}`}});
  const updatedProfile = responseProfile(response);
  if (updatedProfile) await saveSessionProfile(updatedProfile);
  return updatedProfile;
}

// People saved after a good call, online first.
export async function getFavourites() {
  const response = await api.get('/users/me/favourites', {headers: {Authorization: `Bearer ${await token()}`}});
  return response.data?.data?.favourites || [];
}

export async function setFavourite(userId, favourite) {
  const request = {headers: {Authorization: `Bearer ${await token()}`}};
  await (favourite ? api.put(`/users/me/favourites/${userId}`, null, request) : api.delete(`/users/me/favourites/${userId}`, request));
  return favourite;
}
