import {
  getAuth,
  getIdToken,
  signInWithPhoneNumber,
  signOut,
  signInWithCredential,
  PhoneAuthProvider,
} from '@react-native-firebase/auth';
import api from './api';

let pendingConfirmation = null;
let pendingPhone = null;

function phoneAuthMessage(error) {
  if (error?.code === 'auth/network-request-failed') {
    return 'Firebase could not reach phone verification. Check the app SHA fingerprint in Firebase Console, then try again.';
  }
  return error?.message || 'Unable to send OTP. Please try again.';
}

export async function completeProfile({nickname, gender, languages, avatarSeed, avatarStyle}) {
  const user = getAuth().currentUser;
  if (!user) {throw new Error('Please sign in again to complete your profile.');}
  const idToken = await getIdToken(user);
  const response = await api.post('/users/profile', {idToken, nickname, gender, languages, avatarSeed, avatarStyle});
  const profile = response.data.data?.user;
  if (!response.data.success || !profile?._id || profile.profileCompleted !== true || profile.firebaseUid !== user.uid || profile.nickname !== nickname || profile.gender !== gender || !languages.every(language => profile.languages?.includes(language))) {
    throw new Error('Your profile could not be saved completely. Please try again.');
  }
  return profile;
}

export async function sendPhoneOTP(phone) {
  pendingConfirmation = null;
  pendingPhone = null;
  try {
    if (getAuth().currentUser) {await signOut(getAuth());}
    pendingConfirmation = await signInWithPhoneNumber(getAuth(), `+91${phone}`);
    pendingPhone = phone;
  } catch (error) {
    throw new Error(phoneAuthMessage(error));
  }
}

export async function verifyPhoneOTP(otp, phone) {
  if (!/^[6-9]\d{9}$/.test(phone || '')) {
    throw new Error('Please go back and request an OTP for your phone number.');
  }
  if (!/^\d{6}$/.test(otp || '') || !pendingConfirmation?.verificationId || pendingPhone !== phone) {
    throw new Error('Enter your six-digit OTP, or request a new code if this session has expired.');
  }
  // Always validate the entered code, even if Firebase has a cached/auto-verified user.
  const phoneCredential = PhoneAuthProvider.credential(pendingConfirmation.verificationId, otp);
  const {user} = await signInWithCredential(getAuth(), phoneCredential);

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
