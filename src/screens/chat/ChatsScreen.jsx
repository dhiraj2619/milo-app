import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Camera, House, MessageCircle, Phone, Plus, Search, Sparkles, UserRound, X} from 'lucide-react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import {Coin} from '../../components/home/HomeDecor';
import ChatMatchModal from '../../components/chat/ChatMatchModal';
import {useToast} from '../../components/ui/ToastProvider';
import {getConversations} from '../../services/chatService';
import {createPresenceSocket} from '../../services/socketService';
import {getAuth, getIdToken} from '@react-native-firebase/auth';
import {useFocusEffect} from '@react-navigation/native';
import {getDiscoverProfiles, getMyProfile, uploadProfilePhoto} from '../../services/userService';

const SECTIONS = ['Chat', 'Available'];
const FILTERS = ['All', 'Your turn', 'Sent'];
const tabs = [{label: 'Home', icon: House}, {label: 'Chats', icon: MessageCircle}, {label: 'MILO Special', icon: Sparkles}, {label: 'Connect', icon: Phone}, {label: 'Profile', icon: UserRound}];
const RING_COLORS = ['#C084FC', '#F472B6', '#5EE7FF', '#FFC861', '#34D399', '#A78BFA'];
const LANGUAGE_LABELS = {Hindi: 'हिंदी', Marathi: 'मराठी', Bengali: 'বাংলা', Tamil: 'தமிழ்', Telugu: 'తెలుగు', Gujarati: 'ગુજરાતી', Kannada: 'ಕನ್ನಡ', English: 'English'};

const ringFor = key => RING_COLORS[[...String(key || '')].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 997, 7) % RING_COLORS.length];
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
function chatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (days <= 0) return date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  if (days === 1) return 'Yesterday';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
}

export default function ChatsScreen({navigation}) {
  const toast = useToast();
  const [section, setSection] = useState('Chat');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const socket = useRef(null);

  useEffect(() => { getMyProfile().then(setProfile).catch(() => {}); }, []);

  const loadConversations = useCallback(async () => {
    try {
      const currentUid = getAuth().currentUser?.uid;
      const conversations = await getConversations();
      setChats(conversations.map(conversation => ({
        id: conversation.id,
        person: conversation.participant,
        name: conversation.participant.nickname,
        message: conversation.lastMessage?.text || 'Start a conversation',
        mine: Boolean(currentUid) && conversation.lastMessage?.senderFirebaseUid === currentUid,
        hasMessage: Boolean(conversation.lastMessage),
        time: conversation.lastMessage?.createdAt || conversation.updatedAt,
        unreadCount: conversation.unreadCount || 0,
      })));
    } catch (_) {
      toast('Could not load conversations.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadAvailable = useCallback(async () => {
    setLoadingAvailable(true);
    try {
      const data = await getDiscoverProfiles({page: 1, limit: 40});
      setAvailable((data.users || []).filter(person => person.isOnline === true));
    } catch (_) {
      toast('Could not load available members.');
    } finally {
      setLoadingAvailable(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadConversations();
  }, [loadConversations]));
  useEffect(() => { if (section === 'Available') loadAvailable(); }, [loadAvailable, section]);

  useEffect(() => {
    let active = true;
    const connectRealtime = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        socket.current = createPresenceSocket(await getIdToken(user));
        socket.current.on('chat:updated', () => active && loadConversations());
        socket.current.on('user:presence', presence => {
          if (!active) return;
          setAvailable(current => presence.isOnline ? current : current.filter(person => person.firebaseUid !== presence.firebaseUid));
        });
      } catch (_) {}
    };
    connectRealtime();
    return () => { active = false; socket.current?.disconnect(); };
  }, [loadConversations]);

  const changeProfilePhoto = async () => {
    if (uploadingPhoto) return;
    const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1, quality: 0.8, maxWidth: 1200, maxHeight: 1200});
    if (result.didCancel) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) { Alert.alert('Photo unavailable', 'Please choose another image.'); return; }
    const previousPhoto = profile?.photoUrl;
    setProfile(current => ({...current, photoUrl: asset.uri}));
    setUploadingPhoto(true);
    try {
      const updated = await uploadProfilePhoto(asset);
      if (updated) setProfile(current => ({...current, ...updated}));
      toast('Profile photo updated');
    } catch (error) {
      setProfile(current => ({...current, photoUrl: previousPhoto}));
      toast(error.response?.data?.message || 'Could not upload your photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const closeSearch = () => { setSearchOpen(false); setQuery(''); };
  const matchesQuery = name => (name || '').toLowerCase().includes(query.toLowerCase());
  const visibleChats = useMemo(() => chats.filter(chat => {
    const matchesFilter = filter === 'All' || (filter === 'Your turn' && chat.hasMessage && !chat.mine) || (filter === 'Sent' && chat.mine);
    return matchesFilter && (chat.name || '').toLowerCase().includes(query.toLowerCase());
  }), [chats, filter, query]);
  const yourTurnCount = chats.filter(chat => chat.hasMessage && !chat.mine).length;
  const chattedIds = useMemo(() => new Set(chats.map(chat => chat.person?._id).filter(Boolean)), [chats]);
  const visibleAvailable = available.filter(person => matchesQuery(person.nickname));
  const openMatchedChat = person => {
    setMatchOpen(false);
    navigation.navigate('ChatConversation', {person});
  };
  const showStartPrompt = filter === 'All' && !query;

  const renderAvatar = (person, name) => <View style={[styles.avatarRing, {borderColor: ringFor(person?._id || name)}]}>
    <View style={styles.avatar}><ProfileAvatar {...(person?.avatarStyle || person)} name={name} photoUrl={person?.photoUrl} /></View>
    {person?.isOnline === true && <View style={styles.onlineDot} />}
  </View>;

  const renderChat = ({item}) => {
    const unread = item.unreadCount > 0;
    return <Pressable onPress={() => navigation.navigate('ChatConversation', {person: item.person, chatId: item.id})} style={({pressed}) => [styles.row, pressed && styles.rowPressed]}>
      {renderAvatar(item.person, item.name)}
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={[styles.name, unread && styles.unreadName]}>{item.name}</Text>
        <Text numberOfLines={1} style={[styles.message, unread && styles.unreadMessage]}>{item.mine ? `You: ${item.message}` : item.message}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={[styles.time, unread && styles.unreadTime]}>{chatTime(item.time)}</Text>
        {unread && <View style={styles.badge}><Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text></View>}
      </View>
    </Pressable>;
  };

  const renderAvailable = ({item}) => {
    const name = item.nickname || 'MILO member';
    return <Pressable onPress={() => navigation.navigate('ChatConversation', {person: item})} style={({pressed}) => [styles.row, pressed && styles.rowPressed]}>
      {renderAvatar(item, name)}
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.name}>{name}{item.age ? `, ${item.age}` : ''}</Text>
        <Text numberOfLines={1} style={styles.message}>{(item.languages || ['English']).slice(0, 2).map(language => LANGUAGE_LABELS[language] || language).join(' · ')}</Text>
      </View>
      <View style={styles.chatButton}><MessageCircle size={14} color="#FFFFFF" /><Text style={styles.chatButtonText}>Chat</Text></View>
    </Pressable>;
  };

  const emptyChats = <View style={styles.empty}>
    <View style={styles.emptyIcon}><MessageCircle size={30} color="#B776FF" /></View>
    <Text style={styles.emptyTitle}>{showStartPrompt ? 'No conversations yet' : filter === 'Your turn' ? "You're all caught up" : 'Nothing here'}</Text>
    <Text style={styles.emptyText}>{showStartPrompt ? 'Tap Find MILO to start chatting with someone online.' : filter === 'Your turn' ? 'No one is waiting for your reply.' : 'Try a different filter or search.'}</Text>
    {showStartPrompt && <Pressable onPress={() => setMatchOpen(true)} style={({pressed}) => [styles.emptyButton, pressed && styles.pressed]}><Search size={16} color="#FFFFFF" /><Text style={styles.emptyButtonText}>Find MILO</Text></Pressable>}
  </View>;
  const emptyAvailable = <View style={styles.empty}>
    <View style={styles.emptyIcon}><UserRound size={30} color="#B776FF" /></View>
    <Text style={styles.emptyTitle}>No one is online right now</Text>
    <Text style={styles.emptyText}>New people join MILO every day. Check back soon.</Text>
  </View>;

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#080910" />
    <View style={styles.content}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={changeProfilePhoto} style={styles.myAvatarButton}>
          <View style={styles.myAvatar}><ProfileAvatar {...(profile?.avatarStyle || {avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender || 'female'})} name={profile?.nickname || 'You'} photoUrl={profile?.photoUrl} /></View>
          {uploadingPhoto ? <View style={styles.myAvatarUploading}><ActivityIndicator size="small" color="#FFFFFF" /></View> : <View style={styles.cameraBadge}><Camera size={10} color="#FFFFFF" /></View>}
        </Pressable>
        <Pressable accessibilityLabel="Buy coins" onPress={() => navigation.navigate('CoinStore')} style={styles.wallet}><Coin size={20} /><Text style={styles.walletBalance}>{profile?.coinBalance ?? 0}</Text><View style={styles.walletPlus}><Plus size={13} color="#F2DEFF" /></View></Pressable>
        <View style={styles.flex} />
        <Pressable accessibilityRole="button" accessibilityLabel="Search" hitSlop={6} onPress={() => setSearchOpen(true)} style={styles.searchIcon}><Search size={18} color="#F8F3FF" /></Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Find MILO, chat with someone online now" onPress={() => setMatchOpen(true)} style={({pressed}) => [styles.findButton, pressed && styles.pressed]}>
          <View style={styles.findIcon}><Search size={13} color="#FFFFFF" strokeWidth={2.6} /></View>
          <Text style={styles.findText}>Find MILO</Text>
        </Pressable>
      </View>

      <View style={styles.sections}>
        {SECTIONS.map(item => {
          const active = item === section;
          return <Pressable key={item} accessibilityRole="tab" accessibilityState={{selected: active}} onPress={() => setSection(item)} style={styles.sectionTab}>
            <Text style={[styles.sectionText, active && styles.sectionTextActive]}>{item}</Text>
            {active && <View style={styles.sectionIndicator} />}
          </Pressable>;
        })}
      </View>

      {section === 'Chat' ? <>
        <View style={styles.filters}>{FILTERS.map(item => {
          const active = filter === item;
          return <Pressable key={item} accessibilityRole="tab" accessibilityState={{selected: active}} onPress={() => setFilter(item)} style={[styles.filter, active && styles.activeFilter]}>
            <Text style={[styles.filterText, active && styles.activeFilterText]}>{item}</Text>
            {item === 'Your turn' && yourTurnCount > 0 && <View style={[styles.filterCount, active && styles.filterCountActive]}><Text style={styles.filterCountText}>{yourTurnCount > 99 ? '99+' : yourTurnCount}</Text></View>}
          </Pressable>;
        })}</View>
        {loading ? <View style={styles.loading}><ActivityIndicator size="large" color="#B254FF" /></View> : <FlatList data={visibleChats} keyExtractor={item => item.id} renderItem={renderChat} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} ListEmptyComponent={emptyChats} />}
      </> : loadingAvailable && !available.length ? <View style={styles.loading}><ActivityIndicator size="large" color="#B254FF" /></View> : <FlatList data={visibleAvailable} keyExtractor={item => item._id || item.firebaseUid} renderItem={renderAvailable} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} refreshing={loadingAvailable} onRefresh={loadAvailable} ListHeaderComponent={visibleAvailable.length ? <View style={styles.availableHeader}><View style={styles.availableDot} /><Text style={styles.availableHeaderText}>{visibleAvailable.length} online now</Text></View> : null} ListEmptyComponent={emptyAvailable} />}
    </View>

    <ChatMatchModal visible={matchOpen} self={profile} excludeIds={chattedIds} onClose={() => setMatchOpen(false)} onMatch={openMatchedChat} />
    <Modal transparent animationType="slide" visible={searchOpen} onRequestClose={closeSearch} statusBarTranslucent>
      <View style={styles.searchOverlay}>
        <Pressable accessibilityLabel="Close search" onPress={closeSearch} style={styles.searchBackdrop} />
        <View style={styles.searchSheet}>
          <View style={styles.searchBox}><Search size={19} color="#C8BBE1" /><TextInput autoFocus value={query} onChangeText={setQuery} placeholder={section === 'Chat' ? 'Search chats...' : 'Search available members...'} placeholderTextColor="#938CA5" style={styles.searchInput} returnKeyType="search" onSubmitEditing={() => setSearchOpen(false)} /><Pressable accessibilityLabel="Clear search" onPress={closeSearch} style={styles.closeSearch}><X size={19} color="#C8BBE1" /></Pressable></View>
        </View>
      </View>
    </Modal>
    <View style={styles.bottomBar}>{tabs.map(({label, icon: Icon}) => <Pressable key={label} onPress={() => label === 'Home' ? navigation.navigate('Home') : label === 'Profile' ? navigation.navigate('Profile') : label === 'MILO Special' ? navigation.navigate('MiloSpecial') : label !== 'Chats' && toast(`${label} is coming soon`)} style={styles.tab}><View>{label === 'Chats' ? <Image source={require('../../../assets/icons/message.png')} style={styles.tabMessageIcon} resizeMode="contain" /> : <Icon size={24} color="#C5BED3" fill="none" />}</View><Text style={[styles.tabText, label === 'Chats' && styles.activeTabText]}>{label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#080910'},
  content: {flex: 1, paddingHorizontal: 18, paddingTop: 10},
  flex: {flex: 1},
  pressed: {opacity: 0.88, transform: [{scale: 0.97}]},
  topBar: {height: 54, flexDirection: 'row', alignItems: 'center', gap: 10},
  myAvatarButton: {width: 44, height: 44},
  myAvatar: {width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: '#A453E8'},
  cameraBadge: {position: 'absolute', right: -3, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#8737F4', borderWidth: 2, borderColor: '#080910', alignItems: 'center', justifyContent: 'center'},
  myAvatarUploading: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 22, backgroundColor: 'rgba(8,9,16,0.6)', alignItems: 'center', justifyContent: 'center'},
  wallet: {height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#584273', backgroundColor: 'rgba(24, 22, 45, 0.92)', paddingLeft: 7, paddingRight: 4, flexDirection: 'row', alignItems: 'center', gap: 5},
  walletBalance: {fontFamily: 'Poppins-SemiBold', color: '#FFE16A', fontSize: 13},
  walletPlus: {width: 22, height: 22, borderRadius: 11, backgroundColor: '#593491', alignItems: 'center', justifyContent: 'center'},
  searchIcon: {width: 38, height: 38, borderRadius: 19, backgroundColor: '#18172C', borderWidth: 1, borderColor: '#37324D', alignItems: 'center', justifyContent: 'center'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10},
  title: {fontFamily: 'Poppins-SemiBold', fontSize: 28, lineHeight: 36, color: '#F7F2FF'},
  findButton: {height: 40, borderRadius: 20, paddingLeft: 5, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(232,121,249,0.16)', borderWidth: 1.5, borderColor: '#E879F9'},
  findIcon: {width: 28, height: 28, borderRadius: 14, backgroundColor: '#C026D3', alignItems: 'center', justifyContent: 'center'},
  findText: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14},
  sections: {flexDirection: 'row', gap: 26, marginTop: 14, borderBottomWidth: 1, borderBottomColor: '#1F1E33'},
  sectionTab: {paddingBottom: 9},
  sectionText: {fontFamily: 'Poppins-SemiBold', color: '#7E7894', fontSize: 16},
  sectionTextActive: {color: '#FFFFFF'},
  sectionIndicator: {position: 'absolute', left: 0, right: 0, bottom: -1, height: 3, borderRadius: 2, backgroundColor: '#E879F9'},
  filters: {flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 6},
  filter: {height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#34304D', backgroundColor: '#121124', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6},
  activeFilter: {backgroundColor: '#C026D3', borderColor: '#C026D3'},
  filterText: {fontFamily: 'Poppins-Medium', color: '#C7C0D4', fontSize: 12},
  activeFilterText: {color: '#FFFFFF'},
  filterCount: {minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#8737F4', alignItems: 'center', justifyContent: 'center'},
  filterCountActive: {backgroundColor: 'rgba(255,255,255,0.28)'},
  filterCountText: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 9},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  list: {paddingTop: 6, paddingBottom: 102},
  row: {height: 76, flexDirection: 'row', alignItems: 'center', borderRadius: 16, marginHorizontal: -8, paddingHorizontal: 8},
  rowPressed: {backgroundColor: '#14132A'},
  avatarRing: {width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, padding: 2},
  avatar: {flex: 1, borderRadius: 24, overflow: 'hidden'},
  onlineDot: {position: 'absolute', right: -1, bottom: 1, width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: '#080910', backgroundColor: '#22E994'},
  rowCopy: {flex: 1, minWidth: 0, marginLeft: 14},
  name: {fontFamily: 'Poppins-SemiBold', color: '#FAF6FF', fontSize: 15},
  unreadName: {fontFamily: 'Poppins-Bold', color: '#FFFFFF'},
  message: {fontFamily: 'Poppins-Regular', color: '#9F98B2', fontSize: 12, marginTop: 1},
  unreadMessage: {fontFamily: 'Poppins-Medium', color: '#F1EAFF'},
  rowMeta: {alignItems: 'flex-end', gap: 6, marginLeft: 10},
  time: {fontFamily: 'Poppins-Regular', fontSize: 11, color: '#8F88A6'},
  unreadTime: {color: '#E879F9'},
  badge: {minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: '#C026D3', alignItems: 'center', justifyContent: 'center'},
  badgeText: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 10},
  chatButton: {height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#8737F4', flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 10},
  chatButtonText: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 12},
  availableHeader: {flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 10, paddingBottom: 4},
  availableDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#22E994'},
  availableHeaderText: {fontFamily: 'Poppins-Medium', color: '#B9F8DF', fontSize: 12},
  empty: {paddingTop: 56, alignItems: 'center'},
  emptyIcon: {width: 68, height: 68, borderRadius: 34, backgroundColor: '#1A1733', alignItems: 'center', justifyContent: 'center', marginBottom: 14},
  emptyButton: {marginTop: 18, height: 44, paddingHorizontal: 22, borderRadius: 22, backgroundColor: '#C026D3', flexDirection: 'row', alignItems: 'center', gap: 7},
  emptyButtonText: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 13},
  emptyTitle: {fontFamily: 'Poppins-SemiBold', color: '#F3ECFB', fontSize: 16},
  emptyText: {color: '#AAA4B9', fontSize: 12, marginTop: 6, textAlign: 'center', maxWidth: 260},
  bottomBar: {position: 'absolute', left: 10, right: 10, bottom: 7, height: 68, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(129, 108, 168, 0.58)', backgroundColor: 'rgba(17, 19, 30, 0.94)', shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 4}, elevation: 10, flexDirection: 'row', paddingTop: 9},
  tab: {flex: 1, alignItems: 'center', gap: 4, minWidth: 0},
  tabMessageIcon: {width: 23, height: 23, tintColor: '#C05DFF'},
  tabText: {color: '#C5BED3', fontSize: 9, textAlign: 'center'},
  activeTabText: {color: '#CE88FF', fontFamily: 'Poppins-Medium'},
  searchOverlay: {flex: 1, backgroundColor: 'rgba(2,2,9,0.76)', paddingHorizontal: 16, paddingTop: 68},
  searchBackdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
  searchSheet: {borderRadius: 18, borderWidth: 1, borderColor: '#8153C7', backgroundColor: '#17132C', padding: 10, elevation: 20, shadowColor: '#000000', shadowOpacity: 0.58, shadowRadius: 18, shadowOffset: {width: 0, height: 8}},
  searchBox: {height: 47, borderRadius: 16, backgroundColor: '#1E1B4C', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8},
  searchInput: {flex: 1, color: '#FFFFFF', fontFamily: 'Poppins-Regular', fontSize: 13, padding: 0},
  closeSearch: {width: 32, height: 32, borderRadius: 16, backgroundColor: '#37244F', alignItems: 'center', justifyContent: 'center'},
});
