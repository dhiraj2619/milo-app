import {getAuth, getIdToken} from '@react-native-firebase/auth';
import api from './api';

async function authorizationHeaders() {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  return {Authorization: `Bearer ${await getIdToken(user)}`};
}

export async function getConversations() {
  const response = await api.get('/chats/conversations', {headers: await authorizationHeaders()});
  return response.data.data.conversations;
}

export async function getChatMessages(chatId) {
  const response = await api.get(`/chats/${chatId}/messages`, {headers: await authorizationHeaders()});
  return response.data.data.messages;
}

export async function sendChatMessage(participantId, text, type = 'text') {
  const response = await api.post(`/chats/${participantId}/messages`, {text, type}, {headers: await authorizationHeaders()});
  return response.data.data;
}
