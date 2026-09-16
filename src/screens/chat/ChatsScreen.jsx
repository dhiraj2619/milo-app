import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Modal, Pressable, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronRight, House, MessageCircle, Phone, Search, Sparkles, UserRound, Video, X} from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import {Gradient} from '../../components/home/HomeDecor';
import {useToast} from '../../components/ui/ToastProvider';
import {getConversations} from '../../services/chatService';
import {createPresenceSocket} from '../../services/socketService';
import {getAuth, getIdToken} from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';

const filters = ['All', 'Unread', 'Calls'];
const tabs = [{label: 'Home', icon: House}, {label: 'Chats', icon: MessageCircle}, {label: 'MILO Special', icon: Sparkles}, {label: 'Connect', icon: Phone}, {label: 'Profile', icon: UserRound}];

const chatTime = value => value ? new Date(value).toLocaleDateString([], {month: 'short', day: 'numeric'}) : '';

export default function ChatsScreen({navigation}) {
  const toast = useToast();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const socket = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const conversations = await getConversations();
      setChats(conversations.map(conversation => ({
        id: conversation.id,
        person: conversation.participant,
        name: conversation.participant.nickname,
        message: conversation.lastMessage?.text || 'Start a conversation',
        time: conversation.lastMessage?.createdAt || conversation.updatedAt,
        type: conversation.lastMessage?.type,
        unreadCount: conversation.unreadCount || 0,
      })));
    } catch (_) {
      toast('Could not load conversations.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadConversations();
  }, [loadConversations]));

  useEffect(() => {
    let active = true;
    const connectRealtime = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        socket.current = createPresenceSocket(await getIdToken(user));
        socket.current.on('chat:updated', () => active && loadConversations());
      } catch (_) {}
    };
    connectRealtime();
    return () => { active = false; socket.current?.disconnect(); };
  }, [loadConversations]);

  const toggleSearch = () => setSearchOpen(open => !open);
  const closeSearch = () => { setSearchOpen(false); setQuery(''); };
  const visibleChats = useMemo(() => chats.filter(chat => {
    const matchesFilter = filter === 'All' || (filter === 'Unread' && chat.unreadCount > 0) || (filter === 'Calls' && ['call', 'video'].includes(chat.type));
    return matchesFilter && chat.name.toLowerCase().includes(query.toLowerCase());
  }), [chats, filter, query]);

  const totalUnread = chats.reduce((total, chat) => total + chat.unreadCount, 0);

  const renderChat = ({item, index}) => {
    const person = item.person;
    const online = person.isOnline === true;
    return <Pressable onPress={() => navigation.navigate('ChatConversation', {person, chatId: item.id})} style={[styles.chatRow, index === visibleChats.length - 1 && styles.lastChatRow]}>
      <View style={styles.avatarRing}><View style={styles.avatar}><ProfileAvatar {...(person.avatarStyle || person)} name={item.name} photoUrl={person.photoUrl} /><View style={[styles.onlineDot, !online && styles.offlineDot]} /></View></View>
      <View style={styles.chatCopy}><View style={styles.nameLine}><Text style={styles.name}>{item.name}</Text><View style={styles.statusLine}><View style={[styles.statusDot, !online && styles.offlineDot]} /><Text style={[styles.status, online && styles.onlineText]}>{online ? 'Online' : 'Offline'}</Text></View></View><Text numberOfLines={1} style={styles.message}>{item.message}</Text></View>
      <View style={styles.rightMeta}><Text style={styles.time}>{chatTime(item.time)}</Text>{item.unreadCount ? <View style={styles.messageBadge}><Text style={styles.messageBadgeText}>{item.unreadCount}</Text></View> : item.type === 'call' ? <Phone size={15} color="#B255FF" fill="#B255FF" /> : item.type === 'video' ? <Video size={16} color="#B255FF" fill="#B255FF" /> : <ChevronRight size={17} color="#9D94B4" />}</View>
    </Pressable>;
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#090A22" />
    <View style={styles.content}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>MILO MESSAGES</Text><Text style={styles.title}>Chats</Text><Text style={styles.subtitle}>Keep the conversations going!</Text></View><Pressable onPress={toggleSearch} style={styles.searchIcon}><Search size={21} color="#F8F3FF" /></Pressable></View>
      
      <View style={styles.filters}>{filters.map(item => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}>{item === 'Calls' ? <Phone size={14} color={filter === item ? '#FFFFFF' : '#B7B1CC'} /> : <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item}</Text>}{item === 'Unread' && totalUnread > 0 && <View style={styles.unreadCount}><Text style={styles.unreadCountText}>{totalUnread > 99 ? '99+' : totalUnread}</Text></View>}</Pressable>)}</View>
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color="#B254FF" /></View> : <FlatList data={visibleChats} keyExtractor={item => item.id} renderItem={renderChat} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No conversations yet</Text><Text style={styles.emptyText}>Start a chat from MILO Connect to see it here.</Text></View>} />}
    </View>
    <Modal transparent animationType="slide" visible={searchOpen} onRequestClose={closeSearch} statusBarTranslucent>
      <View style={styles.searchOverlay}>
        <Pressable accessibilityLabel="Close search" onPress={closeSearch} style={styles.searchBackdrop} />
        <View style={styles.searchSheet}>
          <View style={styles.searchBox}><Search size={19} color="#C8BBE1" /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search chats..." placeholderTextColor="#938CA5" style={styles.searchInput} /><Pressable accessibilityLabel="Close search" onPress={closeSearch} style={styles.closeSearch}><X size={19} color="#C8BBE1" /></Pressable></View>
        </View>      </View>
    </Modal>
    <View style={styles.bottomBar}><Gradient from="#28214C" to="#0A0B17" radius={22} opacity={0.84} />{tabs.map(({label, icon: Icon}) => <Pressable key={label} onPress={() => label === 'Home' ? navigation.navigate('Home') : label === 'Profile' ? navigation.navigate('Profile') : label !== 'Chats' && toast(`${label} is coming soon`)} style={styles.tab}><View><Icon size={22} color={label === 'Chats' ? '#C05DFF' : '#C5BED3'} fill="none" /></View><Text style={[styles.tabText, label === 'Chats' && styles.activeTabText]}>{label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  searchOverlay: {flex: 1, backgroundColor: 'rgba(2,2,9,0.76)', paddingHorizontal: 16, paddingTop: 68},
  searchBackdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
  searchSheet: {borderRadius: 18, borderWidth: 1, borderColor: '#8153C7', backgroundColor: '#17132C', padding: 10, elevation: 20, shadowColor: '#000000', shadowOpacity: 0.58, shadowRadius: 18, shadowOffset: {width: 0, height: 8}},
  sheetHandle: {width: 39, height: 4, borderRadius: 2, backgroundColor: '#A68CC9', alignSelf: 'center', marginTop: 10, marginBottom: 13},
  searchSheetHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
  searchSheetTitle: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 19},
  searchSheetSubtitle: {fontFamily: 'Poppins-Regular', color: '#B9B0C7', fontSize: 10, marginTop: -2},
  closeSearch: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#37244F', alignItems: 'center', justifyContent: 'center'},
  recentHeader: {marginTop: 17, marginBottom: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  recentTitle: {fontFamily: 'Poppins-Medium', color: '#F3EDFB', fontSize: 11}, clearAll: {color: '#C06CFF', fontSize: 10, fontFamily: 'Poppins-Medium'},
  recentRow: {height: 46, borderBottomWidth: 1, borderColor: '#2D2743', flexDirection: 'row', alignItems: 'center', gap: 10},
  recentAvatar: {width: 33, height: 33, borderRadius: 17, overflow: 'hidden'}, recentName: {flex: 1, color: '#F6F0FC', fontFamily: 'Poppins-Medium', fontSize: 11},
  screen: {flex: 1, backgroundColor: '#080910'}, content: {flex: 1, paddingHorizontal: 20, paddingTop: 15}, header: {minHeight: 87, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4}, title: {fontFamily: 'Poppins-SemiBold', fontSize: 29, color: '#F7F2FF'}, subtitle: {fontFamily: 'Poppins-Regular', fontSize: 12, color: '#A9A4BC', marginTop: -2}, eyebrow: {fontFamily: 'Poppins-SemiBold', letterSpacing: 1.3, color: '#BC79FF', fontSize: 8, marginBottom: -3}, searchIcon: {width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#634B87', backgroundColor: 'rgba(31,22,56,0.7)', alignItems: 'center', justifyContent: 'center'}, searchBox: {height: 47, borderRadius: 16, backgroundColor: '#1E1B4C', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8}, searchInput: {flex: 1, color: '#FFFFFF', fontFamily: 'Poppins-Regular', fontSize: 12, padding: 0}, filters: {flexDirection: 'row', gap: 9, marginTop: 6, padding: 5, borderRadius: 20, backgroundColor: 'rgba(13,13,31,0.66)', borderWidth: 1, borderColor: '#282647'}, filter: {flex: 1, height: 36, borderRadius: 18, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6}, activeFilter: {backgroundColor: '#9237F8', shadowColor: '#9B40FF', shadowOpacity: 0.38, shadowRadius: 8, shadowOffset: {width: 0, height: 3}}, filterText: {fontFamily: 'Poppins-Medium', color: '#B7B1CC', fontSize: 11}, activeFilterText: {color: '#FFFFFF'}, unreadCount: {minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, backgroundColor: '#F43B73', alignItems: 'center', justifyContent: 'center'}, unreadCountText: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 8}, loading: {flex: 1, alignItems: 'center', justifyContent: 'center'}, list: {paddingTop: 15, paddingBottom: 108}, empty: {paddingTop: 80, alignItems: 'center'}, emptyTitle: {fontFamily: 'Poppins-SemiBold', color: '#F3ECFB', fontSize: 16}, emptyText: {color: '#AAA4B9', fontSize: 11, marginTop: 6, textAlign: 'center'}, chatRow: {minHeight: 76, borderBottomWidth: 1, borderColor: '#24233A', flexDirection: 'row', alignItems: 'center', paddingVertical: 10}, lastChatRow: {borderBottomWidth: 0}, avatarRing: {width: 54, height: 54, borderRadius: 27, padding: 2, backgroundColor: '#9150E8'}, avatar: {width: 50, height: 50, borderRadius: 25, overflow: 'hidden'}, onlineDot: {position: 'absolute', right: 0, top: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, borderColor: '#080910', backgroundColor: '#22E994'}, offlineDot: {backgroundColor: '#777289'}, chatCopy: {flex: 1, minWidth: 0, marginLeft: 12}, nameLine: {flexDirection: 'row', alignItems: 'center', gap: 7}, name: {fontFamily: 'Poppins-SemiBold', color: '#FAF6FF', fontSize: 14}, statusLine: {flexDirection: 'row', alignItems: 'center', gap: 3}, statusDot: {width: 5, height: 5, borderRadius: 3, backgroundColor: '#22E994'}, status: {fontSize: 9, color: '#8B8599'}, onlineText: {color: '#26DFA0'}, message: {fontFamily: 'Poppins-Regular', color: '#C9C3D6', fontSize: 11, marginTop: 3}, rightMeta: {width: 48, alignItems: 'flex-end', gap: 6}, time: {fontSize: 9, color: '#9790A9'}, messageBadge: {width: 18, height: 18, borderRadius: 9, backgroundColor: '#F23873', alignItems: 'center', justifyContent: 'center'}, messageBadgeText: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 9}, bottomBar: {position: 'absolute', left: 10, right: 10, bottom: 8, height: 76, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(179, 151, 230, 0.58)', backgroundColor: '#0D0E1C', overflow: 'hidden', shadowColor: '#000000', shadowOpacity: 0.42, shadowRadius: 12, shadowOffset: {width: 0, height: 5}, elevation: 12, flexDirection: 'row', paddingTop: 12}, tab: {flex: 1, alignItems: 'center', gap: 5, minWidth: 0}, tabText: {color: '#C5BED3', fontSize: 9, textAlign: 'center'}, activeTabText: {color: '#CE88FF', fontFamily: 'Poppins-Medium'},
});
