import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ChatsScreen from '../screens/chat/ChatsScreen';
import ChatConversationScreen from '../screens/chat/ChatConversationScreen';
import AudioRoomScreen from '../screens/call/AudioRoomScreen';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Chats" component={ChatsScreen} />
      <Stack.Screen name="ChatConversation" component={ChatConversationScreen} />
      <Stack.Screen name="AudioRoom" component={AudioRoomScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
