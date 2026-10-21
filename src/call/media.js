import {PermissionsAndroid, Platform} from 'react-native';
import {mediaDevices} from 'react-native-webrtc';

export async function requestCallPermissions(callType) {
  if (Platform.OS !== 'android') return true;
  const {PERMISSIONS, RESULTS} = PermissionsAndroid;
  const required = [PERMISSIONS.RECORD_AUDIO];
  if (callType === 'video') required.push(PERMISSIONS.CAMERA);
  // Optional: lets audio route to Bluetooth headsets on Android 12+.
  const optional = Platform.Version >= 31 ? [PERMISSIONS.BLUETOOTH_CONNECT] : [];
  const result = await PermissionsAndroid.requestMultiple([...required, ...optional]);
  return required.every(permission => result[permission] === RESULTS.GRANTED);
}

export function getLocalStream(callType) {
  return mediaDevices.getUserMedia({
    audio: true,
    video: callType === 'video' ? {facingMode: 'user', width: 640, height: 480, frameRate: 24} : false,
  });
}

export function stopStream(stream) {
  stream?.getTracks().forEach(track => track.stop());
  stream?.release?.();
}
