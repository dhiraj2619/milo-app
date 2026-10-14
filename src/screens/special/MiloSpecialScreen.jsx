import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronRight, Crown, Globe, House, MessageCircle, Moon, Music, Phone, Plus, Sparkles, ShieldCheck, Star, UserRound, Users, Video } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { Coin, Gradient } from '../../components/home/HomeDecor';
import MiloConnectModal from '../../components/subscription/MiloConnectModal';
import { useToast } from '../../components/ui/ToastProvider';
import { getDiscoverProfiles, getMyProfile } from '../../services/userService';

const TABS = [{ label: 'Home', icon: House }, { label: 'Chats', icon: MessageCircle }, { label: 'MILO Special', icon: Sparkles }, { label: 'Connect', icon: Phone }, { label: 'Profile', icon: UserRound }];
const MOOD_ROOMS = [
  { key: 'night', title: 'Late Night Talks', subtitle: 'Deep, honest chats', icon: Moon, from: '#3B1F8F', to: '#120A33', accent: '#A78BFA' },
  { key: 'language', title: 'Language Exchange', subtitle: 'Practise with locals', icon: Globe, from: '#0E5D73', to: '#0A1B2E', accent: '#5EE7FF' },
  { key: 'music', title: 'Music & Chill', subtitle: 'Share your playlist', icon: Music, from: '#8A1F6B', to: '#250A26', accent: '#FF7AD9' },
  { key: 'friends', title: 'Make Friends', subtitle: 'Meet someone new', icon: Users, from: '#7A4A0E', to: '#24150A', accent: '#FFC861' },
];
const nameOf = person => person?.nickname || person?.name || 'MILO member';

function SpotlightCard({ person, onCall, onChat }) {
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow]);
  const online = person.isOnline === true;
  return <View style={styles.spotlight}>
    <Gradient from="#5B21B6" to="#160A36" radius={26} glow />
    <View style={styles.spotlightBadge}><Star size={12} color="#FFD45E" fill="#FFD45E" /><Text style={styles.spotlightBadgeText}>TODAY'S SPOTLIGHT</Text></View>
    <View style={styles.spotlightBody}>
      <View>
        <Animated.View style={[styles.spotlightGlow, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }]} />
        <View style={styles.spotlightAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={nameOf(person)} photoUrl={person.photoUrl} /></View>
        <View style={[styles.presenceDot, !online && styles.offlineDot]} />
      </View>
      <View style={styles.spotlightCopy}>
        <Text numberOfLines={1} style={styles.spotlightName}>{nameOf(person)}{person.age ? `, ${person.age}` : ''}</Text>
        <Text style={[styles.spotlightStatus, !online && styles.spotlightStatusOffline]}>{online ? '● Online now' : '● Away'}</Text>
        <View style={styles.tagRow}>{(person.languages || ['English']).slice(0, 2).map(language => <View key={language} style={styles.tag}><Text style={styles.tagText}>{language}</Text></View>)}</View>
        {!!person.bio && <Text numberOfLines={1} style={styles.spotlightBio}>{person.bio}</Text>}
      </View>
    </View>
    <View style={styles.spotlightActions}>
      <Pressable accessibilityRole="button" onPress={() => onCall(person, 'audio')} style={({ pressed }) => [styles.spotlightButton, styles.spotlightPrimary, pressed && styles.pressed]}><Phone size={16} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.spotlightButtonText}>Audio</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => onCall(person, 'video')} style={({ pressed }) => [styles.spotlightButton, styles.spotlightPrimary, pressed && styles.pressed]}><Video size={17} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.spotlightButtonText}>Video</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => onChat(person)} style={({ pressed }) => [styles.spotlightButton, styles.spotlightSecondary, pressed && styles.pressed]}><MessageCircle size={16} color="#E9D5FF" /><Text style={styles.spotlightButtonText}>Chat</Text></Pressable>
    </View>
  </View>;
}

function MoodRoomCard({ room, liveCount, onPress }) {
  const Icon = room.icon;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Join ${room.title}`} onPress={() => onPress(room)} style={({ pressed }) => [styles.moodCard, { borderColor: `${room.accent}55` }, pressed && styles.pressed]}>
    <Gradient from={room.from} to={room.to} radius={20} />
    <View style={[styles.moodIcon, { backgroundColor: `${room.accent}26` }]}><Icon size={20} color={room.accent} /></View>
    <Text style={styles.moodTitle}>{room.title}</Text>
    <Text style={styles.moodSubtitle}>{room.subtitle}</Text>
    <View style={styles.moodFooter}><View style={styles.liveDot} /><Text style={styles.moodLive}>{liveCount} online</Text><View style={styles.flex} /><View style={[styles.moodJoin, { backgroundColor: room.accent }]}><ChevronRight size={14} color="#0B0620" strokeWidth={3} /></View></View>
  </Pressable>;
}

function TopRatedCard({ person, onPress }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Chat with ${nameOf(person)}`} onPress={() => onPress(person)} style={({ pressed }) => [styles.ratedCard, pressed && styles.pressed]}>
    <View style={styles.ratedAvatarRing}><View style={styles.ratedAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={nameOf(person)} photoUrl={person.photoUrl} /></View><View style={[styles.presenceDot, styles.ratedPresence, person.isOnline !== true && styles.offlineDot]} /></View>
    <Text numberOfLines={1} style={styles.ratedName}>{nameOf(person)}</Text>
    <View style={styles.ratedStars}>{person.verified && <ShieldCheck size={11} color="#5EE7FF" />}<Text numberOfLines={1} style={styles.ratedScore}>{person.languages?.[0] || 'English'}</Text></View>
  </Pressable>;
}

export default function MiloSpecialScreen({ navigation }) {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [miloConnectOpen, setMiloConnectOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getMyProfile().then(loaded => active && setProfile(loaded)).catch(() => { });
    getDiscoverProfiles({ page: 1, limit: 24 })
      .then(data => active && setPeople(data.users || []))
      .catch(() => active && toast('Could not load MILO Special right now.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [toast]);

  const matchingPeople = useMemo(() => {
    const preferred = profile?.gender?.toLowerCase();
    return people.filter(person => {
      const gender = person.gender?.toLowerCase();
      if (preferred === 'male') return gender === 'female';
      if (preferred === 'female') return gender === 'male';
      return true;
    });
  }, [people, profile?.gender]);
  const onlinePeople = matchingPeople.filter(person => person.isOnline === true);
  const spotlight = onlinePeople[0] || matchingPeople[0];
  const topRated = [...matchingPeople.filter(person => person.verified), ...matchingPeople.filter(person => !person.verified)].filter(person => person !== spotlight).slice(0, 10);

  const startCall = (person, type = 'audio') => navigation.navigate(type === 'video' ? 'VideoRoom' : 'AudioRoom', {
    person, currentUser: profile, callType: type, isDemo: String(person._id || '').startsWith('demo-'), availablePeople: onlinePeople,
  });
  const openChat = person => navigation.navigate('ChatConversation', { person });
  const joinMoodRoom = room => {
    const pool = onlinePeople.length ? onlinePeople : matchingPeople;
    if (!pool.length) return toast(`No one is in ${room.title} yet. Try again soon.`);
    startCall(pool[Math.floor(Math.random() * pool.length)]);
  };
  const liveCountFor = index => onlinePeople.length ? Math.max(1, Math.round(onlinePeople.length * [0.6, 0.4, 0.5, 0.8][index])) : 0;
  const onTabPress = label => {
    if (label === 'Home') return navigation.navigate('Home');
    if (label === 'Chats') return navigation.navigate('Chats');
    if (label === 'Profile') return navigation.navigate('Profile');
    if (label !== 'MILO Special') toast(`${label} is coming soon`);
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#080910" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View style={styles.myAvatar}><ProfileAvatar {...(profile?.avatarStyle || { avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender || 'female' })} name={nameOf(profile)} photoUrl={profile?.photoUrl} /></View>
        <View style={styles.flex} />
        <Pressable accessibilityLabel="Buy coins" onPress={() => navigation.navigate('CoinStore')} style={styles.wallet}><Coin size={19} /><Text style={styles.walletBalance}>{profile?.coinBalance ?? 0}</Text><View style={styles.walletPlus}><Plus size={14} color="#F2DEFF" /></View></Pressable>
        <Pressable accessibilityLabel="Notifications" onPress={() => toast('Notifications are coming soon')} style={styles.bell}><Bell size={20} color="#E8E2F4" /><View style={styles.notificationDot} /></Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.titleRow}><Text style={styles.title}>MILO Special</Text><Sparkles size={22} color="#E879F9" fill="#E879F9" /></View>
        <Text style={styles.subtitle}>Handpicked moments, just for you</Text>
      </View>

      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color="#B254FF" /></View> : <>
        {spotlight ? <SpotlightCard person={spotlight} onCall={startCall} onChat={openChat} /> : <View style={styles.empty}><Text style={styles.emptyTitle}>No one in the spotlight yet</Text><Text style={styles.emptyText}>Check back soon — new members join every day.</Text></View>}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Mood Rooms</Text><Text style={styles.sectionSubtitle}>Pick a vibe, we'll find your match</Text></View>
        <View style={styles.moodGrid}>{MOOD_ROOMS.map((room, index) => <MoodRoomCard key={room.key} room={room} liveCount={liveCountFor(index)} onPress={joinMoodRoom} />)}</View>

        {topRated.length > 0 && <>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Top Picks</Text><Text style={styles.sectionSubtitle}>Verified members first</Text></View>
          <FlatList horizontal data={topRated} keyExtractor={item => item._id || item.firebaseUid} renderItem={({ item }) => <TopRatedCard person={item} onPress={openChat} />} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratedList} />
        </>}

        <Pressable accessibilityRole="button" onPress={() => setMiloConnectOpen(true)} style={({ pressed }) => [styles.premium, pressed && styles.pressed]}>
          <Gradient from="#3D255F" to="#8D39E8" radius={20} glow />
          <Image source={require('../../../assets/icons/crown.png')} style={styles.crown} resizeMode="contain" />
          <View style={styles.premiumCopy}><Text style={styles.premiumTitle}>Unlock MILO Connect</Text><Text style={styles.premiumText}>Priority matches, Nearby & verified profiles</Text></View>
          <View style={styles.premiumCta}><Crown size={14} color="#FFFFFF" /><Text style={styles.premiumCtaText}>Upgrade</Text></View>
        </Pressable>
      </>}
    </ScrollView>
    <MiloConnectModal visible={miloConnectOpen} onClose={() => setMiloConnectOpen(false)} />
    <View style={styles.bottomBar}>{TABS.map(({ label, icon: Icon }) => {
      const active = label === 'MILO Special';
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
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3 },
  myAvatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  wallet: { height: 35, borderRadius: 18, borderWidth: 1, borderColor: '#584273', backgroundColor: 'rgba(24, 22, 45, 0.92)', paddingLeft: 8, paddingRight: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  walletBalance: { fontFamily: 'Poppins-SemiBold', color: '#FFE16A', fontSize: 12 },
  walletPlus: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#593491', alignItems: 'center', justifyContent: 'center' },
  bell: { marginLeft: 12, padding: 4 },
  notificationDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F14970', borderWidth: 1, borderColor: '#080910' },
  header: { paddingHorizontal: 3, paddingTop: 8, paddingBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 28, lineHeight: 34, color: '#F7F2FF' },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#AAA5BA', marginTop: 2 },
  loading: { paddingTop: 120, alignItems: 'center' },
  empty: { paddingVertical: 36, alignItems: 'center', borderRadius: 22, backgroundColor: '#14132A' },
  emptyTitle: { fontFamily: 'Poppins-SemiBold', color: '#F3ECFB', fontSize: 15 },
  emptyText: { color: '#AAA4B9', fontSize: 11, marginTop: 6, textAlign: 'center' },
  spotlight: { borderRadius: 26, borderWidth: 1.5, borderColor: '#9F5BFF', padding: 18, overflow: 'hidden' },
  spotlightBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: 'rgba(10,4,30,0.5)' },
  spotlightBadgeText: { fontFamily: 'Poppins-SemiBold', color: '#FFE7A3', fontSize: 9, letterSpacing: 1 },
  spotlightBody: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 16 },
  spotlightGlow: { position: 'absolute', top: -8, left: -8, width: 104, height: 104, borderRadius: 52, backgroundColor: '#C084FC' },
  spotlightAvatar: { width: 88, height: 88, borderRadius: 44, overflow: 'hidden', borderWidth: 3, borderColor: '#F0ABFC', backgroundColor: '#25104B' },
  presenceDot: { position: 'absolute', right: 4, bottom: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#21E6A1', borderWidth: 3, borderColor: '#1E0E46' },
  offlineDot: { backgroundColor: '#F5C542' },
  spotlightCopy: { flex: 1, minWidth: 0 },
  spotlightName: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 22, lineHeight: 28 },
  spotlightStatus: { fontFamily: 'Poppins-Medium', color: '#5EF2B5', fontSize: 11, marginTop: 1 },
  spotlightStatusOffline: { color: '#F5C542' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 9, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center' },
  tagText: { fontFamily: 'Poppins-Medium', color: '#F3E8FF', fontSize: 10 },
  spotlightBio: { fontFamily: 'Poppins-Regular', color: '#D8C8F2', fontSize: 11, marginTop: 8 },
  spotlightActions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  spotlightButton: { flex: 1, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  spotlightPrimary: { backgroundColor: '#A855F7' },
  spotlightSecondary: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(233,213,255,0.35)' },
  spotlightButtonText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 13 },
  sectionHeader: { paddingHorizontal: 3, marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', color: '#F7F2FF', fontSize: 18 },
  sectionSubtitle: { fontFamily: 'Poppins-Regular', color: '#A9A3BB', fontSize: 11, marginTop: 1 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  moodCard: { width: '48.4%', minHeight: 150, borderRadius: 20, borderWidth: 1, padding: 14, overflow: 'hidden' },
  moodIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moodTitle: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14, marginTop: 12 },
  moodSubtitle: { fontFamily: 'Poppins-Regular', color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 },
  moodFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto', paddingTop: 12 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#21E6A1' },
  moodLive: { fontFamily: 'Poppins-Medium', color: '#E7E0F5', fontSize: 10 },
  moodJoin: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  ratedList: { gap: 12, paddingRight: 6 },
  ratedCard: { width: 92, alignItems: 'center', paddingVertical: 12, borderRadius: 18, backgroundColor: '#14132A', borderWidth: 1, borderColor: '#2A2545' },
  ratedAvatarRing: { width: 62, height: 62, borderRadius: 31, padding: 2, backgroundColor: '#A453E8' },
  ratedAvatar: { flex: 1, borderRadius: 29, overflow: 'hidden' },
  ratedPresence: { right: 0, bottom: 2, width: 13, height: 13, borderWidth: 2, borderColor: '#14132A' },
  ratedName: { fontFamily: 'Poppins-SemiBold', color: '#F7F2FF', fontSize: 12, marginTop: 8, maxWidth: 80 },
  ratedStars: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratedScore: { fontFamily: 'Poppins-Medium', color: '#C9C0DC', fontSize: 10, maxWidth: 64 },
  premium: { marginTop: 26, minHeight: 84, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },
  crown: { width: 46, height: 46 },
  premiumCopy: { flex: 1 },
  premiumTitle: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15 },
  premiumText: { fontFamily: 'Poppins-Regular', color: '#E9D5FF', fontSize: 10, marginTop: 2 },
  premiumCta: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(10,4,30,0.45)' },
  premiumCtaText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 11 },
  bottomBar: { position: 'absolute', left: 10, right: 10, bottom: 7, height: 68, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(129, 108, 168, 0.58)', backgroundColor: 'rgba(17, 19, 30, 0.94)', shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10, flexDirection: 'row', paddingTop: 9 },
  tab: { flex: 1, alignItems: 'center', gap: 4, minWidth: 0 },
  activeTabGlow: { shadowColor: '#C05DFF', shadowOpacity: 0.9, shadowRadius: 10 },
  tabMessageIcon: { width: 23, height: 23, tintColor: '#C5BED3' },
  tabText: { color: '#C5BED3', fontSize: 8, textAlign: 'center' },
  activeTabText: { color: '#CE88FF', fontFamily: 'Poppins-Medium' },
});
