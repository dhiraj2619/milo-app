import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@milo/session-profile';

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
