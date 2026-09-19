import React, {useEffect, useRef, useState} from 'react';
import {Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, ChevronRight, Paperclip, Phone, Send, Smile, Video} from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import {Coin, Gradient} from '../../components/home/HomeDecor';
import {getChatMessages, getConversations, sendChatMessage} from '../../services/chatService';
import {getAuth} from '@react-native-firebase/auth';
import {getMyProfile} from '../../services/userService';

const now = () => new Date().toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});

export default function ChatConversationScreen({navigation, route}) {
  const person = route.params?.person || {nickname: 'MILO member', languages: ['English'], isOnline: false};
  const chatId = route.params?.chatId;
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [sending, setSending] = useState(false);
  const [callSheetOpen, setCallSheetOpen] = useState(false);
  const list = useRef();
  const initialMessageStarted = useRef(false);
  const sendingRef = useRef(false);
  useEffect(() => { getMyProfile().then(profile => setCoinBalance(profile.coinBalance || 0)).catch(() => {}); }, []);
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
        if (initialMessageStarted.current || !person._id) return;
        initialMessageStarted.current = true;
        const conversations = await getConversations();
        const existingConversation = conversations.find(conversation => conversation.participant?._id === person._id);
        if (existingConversation) {
          navigation.setParams({chatId: existingConversation.id});
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
    if (!text || !person._id || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setDraft('');
    const optimistic = {id: `local-${Date.now()}`, text, mine: true, time: now()};
    setMessages(current => [...current, optimistic]);
    try {await sendChatMessage(person._id, text);} catch (_) {setMessages(current => current.filter(message => message.id !== optimistic.id));} finally {sendingRef.current = false; setSending(false);}
  };
  const startCall = type => {
    setCallSheetOpen(false);
    navigation.navigate(type === 'video' ? 'VideoRoom' : 'AudioRoom', {person, availablePeople: [], callType: type});
  };
  const name = person.nickname || person.name || 'MILO member';
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#090B22" />
    <Gradient from="#11183A" to="#080913" radius={0} />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}><Pressable onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft size={23} color="#F8F4FF" /></Pressable><View style={styles.headerAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /><View style={[styles.onlineDot, person.isOnline !== true && styles.offlineDot]} /></View><View style={styles.headerCopy}><Text style={styles.headerName}>{name}</Text></View><View style={styles.coinPill}><Coin size={19} /><Text style={styles.coinText}>{coinBalance}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Call ${name}`} onPress={() => setCallSheetOpen(true)} style={styles.headerIcon}><Phone size={19} color="#E9E3F5" /></Pressable></View>      <View style={styles.divider} />
      <ScrollView ref={list} onContentSizeChange={() => list.current?.scrollToEnd({animated: true})} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}><View style={styles.today}><Text style={styles.todayText}>Today</Text></View>{messages.map(message => <View key={message.id} style={[styles.messageRow, message.mine ? styles.myRow : styles.theirRow]}><View style={[styles.bubble, message.mine ? styles.myBubble : styles.theirBubble]}><Text style={styles.messageText}>{message.text}</Text><Text style={styles.messageTime}>{message.time}{message.mine ? '  ✓✓' : ''}</Text></View></View>)}</ScrollView>
      <View style={styles.composer}><View style={styles.inputWrap}><Pressable><Smile size={21} color="#B8B1C9" /></Pressable><TextInput editable={!sending} value={draft} onChangeText={setDraft} onSubmitEditing={sendMessage} returnKeyType="send" placeholder="Type a message..." placeholderTextColor="#A9A2BA" style={styles.input} /><Pressable><Paperclip size={20} color="#B8B1C9" /></Pressable></View><Pressable disabled={sending} onPress={sendMessage} style={[styles.send, sending && styles.sendDisabled]}><Gradient from="#BC55FF" to="#6A25EF" radius={19} /><Send size={19} color="#FFFFFF" fill="#FFFFFF" /></Pressable></View>
      <Modal transparent animationType="slide" visible={callSheetOpen} statusBarTranslucent onRequestClose={() => setCallSheetOpen(false)}>
        <View style={styles.callSheetOverlay}>
          <Pressable accessibilityLabel="Close call options" onPress={() => setCallSheetOpen(false)} style={styles.callSheetBackdrop} />
          <View style={styles.callSheet}>
            <View style={styles.callSheetHandle} />
            <Text style={styles.callSheetTitle}>Join now</Text>
            <Text style={styles.callSheetSubtitle}>Choose how you want to connect with {name}.</Text>
            <Pressable accessibilityRole="button" onPress={() => startCall('audio')} style={styles.callOption}>
              <View style={styles.callOptionIcon}><Phone size={22} color="#D68AFF" /></View>
              <View style={styles.callOptionCopy}><Text style={styles.callOptionTitle}>Audio call</Text><View style={styles.callPrice}><Image source={require('../../../assets/icons/coin.png')} style={styles.callCoin} resizeMode="contain" /><Text style={styles.callPriceText}>10/min</Text></View></View>
              <ChevronRight size={19} color="#D7C9EA" />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => startCall('video')} style={styles.callOption}>
              <View style={styles.callOptionIcon}><Video size={22} color="#D68AFF" /></View>
              <View style={styles.callOptionCopy}><Text style={styles.callOptionTitle}>Video call</Text><View style={styles.callPrice}><Image source={require('../../../assets/icons/coin.png')} style={styles.callCoin} resizeMode="contain" /><Text style={styles.callPriceText}>40/min</Text></View></View>
              <ChevronRight size={19} color="#D7C9EA" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#080913'}, flex: {flex: 1}, header: {height: 66, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center'}, back: {width: 31}, headerAvatar: {width: 35, height: 35, borderRadius: 18, overflow: 'hidden'}, headerCopy: {marginLeft: 8, flex: 1}, headerName: {fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#FFFFFF'}, onlineLine: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -2}, onlineDot: {position: 'absolute', right: 0, top: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#090B22', backgroundColor: '#20E68A'}, offlineDot: {backgroundColor: '#F5C542'}, onlineText: {fontSize: 8, color: '#20E68A'}, coinPill: {height: 31, minWidth: 66, borderRadius: 16, paddingHorizontal: 8, marginRight: 12, backgroundColor: '#17172A', borderWidth: 1, borderColor: '#5B4D7C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4}, coinText: {fontFamily: 'Poppins-SemiBold', color: '#FFE16A', fontSize: 12}, headerIcon: {padding: 4}, divider: {height: 1, backgroundColor: '#494069'}, messages: {paddingHorizontal: 16, paddingVertical: 14, flexGrow: 1}, today: {alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#17183B', borderRadius: 9, marginBottom: 12}, todayText: {fontSize: 8, color: '#BEB7CF'}, messageRow: {flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end'}, myRow: {justifyContent: 'flex-end'}, theirRow: {justifyContent: 'flex-start'}, messageAvatar: {width: 27, height: 27, borderRadius: 14, overflow: 'hidden', marginRight: 6}, bubble: {maxWidth: '76%', borderRadius: 13, paddingHorizontal: 11, paddingTop: 8, paddingBottom: 5}, myBubble: {backgroundColor: '#8232E8', borderTopRightRadius: 3}, theirBubble: {backgroundColor: '#24243A', borderTopLeftRadius: 3}, messageText: {fontFamily: 'Poppins-Regular', color: '#FFFFFF', fontSize: 11, lineHeight: 16}, messageTime: {fontSize: 7, color: '#D6C8F5', alignSelf: 'flex-end', marginTop: 2}, composer: {paddingHorizontal: 12, paddingTop: 10, paddingBottom: 14, flexDirection: 'row', gap: 9, alignItems: 'center'}, inputWrap: {height: 52, flex: 1, borderRadius: 20, borderWidth: 1, borderColor: '#62547B', backgroundColor: '#17172A', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8}, input: {flex: 1, color: '#FFFFFF', padding: 0, fontFamily: 'Poppins-Regular', fontSize: 11}, send: {width: 52, height: 52, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'}, sendDisabled: {opacity: 0.55}, quickActions: {paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', gap: 8}, quickAction: {height: 32, flex: 1, borderRadius: 16, borderWidth: 1, borderColor: '#383451', backgroundColor: '#151529', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7}, quickText: {fontFamily: 'Poppins-Medium', color: '#C6C0D7', fontSize: 9}, moreAction: {width: 34, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#383451', alignItems: 'center', justifyContent: 'center'}, callSheetOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 3, 10, 0.72)'}, callSheetBackdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0}, callSheet: {backgroundColor: '#0D1117', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderBottomWidth: 0, borderColor: '#6E429F', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32}, callSheetHandle: {width: 42, height: 4, borderRadius: 2, backgroundColor: '#A981D6', alignSelf: 'center', marginBottom: 18}, callSheetTitle: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 21, textAlign: 'center'}, callSheetSubtitle: {fontFamily: 'Poppins-Regular', color: '#AEA5BE', fontSize: 11, textAlign: 'center', marginTop: 3, marginBottom: 19}, callOption: {minHeight: 75, borderRadius: 17, borderWidth: 1, borderColor: '#3B3551', backgroundColor: '#171B25', paddingHorizontal: 13, marginBottom: 11, flexDirection: 'row', alignItems: 'center'}, callOptionIcon: {width: 45, height: 45, borderRadius: 23, backgroundColor: '#281C3F', alignItems: 'center', justifyContent: 'center'}, callOptionCopy: {flex: 1, marginLeft: 12}, callOptionTitle: {fontFamily: 'Poppins-SemiBold', color: '#F7F2FF', fontSize: 15}, callPrice: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3}, callCoin: {width: 16, height: 16}, callPriceText: {fontFamily: 'Poppins-Medium', color: '#F6D355', fontSize: 11}, callOptionArrow: {transform: [{rotate: '180deg'}]},
});
