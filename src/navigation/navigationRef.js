import {createNavigationContainerRef} from '@react-navigation/native';

// Lets non-screen code (such as incoming call handling) navigate.
export const navigationRef = createNavigationContainerRef();

export function navigateToMain(screen, params) {
  if (navigationRef.isReady()) navigationRef.navigate('Main', {screen, params});
}
