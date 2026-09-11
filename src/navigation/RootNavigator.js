import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';

const Stack = createNativeStackNavigator();

const RootNavigator = ({signedIn}) => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    {signedIn ? <Stack.Screen name="Main" component={MainNavigator} /> : <Stack.Screen name="Auth" component={AuthNavigator} />}
  </Stack.Navigator>
);

export default RootNavigator;

