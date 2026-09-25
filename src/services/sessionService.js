import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@milo/session-profile';
const WELCOME_REWARD_KEY = '@milo/welcome-reward';
const DAILY_CLAIM_KEY = '@milo/daily-claim';

export async function saveSessionProfile(profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getSessionProfile() {
  const value = await AsyncStorage.getItem(PROFILE_KEY);
  return value ? JSON.parse(value) : null;
}

export async function clearSessionProfile() {
  await AsyncStorage.multiRemove([PROFILE_KEY, DAILY_CLAIM_KEY]);
}

export async function saveDailyClaimAt(firebaseUid, claimedAt) {
  if (!firebaseUid || !claimedAt) return;
  await AsyncStorage.setItem(DAILY_CLAIM_KEY, JSON.stringify({firebaseUid, claimedAt}));
}

export async function getDailyClaimAt(firebaseUid) {
  const value = await AsyncStorage.getItem(DAILY_CLAIM_KEY);
  if (!value || !firebaseUid) return null;
  const claim = JSON.parse(value);
  return claim.firebaseUid === firebaseUid ? claim.claimedAt : null;
}
export async function queueWelcomeReward(nickname) {
  await AsyncStorage.setItem(WELCOME_REWARD_KEY, JSON.stringify({nickname, amount: 100}));
}

export async function consumeWelcomeReward() {
  const value = await AsyncStorage.getItem(WELCOME_REWARD_KEY);
  await AsyncStorage.removeItem(WELCOME_REWARD_KEY);
  return value ? JSON.parse(value) : null;
}