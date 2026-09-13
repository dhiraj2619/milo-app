import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import ProfileSuccessScreen from '../screens/auth/ProfileSuccessScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = ({onProfileCompleted}) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP">{props => <OTPScreen {...props} onProfileCompleted={onProfileCompleted} />}</Stack.Screen>
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="ProfileSuccess">{props => <ProfileSuccessScreen {...props} onProfileCompleted={onProfileCompleted} />}</Stack.Screen>
    </Stack.Navigator>
  );
};

export default AuthNavigator;
