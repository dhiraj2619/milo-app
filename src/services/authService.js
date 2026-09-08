import {
  getAuth,
  getIdToken,
  signInWithPhoneNumber,
} from '@react-native-firebase/auth';
import api from './api';

let pendingConfirmation = null;

export async function completeProfile({nickname, gender, languages}) {
  const user = getAuth().currentUser;
  if (!user) {throw new Error('Please sign in again to complete your profile.');}
  const idToken = await getIdToken(user);
  const response = await api.post('/users/profile', {idToken, nickname, gender, languages});
  const profile = response.data.data?.user;
  if (!response.data.success || !profile?._id || profile.firebaseUid !== user.uid || profile.nickname !== nickname || profile.gender !== gender || !languages.every(language => profile.languages?.includes(language))) {
    throw new Error('Your profile could not be saved completely. Please try again.');
  }
  return profile;
}

export async function sendPhoneOTP(phone) {
  pendingConfirmation = await signInWithPhoneNumber(getAuth(), `+91${phone}`);
}

export async function verifyPhoneOTP(otp, phone) {
  if (!/^[6-9]\d{9}$/.test(phone || '')) {
    throw new Error('Please go back and request an OTP for your phone number.');
  }
  let user = getAuth().currentUser;

  if (!user || user.phoneNumber !== `+91${phone}`) {
    if (!pendingConfirmation) {
      throw new Error('No pending confirmation. Please request a new OTP.');
    }

    const credential = await pendingConfirmation.confirm(otp);
    user = credential.user;
    pendingConfirmation = null;
  }

  if (user.phoneNumber !== `+91${phone}`) {
    throw new Error('This verification belongs to another number. Request a new OTP.');
  }

  const idToken = await getIdToken(user);

  const response = await api.post('/auth/firebase/verify-token', {
    idToken,
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Unable to complete sign-in. Please retry.');
  }
  return response.data.data;
}
