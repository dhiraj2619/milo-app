import React, {useEffect, useRef, useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Paperclip, Phone, Send, Smile, Video} from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import {Gradient} from '../../components/home/HomeDecor';
import {getChatMessages, sendChatMessage} from '../../services/chatService';
import {getAuth} from '@react-native-firebase/auth';

const now = () => new Date().toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});

export default function ChatConversationScreen({navigation, route}) {
  const person = route.params?.person || {nickname: 'MILO member', languages: ['English'], isOnline: false};
  const chatId = route.params?.chatId;
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const list = useRef();
  useEffect(() => {
    let mounted = true;
    const loadConversation = async () => {
      try {
        if (chatId) {
          const currentUid = getAuth().currentUser?.uid;
          const savedMessages = await getChatMessages(chatId);
          if (mounted) setMessages(savedMessages.map(message => ({id: message.id, text: message.text, mine: message.senderFirebaseUid === currentUid, time: new Date(message.createdAt).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})})));
          return;
        }
        const result = await sendChatMessage(person._id, 'Hii');
        if (mounted) {
          setMessages([{id: result.chatId, text: 'Hii', mine: true, time: now()}]);
          navigation.setParams({chatId: result.chatId});
        }
      } catch (_) {
        if (mounted) setMessages([{id: 'local-welcome', text: 'Hii', mine: true, time: now()}]);
      }
    };
    loadConversation();
    return () => { mounted = false; };
  }, [chatId, navigation, person._id]);
  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !person._id) return;
    setDraft('');
    const optimistic = {id: `local-${Date.now()}`, text, mine: true, time: now()};
    setMessages(current => [...current, optimistic]);
    try {await sendChatMessage(person._id, text);} catch (_) {setMessages(current => current.filter(message => message.id !== optimistic.id));}
  };
  const name = person.nickname || person.name || 'MILO member';
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#090B22" />
    <Gradient from="#11183A" to="#080913" radius={0} />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft size={23} color="#F8F4FF" /></Pressable><View style={styles.headerAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /></View><View style={styles.headerCopy}><Text style={styles.headerName}>{name}</Text><View style={styles.onlineLine}><View style={[styles.onlineDot, person.isOnline !== true && styles.offlineDot]} /><Text style={styles.onlineText}>{person.isOnline ? 'Online' : 'Offline'}</Text></View></View><View style={styles.headerActions}><Pressable style={styles.headerIcon}><Phone size={19} color="#E9E3F5" /></Pressable><Pressable style={styles.headerIcon}><Video size={20} color="#E9E3F5" /></Pressable></View></View>
      <View style={styles.divider} />
      <ScrollView ref={list} onContentSizeChange={() => list.current?.scrollToEnd({animated: true})} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}><View style={styles.today}><Text style={styles.todayText}>Today</Text></View>{messages.map(message => <View key={message.id} style={[styles.messageRow, message.mine ? styles.myRow : styles.theirRow]}>{!message.mine && <View style={styles.messageAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /></View>}<View style={[styles.bubble, message.mine ? styles.myBubble : styles.theirBubble]}><Text style={styles.messageText}>{message.text}</Text><Text style={styles.messageTime}>{message.time}{message.mine ? '  ??' : ''}</Text></View></View>)}</ScrollView>
      <View style={styles.composer}><View style={styles.inputWrap}><Pressable><Smile size={21} color="#B8B1C9" /></Pressable><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={sendMessage} returnKeyType="send" placeholder="Type a message..." placeholderTextColor="#A9A2BA" style={styles.input} /><Pressable><Paperclip size={20} color="#B8B1C9" /></Pressable></View><Pressable onPress={sendMessage} style={styles.send}><Gradient from="#BC55FF" to="#6A25EF" radius={19} /><Send size={19} color="#FFFFFF" fill="#FFFFFF" /></Pressable></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#080913'}, flex: {flex: 1}, header: {height: 60, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center'}, back: {width: 31}, headerAvatar: {width: 35, height: 35, borderRadius: 18, overflow: 'hidden'}, headerCopy: {marginLeft: 8, flex: 1}, headerName: {fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#FFFFFF'}, onlineLine: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -2}, onlineDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#20E68A'}, offlineDot: {backgroundColor: '#777186'}, onlineText: {fontSize: 8, color: '#20E68A'}, headerActions: {flexDirection: 'row', alignItems: 'center', gap: 14}, headerIcon: {padding: 2}, divider: {height: 1, backgroundColor: '#494069'}, messages: {paddingHorizontal: 13, paddingVertical: 12, flexGrow: 1}, today: {alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#17183B', borderRadius: 9, marginBottom: 12}, todayText: {fontSize: 8, color: '#BEB7CF'}, messageRow: {flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end'}, myRow: {justifyContent: 'flex-end'}, theirRow: {justifyContent: 'flex-start'}, messageAvatar: {width: 27, height: 27, borderRadius: 14, overflow: 'hidden', marginRight: 6}, bubble: {maxWidth: '76%', borderRadius: 13, paddingHorizontal: 11, paddingTop: 8, paddingBottom: 5}, myBubble: {backgroundColor: '#7828E6', borderTopRightRadius: 3}, theirBubble: {backgroundColor: '#273268', borderTopLeftRadius: 3}, messageText: {fontFamily: 'Poppins-Regular', color: '#FFFFFF', fontSize: 11, lineHeight: 16}, messageTime: {fontSize: 7, color: '#D6C8F5', alignSelf: 'flex-end', marginTop: 2}, composer: {paddingHorizontal: 12, paddingTop: 10, paddingBottom: 14, flexDirection: 'row', gap: 9, alignItems: 'center'}, inputWrap: {height: 52, flex: 1, borderRadius: 20, borderWidth: 1, borderColor: '#62547B', backgroundColor: '#17172A', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8}, input: {flex: 1, color: '#FFFFFF', padding: 0, fontFamily: 'Poppins-Regular', fontSize: 11}, send: {width: 52, height: 52, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}, quickActions: {paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', gap: 8}, quickAction: {height: 32, flex: 1, borderRadius: 16, borderWidth: 1, borderColor: '#383451', backgroundColor: '#151529', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7}, quickText: {fontFamily: 'Poppins-Medium', color: '#C6C0D7', fontSize: 9}, moreAction: {width: 34, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#383451', alignItems: 'center', justifyContent: 'center'},
});
