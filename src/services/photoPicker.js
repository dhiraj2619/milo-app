import {Linking, PermissionsAndroid, Platform} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

// Large enough for a sharp profile photo (the server crops to 600x600), small enough to upload quickly.
const PHOTO = {mediaType: 'photo', quality: 0.85, maxWidth: 720, maxHeight: 720};

// The app declares CAMERA in its manifest, so Android requires asking at runtime before opening the camera.
async function allowCamera() {
  if (Platform.OS !== 'android') return 'granted';
  const {PERMISSIONS, RESULTS} = PermissionsAndroid;
  if (await PermissionsAndroid.check(PERMISSIONS.CAMERA)) return 'granted';
  const result = await PermissionsAndroid.request(PERMISSIONS.CAMERA, {
    title: 'Allow camera',
    message: 'MILO uses the camera to take your selfie for your profile photo and avatar.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  if (result === RESULTS.GRANTED) return 'granted';
  return result === RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied';
}

// Opens the front camera ('camera') or the gallery ('library').
// Resolves to {asset} on success, {cancelled: true}, or {error, openSettings?} with a message to show.
export async function pickPhoto(source, {base64 = false} = {}) {
  const options = {...PHOTO, includeBase64: base64};
  try {
    if (source === 'camera') {
      const permission = await allowCamera();
      if (permission === 'blocked') return {error: 'Camera access is turned off for MILO. Turn it on in Settings, or choose a photo instead.', openSettings: () => Linking.openSettings()};
      if (permission !== 'granted') return {error: 'MILO needs camera access to take a selfie. You can choose a photo instead.'};
    }
    const result = source === 'camera'
      ? await launchCamera({...options, cameraType: 'front', saveToPhotos: false})
      : await launchImageLibrary({...options, selectionLimit: 1});
    if (result.didCancel) return {cancelled: true};
    if (result.errorCode) {
      return {error: result.errorCode === 'camera_unavailable' ? 'No camera found on this device. Choose a photo instead.' : result.errorCode === 'permission' ? 'Camera access is turned off. Allow it in Settings or choose a photo.' : 'Could not read that photo. Please try another one.'};
    }
    const asset = result.assets?.[0];
    return asset?.uri ? {asset} : {error: 'Could not read that photo. Please try another one.'};
  } catch (_) {
    return {error: source === 'camera' ? 'Could not open the camera. Try choosing a photo instead.' : 'Could not open your photos. Please try again.'};
  }
}
