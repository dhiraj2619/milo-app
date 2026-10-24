import {createNavigationContainerRef} from '@react-navigation/native';

// Lets non-screen code (such as incoming call handling) navigate.
export const navigationRef = createNavigationContainerRef();

let pendingNavigation = null;

// `initial: false` keeps Home underneath, so going back works even on a cold start.
export function navigateToMain(screen, params) {
  if (navigationRef.isReady()) navigationRef.navigate('Main', {screen, params, initial: false});
  else pendingNavigation = {screen, params};
}

// Called once the navigator mounts, e.g. when the app was opened from a call notification.
export function flushPendingNavigation() {
  if (!pendingNavigation) return;
  const {screen, params} = pendingNavigation;
  pendingNavigation = null;
  navigateToMain(screen, params);
}
