import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { House, MessageCircle, Phone, Plus, Shuffle, Sparkles, UserRound, Users, Video } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import FavouritesStrip from '../../components/favourites/FavouritesStrip';
import RecentCallRow from '../../components/calls/RecentCallRow';
import { useFocusEffect } from '@react-navigation/native';
import { InterestChips } from '../../components/profile/Interests';
import { interestEmoji } from '../../config/profileOptions';
import { Coin, Gradient } from '../../components/home/HomeDecor';
import { useToast } from '../../components/ui/ToastProvider';
import { getDiscoverProfiles, getMyCalls, getMyProfile } from '../../services/userService';

const TABS = [{ label: 'Home', icon: House }, { label: 'Chats', icon: MessageCircle }, { label: 'MILO Special', icon: Sparkles }, { label: 'Connect', icon: Phone }, { label: 'Profile', icon: UserRound }];
const PAGE_SIZE = 20;
const RECENT_SHOWN = 3;
const CALL_PRICES = { audio: '15 /min', video: '60 /min' };
const nameOf = person => person?.nickname || person?.name || 'MILO member';
const keyOf = person => person._id || person.firebaseUid;
const isDemo = person => String(person._id || '').startsWith('demo-');

function QuickConnect({ type, disabled, onPress }) {
  const video = type === 'video';
  const Icon = video ? Video : Phone;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Random ${type} call`} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.pressed, disabled && styles.disabled]}>
    <Gradient from={video ? '#7C35D1' : '#0E5D73'} to={video ? '#2A0E5C' : '#0A1B2E'} radius={20} glow />
    <View style={[styles.quickIcon, video ? styles.quickIconVideo : styles.quickIconAudio]}><Icon size={20} color="#FFFFFF" fill="#FFFFFF" /></View>
    <Text style={styles.quickTitle}>Random {video ? 'Video' : 'Audio'}</Text>
    <View style={styles.quickFooter}>
      <Shuffle size={12} color="#E4DAF5" />
      <Text style={styles.quickHint}>Match instantly</Text>
      <View style={styles.flex} />
      <Image source={require('../../../assets/icons/coin.png')} style={styles.coinIcon} />
      <Text style={styles.quickPrice}>{CALL_PRICES[type]}</Text>
    </View>
  </Pressable>;
}

function PersonRow({ person, onCall, onOpen, myInterests }) {
  const online = person.isOnline === true;
  const name = nameOf(person);
  return <View style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${name}'s profile`} onPress={() => onOpen(person)} style={styles.rowOpen}>
    <View style={styles.rowAvatar}>
      <View style={styles.rowAvatarClip}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /></View>
      <View style={[styles.presenceDot, !online && styles.offlineDot]} />
    </View>
    <View style={styles.rowCopy}>
      <Text numberOfLines={1} style={styles.rowName}>{name}{person.age ? `, ${person.age}` : ''}</Text>
      <Text style={[styles.rowStatus, !online && styles.rowStatusAway]}>{online ? 'Online now' : 'Away'}</Text>
      <View style={styles.rowTags}>{(person.languages?.length ? person.languages : ['English']).slice(0, 2).map(language => <View key={language} style={styles.rowTag}><Text style={styles.rowTagText}>{language}</Text></View>)}</View>
      {person.interests?.length > 0 && <View style={styles.rowInterests}><InterestChips interests={person.interests} max={3} small highlight={myInterests} /></View>}
    </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Audio call ${name}`} hitSlop={4} onPress={() => onCall(person, 'audio')} style={({ pressed }) => [styles.callButton, styles.callAudio, !online && styles.callAway, pressed && styles.pressed]}>
      <Phone size={17} color="#FFFFFF" fill="#FFFFFF" />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Video call ${name}`} hitSlop={4} onPress={() => onCall(person, 'video')} style={({ pressed }) => [styles.callButton, styles.callVideo, !online && styles.callAway, pressed && styles.pressed]}>
      <Video size={18} color="#FFFFFF" fill="#FFFFFF" />
    </Pressable>
  </View>;
}

export default function ConnectScreen({ navigation }) {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('All');
  const [recentCalls, setRecentCalls] = useState([]);

  // "Recent": refreshed every time Connect comes into view, e.g. right after a call.
  useFocusEffect(useCallback(() => {
    let active = true;
    getMyCalls().then(data => active && setRecentCalls(data.calls.slice(0, RECENT_SHOWN))).catch(() => { });
    return () => { active = false; };
  }, []));

  const loadFirstPage = useCallback(async () => {
    try {
      const data = await getDiscoverProfiles({ page: 1, limit: PAGE_SIZE });
      setPeople(data.users || []);
      setPage(data.pagination?.page || 1);
      setHasNextPage(!!data.pagination?.hasNextPage);
    } catch {
      toast('Could not load people right now.');
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    getMyProfile().then(loaded => active && setProfile(loaded)).catch(() => { });
    loadFirstPage().finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [loadFirstPage]);

  const refresh = async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loading || loadingMore || !hasNextPage) return;
    setLoadingMore(true);
    try {
      const data = await getDiscoverProfiles({ page: page + 1, limit: PAGE_SIZE });
      setPeople(current => {
        const seen = new Set(current.map(keyOf));
        return [...current, ...(data.users || []).filter(person => !seen.has(keyOf(person)))];
      });
      setPage(data.pagination?.page || page + 1);
      setHasNextPage(!!data.pagination?.hasNextPage);
    } catch {
      toast('Could not load more people.');
    } finally {
      setLoadingMore(false);
    }
  };

  const matchingPeople = useMemo(() => {
    const preferred = profile?.gender?.toLowerCase();
    const matches = people.filter(person => {
      const gender = person.gender?.toLowerCase();
      if (preferred === 'male') return gender === 'female';
      if (preferred === 'female') return gender === 'male';
      return true;
    });
    return [...matches.filter(person => person.isOnline === true), ...matches.filter(person => person.isOnline !== true)];
  }, [people, profile?.gender]);
  const onlinePeople = matchingPeople.filter(person => person.isOnline === true);
  const languages = useMemo(() => {
    const counts = new Map();
    matchingPeople.forEach(person => (person.languages || []).forEach(language => counts.set(language, (counts.get(language) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([language]) => language);
  }, [matchingPeople]);
  // Interest filters: the user's own interests first, then the most common ones among these people.
  const interests = useMemo(() => {
    const counts = new Map();
    matchingPeople.forEach(person => (person.interests || []).forEach(item => counts.set(item, (counts.get(item) || 0) + 1)));
    const popular = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([item]) => item);
    const mine = (profile?.interests || []).filter(item => counts.has(item));
    return [...new Set([...mine, ...popular])].slice(0, 8);
  }, [matchingPeople, profile?.interests]);
  // Interest and language names never overlap, so one filter value covers both.
  const visiblePeople = filter === 'All' ? matchingPeople
    : filter === 'Online' ? onlinePeople
      : matchingPeople.filter(person => person.languages?.includes(filter) || person.interests?.includes(filter));

  const startCall = (person, type) => navigation.navigate(type === 'video' ? 'VideoRoom' : 'AudioRoom', {
    person, currentUser: profile, callType: type, isDemo: isDemo(person), availablePeople: onlinePeople,
  });
  const callRandom = type => {
    const pool = visiblePeople.filter(person => person.isOnline === true);
    const target = pool.length ? pool : onlinePeople;
    if (!target.length) return toast('No one is online right now. Try again soon.');
    startCall(target[Math.floor(Math.random() * target.length)], type);
  };
  const onTabPress = label => {
    if (label === 'Home') return navigation.navigate('Home');
    if (label === 'Chats') return navigation.navigate('Chats');
    if (label === 'MILO Special') return navigation.navigate('MiloSpecial');
    if (label === 'Profile') return navigation.navigate('Profile');
  };

  const header = <>
    <View style={styles.topBar}>
      <View style={styles.myAvatar}><ProfileAvatar {...(profile?.avatarStyle || { avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender || 'female' })} name={nameOf(profile)} photoUrl={profile?.photoUrl} /></View>
      <View style={styles.flex} />
      <Pressable accessibilityLabel="Buy coins" onPress={() => navigation.navigate('CoinStore')} style={styles.wallet}><Coin size={19} /><Text style={styles.walletBalance}>{profile?.coinBalance ?? 0}</Text><View style={styles.walletPlus}><Plus size={14} color="#F2DEFF" /></View></Pressable>
    </View>

    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Connect</Text>
        <View style={styles.onlinePill}><View style={styles.onlinePillDot} /><Text style={styles.onlinePillText}>{onlinePeople.length} online</Text></View>
      </View>
      <Text style={styles.subtitle}>Start an audio or video call right now</Text>
    </View>

    <FavouritesStrip onCall={person => startCall(person, 'audio')} style={styles.favourites} />

    {recentCalls.length > 0 && <View style={styles.recent}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('RecentCalls')} hitSlop={8}><Text style={styles.seeAll}>See all</Text></Pressable>
      </View>
      {recentCalls.map(call => <RecentCallRow key={call._id} call={call} onCall={startCall} onOpen={person => navigation.navigate('UserProfile', { userId: person._id, person })} />)}
    </View>}

    <View style={styles.quickRow}>
      <QuickConnect type="audio" disabled={loading} onPress={() => callRandom('audio')} />
      <QuickConnect type="video" disabled={loading} onPress={() => callRandom('video')} />
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
      {['All', 'Online', ...languages, ...interests].map(item => {
        const active = item === filter;
        return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setFilter(item)} style={[styles.chip, active && styles.chipActive]}>
          {active && <Gradient from="#A447FA" to="#5916E6" radius={16} />}
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{item === 'Online' ? 'Online now' : interests.includes(item) ? `${interestEmoji(item)} ${item}` : item}</Text>
        </Pressable>;
      })}
    </ScrollView>
  </>;

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#080910" />
    <FlatList
      data={loading ? [] : visiblePeople}
      keyExtractor={keyOf}
      renderItem={({ item }) => <PersonRow person={item} onCall={startCall} onOpen={person => navigation.navigate('UserProfile', { userId: person._id, person })} myInterests={profile?.interests || []} />}
      ListHeaderComponent={header}
      ListEmptyComponent={loading
        ? <View style={styles.loading}><ActivityIndicator size="large" color="#B254FF" /></View>
        : <View style={styles.empty}>
          <View style={styles.emptyIcon}><Users size={28} color="#B776FF" /></View>
          <Text style={styles.emptyTitle}>{filter === 'All' ? 'No one here yet' : 'No one matches this filter'}</Text>
          <Text style={styles.emptyText}>{filter === 'All' ? 'New people join MILO every day. Pull down to refresh.' : 'Try another filter.'}</Text>
        </View>}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color="#B254FF" /> : null}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#B254FF" colors={['#B254FF']} progressBackgroundColor="#1A1433" />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    />
    <View style={styles.bottomBar}>{TABS.map(({ label, icon: Icon }) => {
      const active = label === 'Connect';
      return <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => onTabPress(label)} style={styles.tab}>
        <View style={active && styles.activeTabGlow}>{label === 'Chats' ? <Image source={require('../../../assets/icons/message.png')} style={styles.tabMessageIcon} resizeMode="contain" /> : <Icon size={23} color={active ? '#CE88FF' : '#C5BED3'} fill="none" />}</View>
        <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
      </Pressable>;
    })}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080910' },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 104 },
  flex: { flex: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.45 },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3 },
  myAvatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  wallet: { height: 35, borderRadius: 18, borderWidth: 1, borderColor: '#584273', backgroundColor: 'rgba(24, 22, 45, 0.92)', paddingLeft: 8, paddingRight: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  walletBalance: { fontFamily: 'Poppins-SemiBold', color: '#FFE16A', fontSize: 12 },
  walletPlus: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#593491', alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 3, paddingTop: 8, paddingBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 28, lineHeight: 34, color: '#F7F2FF' },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#AAA5BA', marginTop: 2 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: 'rgba(33,230,161,0.12)', borderWidth: 1, borderColor: 'rgba(33,230,161,0.3)' },
  onlinePillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#21E6A1' },
  onlinePillText: { fontFamily: 'Poppins-Medium', color: '#B9F8DF', fontSize: 11 },
  quickRow: { flexDirection: 'row', gap: 12 },
  favourites: { paddingHorizontal: 3, marginBottom: 18 },
  recent: { marginBottom: 10 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, marginBottom: 10 },
  recentTitle: { color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 17 },
  seeAll: { color: '#B37AFF', fontFamily: 'Poppins-Medium', fontSize: 12 },
  quick: { flex: 1, minHeight: 128, borderRadius: 20, padding: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(196,181,253,0.28)' },
  quickIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickIconAudio: { backgroundColor: 'rgba(94,231,255,0.28)' },
  quickIconVideo: { backgroundColor: 'rgba(216,180,254,0.3)' },
  quickTitle: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15, marginTop: 12 },
  quickFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 8 },
  quickHint: { fontFamily: 'Poppins-Regular', color: '#E4DAF5', fontSize: 10 },
  coinIcon: { width: 12, height: 12 },
  quickPrice: { fontFamily: 'Poppins-Medium', color: '#FFE16A', fontSize: 10 },
  chipsScroll: { flexGrow: 0, marginTop: 18, marginHorizontal: -18 },
  chips: { gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
  chip: { height: 34, paddingHorizontal: 16, borderRadius: 17, overflow: 'hidden', justifyContent: 'center', backgroundColor: '#1A1433', borderWidth: 1, borderColor: 'rgba(173,113,255,0.25)' },
  chipActive: { borderColor: 'transparent' },
  chipText: { fontFamily: 'Poppins-Medium', color: '#D4C6EE', fontSize: 12 },
  chipTextActive: { color: '#FFFFFF' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 10, borderRadius: 20, backgroundColor: '#14132A', borderWidth: 1, borderColor: '#2A2545' },
  rowAvatar: { width: 56, height: 56 },
  rowAvatarClip: { flex: 1, borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: '#A453E8', backgroundColor: '#25104B' },
  presenceDot: { position: 'absolute', right: 0, bottom: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#21E6A1', borderWidth: 2.5, borderColor: '#14132A' },
  offlineDot: { backgroundColor: '#F5C542' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: 'Poppins-SemiBold', color: '#F7F2FF', fontSize: 15 },
  rowStatus: { fontFamily: 'Poppins-Medium', color: '#5EF2B5', fontSize: 10 },
  rowStatusAway: { color: '#F5C542' },
  rowTags: { flexDirection: 'row', gap: 5, marginTop: 5 },
  rowInterests: { marginTop: 6 },
  rowOpen: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  rowTag: { paddingHorizontal: 8, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' },
  rowTagText: { fontFamily: 'Poppins-Medium', color: '#E3D5FF', fontSize: 9 },
  callButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  callAudio: { backgroundColor: '#0E8BA8' },
  callVideo: { backgroundColor: '#A855F7' },
  callAway: { opacity: 0.45 },
  loading: { paddingTop: 80, alignItems: 'center' },
  empty: { paddingVertical: 40, alignItems: 'center', paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1A1733', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: 'Poppins-SemiBold', color: '#F3ECFB', fontSize: 15, textAlign: 'center' },
  emptyText: { fontFamily: 'Poppins-Regular', color: '#AAA4B9', fontSize: 12, marginTop: 6, textAlign: 'center' },
  footerLoader: { paddingVertical: 16 },
  bottomBar: { position: 'absolute', left: 10, right: 10, bottom: 7, height: 68, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(129, 108, 168, 0.58)', backgroundColor: 'rgba(17, 19, 30, 0.94)', shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10, flexDirection: 'row', paddingTop: 9 },
  tab: { flex: 1, alignItems: 'center', gap: 4, minWidth: 0 },
  activeTabGlow: { shadowColor: '#C05DFF', shadowOpacity: 0.9, shadowRadius: 10 },
  tabMessageIcon: { width: 23, height: 23, tintColor: '#C5BED3' },
  tabText: { color: '#C5BED3', fontSize: 8, textAlign: 'center' },
  activeTabText: { color: '#CE88FF', fontFamily: 'Poppins-Medium' },
});
