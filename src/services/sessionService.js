import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@milo/session-profile';
const WELCOME_REWARD_KEY = '@milo/welcome-reward';

export async function saveSessionProfile(profile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getSessionProfile() {
  const value = await AsyncStorage.getItem(PROFILE_KEY);
  return value ? JSON.parse(value) : null;
}

export async function clearSessionProfile() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}

export async function queueWelcomeReward(nickname) {
  await AsyncStorage.setItem(WELCOME_REWARD_KEY, JSON.stringify({nickname, amount: 100}));
}

export async function consumeWelcomeReward() {
  const value = await AsyncStorage.getItem(WELCOME_REWARD_KEY);
  await AsyncStorage.removeItem(WELCOME_REWARD_KEY);
  return value ? JSON.parse(value) : null;
}