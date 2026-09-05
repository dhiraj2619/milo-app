import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';

const Stack = createNativeStackNavigator();

const RootNavigator = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Auth" component={AuthNavigator} />
    <Stack.Screen name="Main" component={MainNavigator} />
  </Stack.Navigator>
);

export default RootNavigator;

