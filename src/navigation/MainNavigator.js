import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ChatsScreen from '../screens/chat/ChatsScreen';
import ChatConversationScreen from '../screens/chat/ChatConversationScreen';
import AudioRoomScreen from '../screens/call/AudioRoomScreen';
import IncomingCallScreen from '../screens/call/IncomingCallScreen';
import CoinStoreScreen from '../screens/coin/CoinStoreScreen';
import MiloConnectScreen from '../screens/subscription/MiloConnectScreen';
import MiloConnectPlansScreen from '../screens/subscription/MiloConnectPlansScreen';
import MorePersonsScreen from '../screens/home/MorePersonsScreen';
import MiloSpecialScreen from '../screens/special/MiloSpecialScreen';
import ConnectScreen from '../screens/connect/ConnectScreen';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Chats" component={ChatsScreen} />
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />
      <Stack.Screen name="AudioRoom" component={AudioRoomScreen} />
      <Stack.Screen name="VideoRoom" component={AudioRoomScreen} />
      <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="CoinStore" component={CoinStoreScreen} />
      <Stack.Screen name="MiloConnect" component={MiloConnectScreen} />
      <Stack.Screen name="MiloConnectPlans" component={MiloConnectPlansScreen} />
      <Stack.Screen name="MorePersons" component={MorePersonsScreen} />
      <Stack.Screen name="MiloSpecial" component={MiloSpecialScreen} />
      <Stack.Screen name="Connect" component={ConnectScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
