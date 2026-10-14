import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Image, Modal, Pressable, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Bell, ChevronRight, House, MessageCircle, Phone, Plus, Search, Sparkles, UserRound, Video, X, Zap} from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import {Coin, Gradient} from '../../components/home/HomeDecor';
import ChatMatchModal from '../../components/chat/ChatMatchModal';
import {useToast} from '../../components/ui/ToastProvider';
import {getConversations} from '../../services/chatService';
import {createPresenceSocket} from '../../services/socketService';
import {getAuth, getIdToken} from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';
import {getMyProfile} from '../../services/userService';

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
  const [profile, setProfile] = useState(null);
  const [matchOpen, setMatchOpen] = useState(false);
  const socket = useRef(null);

  useEffect(() => { getMyProfile().then(setProfile).catch(() => {}); }, []);

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
  const chattedIds = useMemo(() => new Set(chats.map(chat => chat.person?._id).filter(Boolean)), [chats]);
  const openMatchedChat = person => {
    setMatchOpen(false);
    navigation.navigate('ChatConversation', {person});
  };
  const showStartPrompt = filter === 'All' && !query;

  const renderChat = ({item, index}) => {
    const person = item.person;
    const online = person.isOnline === true;
    return <Pressable onPress={() => navigation.navigate('ChatConversation', {person, chatId: item.id})} style={[styles.chatRow, index === visibleChats.length - 1 && styles.lastChatRow]}>
      <View style={styles.avatarRing}><View style={styles.avatar}><ProfileAvatar {...(person.avatarStyle || person)} name={item.name} photoUrl={person.photoUrl} /><View style={[styles.onlineDot, !online && styles.offlineDot]} /></View></View>
      <View style={styles.chatCopy}><View style={styles.nameLine}><Text numberOfLines={1} style={[styles.name, item.unreadCount > 0 && styles.unreadName]}>{item.name}</Text>{online && <Text style={styles.onlineLabel}>Online</Text>}</View><Text numberOfLines={1} style={[styles.message, item.unreadCount > 0 && styles.unreadMessage]}>{item.message}</Text></View>
      <View style={styles.rightMeta}><Text style={[styles.time, item.unreadCount > 0 && styles.unreadTime]}>{chatTime(item.time)}</Text>{item.unreadCount ? <View style={styles.messageBadge}><Text style={styles.messageBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text></View> : item.type === 'call' ? <Phone size={15} color="#B255FF" fill="#B255FF" /> : item.type === 'video' ? <Video size={16} color="#B255FF" fill="#B255FF" /> : <ChevronRight size={17} color="#9D94B4" />}</View>
    </Pressable>;
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#090A22" />
    <View style={styles.content}>
      <View style={styles.topBar}><View style={styles.myAvatar}><ProfileAvatar {...(profile?.avatarStyle || {avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender || 'female'})} name={profile?.nickname || 'You'} photoUrl={profile?.photoUrl} /><View style={styles.myOnlineDot} /></View><View style={styles.topSpacer} /><Pressable accessibilityLabel="Buy coins" onPress={() => navigation.navigate('CoinStore')} style={styles.wallet}><Coin size={19} /><Text style={styles.walletBalance}>{profile?.coinBalance ?? 0}</Text><View style={styles.walletPlus}><Plus size={14} color="#F2DEFF" /></View></Pressable><Pressable accessibilityLabel="Notifications" onPress={() => toast('Notifications are coming soon')} style={styles.bell}><Bell size={20} color="#E8E2F4" /><View style={styles.notificationDot} /></Pressable></View>
      <View style={styles.header}><View><Text style={styles.title}>Chats</Text><Text style={styles.subtitle}>Keep the conversations going!</Text></View><Pressable onPress={toggleSearch} style={styles.searchIcon}><Search size={19} color="#F8F3FF" /></Pressable></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Connect Best, chat with someone online now" onPress={() => setMatchOpen(true)} style={({pressed}) => [styles.connectBest, pressed && styles.pressed]}>
        <Gradient from="#7C2BEA" to="#2A0F5C" radius={20} glow />
        <View style={styles.connectBestIcon}><Zap size={22} color="#FFE16A" fill="#FFE16A" /></View>
        <View style={styles.connectBestCopy}><View style={styles.connectBestTitleRow}><Text style={styles.connectBestTitle}>Connect Best</Text><View style={styles.liveChip}><View style={styles.liveChipDot} /><Text style={styles.liveChipText}>LIVE</Text></View></View><Text style={styles.connectBestText}>Chat instantly with someone online</Text></View>
        <View style={styles.connectBestCta}><ChevronRight size={20} color="#2A0F5C" strokeWidth={3} /></View>
      </Pressable>
      <View style={styles.filters}>{filters.map(item => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}>{item === 'Calls' ? <Phone size={14} color={filter === item ? '#FFFFFF' : '#B7B1CC'} /> : <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item}</Text>}{item === 'Unread' && totalUnread > 0 && <View style={styles.unreadCount}><Text style={styles.unreadCountText}>{totalUnread > 99 ? '99+' : totalUnread}</Text></View>}</Pressable>)}</View>
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color="#B254FF" /></View> : <FlatList data={visibleChats} keyExtractor={item => item.id} renderItem={renderChat} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><MessageCircle size={30} color="#B776FF" /></View><Text style={styles.emptyTitle}>{showStartPrompt ? 'No conversations yet' : 'Nothing here'}</Text><Text style={styles.emptyText}>{showStartPrompt ? 'Tap Connect Best to start chatting with someone online.' : 'Try a different filter or search.'}</Text>{showStartPrompt && <Pressable onPress={() => setMatchOpen(true)} style={({pressed}) => [styles.emptyButton, pressed && styles.pressed]}><Zap size={16} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.emptyButtonText}>Connect Best</Text></Pressable>}</View>} />}
    </View>
    <ChatMatchModal visible={matchOpen} self={profile} excludeIds={chattedIds} onClose={() => setMatchOpen(false)} onMatch={openMatchedChat} />
    <Modal transparent animationType="slide" visible={searchOpen} onRequestClose={closeSearch} statusBarTranslucent>
      <View style={styles.searchOverlay}>
        <Pressable accessibilityLabel="Close search" onPress={closeSearch} style={styles.searchBackdrop} />
        <View style={styles.searchSheet}>
          <View style={styles.searchBox}><Search size={19} color="#C8BBE1" /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search chats..." placeholderTextColor="#938CA5" style={styles.searchInput} /><Pressable accessibilityLabel="Close search" onPress={closeSearch} style={styles.closeSearch}><X size={19} color="#C8BBE1" /></Pressable></View>
        </View>      </View>
    </Modal>
    <View style={styles.bottomBar}>{tabs.map(({label, icon: Icon}) => <Pressable key={label} onPress={() => label === 'Home' ? navigation.navigate('Home') : label === 'Profile' ? navigation.navigate('Profile') : label === 'MILO Special' ? navigation.navigate('MiloSpecial') : label !== 'Chats' && toast(`${label} is coming soon`)} style={styles.tab}><View>{label === 'Chats' ? <Image source={require('../../../assets/icons/message.png')} style={styles.tabMessageIcon} resizeMode="contain" /> : <Icon size={24} color="#C5BED3" fill="none" />}</View><Text style={[styles.tabText, label === 'Chats' && styles.activeTabText]}>{label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#080910'},
  content: {flex: 1, paddingHorizontal: 18, paddingTop: 12},
  topBar: {height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3},
  myAvatar: {width: 42, height: 42, borderRadius: 21, overflow: 'visible'},
  myOnlineDot: {position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#080910', backgroundColor: '#20E68A'},
  topSpacer: {flex: 1},
  wallet: {height: 35, borderRadius: 18, borderWidth: 1, borderColor: '#584273', backgroundColor: 'rgba(24, 22, 45, 0.92)', paddingLeft: 8, paddingRight: 4, flexDirection: 'row', alignItems: 'center', gap: 5},
  walletBalance: {fontFamily: 'Poppins-SemiBold', color: '#FFE16A', fontSize: 12},
  walletPlus: {width: 21, height: 21, borderRadius: 11, backgroundColor: '#593491', alignItems: 'center', justifyContent: 'center'},
  bell: {marginLeft: 12, padding: 4},
  notificationDot: {position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F14970', borderWidth: 1, borderColor: '#080910'},
  header: {height: 75, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3},
  title: {fontFamily: 'Poppins-SemiBold', fontSize: 30, lineHeight: 35, color: '#F7F2FF'},
  subtitle: {fontFamily: 'Poppins-Regular', fontSize: 11, color: '#AAA5BA', marginTop: 1},
  searchIcon: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#18172C', borderWidth: 1, borderColor: '#37324D', alignItems: 'center', justifyContent: 'center'},
  pressed: {opacity: 0.88, transform: [{scale: 0.98}]},
  connectBest: {minHeight: 78, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(205,150,255,0.45)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12, marginTop: 4},
  connectBestIcon: {width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(10,4,30,0.4)', alignItems: 'center', justifyContent: 'center'},
  connectBestCopy: {flex: 1, minWidth: 0},
  connectBestTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  connectBestTitle: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 16},
  liveChip: {flexDirection: 'row', alignItems: 'center', gap: 4, height: 18, paddingHorizontal: 7, borderRadius: 9, backgroundColor: 'rgba(33,230,161,0.18)'},
  liveChipDot: {width: 5, height: 5, borderRadius: 3, backgroundColor: '#21E6A1'},
  liveChipText: {fontFamily: 'Poppins-SemiBold', color: '#5EF2B5', fontSize: 8, letterSpacing: 0.8},
  connectBestText: {fontFamily: 'Poppins-Regular', color: '#E4D4FF', fontSize: 11, marginTop: 1},
  connectBestCta: {width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFE16A', alignItems: 'center', justifyContent: 'center'},
  filters: {flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 10},
  filter: {height: 36, flex: 1, borderRadius: 18, backgroundColor: '#18172C', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6},
  activeFilter: {backgroundColor: '#8737F4'},
  filterText: {fontFamily: 'Poppins-Medium', color: '#C7C0D4', fontSize: 12},
  activeFilterText: {color: '#FFFFFF'},
  unreadCount: {minWidth: 14, height: 14, paddingHorizontal: 3, borderRadius: 7, backgroundColor: '#EE4471', alignItems: 'center', justifyContent: 'center'},
  unreadCountText: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 7},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  list: {paddingTop: 4, paddingBottom: 102},
  empty: {paddingTop: 56, alignItems: 'center'},
  emptyIcon: {width: 68, height: 68, borderRadius: 34, backgroundColor: '#1A1733', alignItems: 'center', justifyContent: 'center', marginBottom: 14},
  emptyButton: {marginTop: 18, height: 44, paddingHorizontal: 22, borderRadius: 22, backgroundColor: '#8737F4', flexDirection: 'row', alignItems: 'center', gap: 7},
  emptyButtonText: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 13},
  emptyTitle: {fontFamily: 'Poppins-SemiBold', color: '#F3ECFB', fontSize: 16},
  emptyText: {color: '#AAA4B9', fontSize: 12, marginTop: 6, textAlign: 'center', maxWidth: 260},
  chatRow: {height: 74, borderBottomWidth: 1, borderColor: '#1D1D2E', flexDirection: 'row', alignItems: 'center'},
  lastChatRow: {borderBottomWidth: 0},
  avatarRing: {width: 54, height: 54, borderRadius: 27, padding: 2, backgroundColor: '#A453E8'},
  avatar: {width: 50, height: 50, borderRadius: 25, overflow: 'hidden'},
  onlineDot: {position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#080910', backgroundColor: '#22E994'},
  offlineDot: {backgroundColor: '#F5C542'},
  chatCopy: {flex: 1, minWidth: 0, marginLeft: 12},
  nameLine: {flexDirection: 'row', alignItems: 'center', gap: 8},
  name: {fontFamily: 'Poppins-SemiBold', color: '#FAF6FF', fontSize: 14, flexShrink: 1},
  unreadName: {fontFamily: 'Poppins-Bold', color: '#FFFFFF'},
  onlineLabel: {fontFamily: 'Poppins-Medium', color: '#22E994', fontSize: 10},
  message: {fontFamily: 'Poppins-Regular', color: '#A9A2BA', fontSize: 12, marginTop: 2},
  unreadMessage: {fontFamily: 'Poppins-Medium', color: '#F1EAFF'},
  rightMeta: {width: 52, alignItems: 'flex-end', gap: 6},
  time: {fontFamily: 'Poppins-Regular', fontSize: 10, color: '#A79ABF'},
  unreadTime: {color: '#C88BFF'},
  messageBadge: {minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: '#8847E8', alignItems: 'center', justifyContent: 'center'},
  messageBadgeText: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 10},
  bottomBar: {position: 'absolute', left: 10, right: 10, bottom: 7, height: 68, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(129, 108, 168, 0.58)', backgroundColor: 'rgba(17, 19, 30, 0.94)', shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 10, flexDirection: 'row', paddingTop: 9},
  tab: {flex: 1, alignItems: 'center', gap: 4, minWidth: 0},
  tabMessageIcon: {width: 23, height: 23, tintColor: '#C05DFF'},
  tabText: {color: '#C5BED3', fontSize: 9, textAlign: 'center'},
  activeTabText: {color: '#CE88FF', fontFamily: 'Poppins-Medium'},
  searchOverlay: {flex: 1, backgroundColor: 'rgba(2,2,9,0.76)', paddingHorizontal: 16, paddingTop: 68},
  searchBackdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
  searchSheet: {borderRadius: 18, borderWidth: 1, borderColor: '#8153C7', backgroundColor: '#17132C', padding: 10, elevation: 20, shadowColor: '#000000', shadowOpacity: 0.58, shadowRadius: 18, shadowOffset: {width: 0, height: 8}},
  searchBox: {height: 47, borderRadius: 16, backgroundColor: '#1E1B4C', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8},
  searchInput: {flex: 1, color: '#FFFFFF', fontFamily: 'Poppins-Regular', fontSize: 12, padding: 0},
  closeSearch: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#37244F', alignItems: 'center', justifyContent: 'center'},
});
