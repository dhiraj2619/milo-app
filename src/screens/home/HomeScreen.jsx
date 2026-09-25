import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  useWindowDimensions,
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  CircleCheck,
  ChevronRight,
  Clock3,
  MoreHorizontal,
  House,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Sparkles,
  Star,
  UserRound,
  Video,
  X,
} from 'lucide-react-native';
import { Gradient, Coin, Gift } from '../../components/home/HomeDecor';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { useToast } from '../../components/ui/ToastProvider';
import { getDiscoverProfiles, getMyProfile } from '../../services/userService';
import { claimDailyCoins } from '../../services/coinService';
import { getConversations } from '../../services/chatService';
import { consumeWelcomeReward, getDailyClaimAt, saveDailyClaimAt } from '../../services/sessionService';
import { getAuth, getIdToken } from '@react-native-firebase/auth';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../../config/config';

/* const PEOPLE = [
  {
    name: 'Aanya',
    age: 22,
    languages: ['Hindi', 'English'],
    bio: 'Good vibes only ✨',
    background: '#F590C1',
    hair: '#482721',
    shirt: '#F17198',
    verified: true,
  },
  {
    name: 'Riya',
    age: 24,
    languages: ['Marathi', 'Hindi'],
    bio: 'Let’s talk! 💜',
    background: '#9A83F8',
    hair: '#63362D',
    shirt: '#A58CF4',
    bun: true,
  },
  {
    name: 'Kiara',
    age: 23,
    languages: ['English', 'Tamil'],
    bio: 'Always up for fun 😄',
    background: '#FFE3A3',
    hair: '#352224',
    shirt: '#292338',
    glasses: true,
  },
];
const CHATS = [
  {
    name: 'Aryan',
    language: 'Hindi',
    gender: 'male',
    background: '#FFE49A',
    hair: '#24212B',
    shirt: '#50416F',
  },
  {
    name: 'Sneha',
    language: 'Marathi',
    background: '#FF92C2',
    shirt: '#E78EA6',
  },
  {
    name: 'Rohan',
    language: 'English',
    gender: 'male',
    background: '#87C6FF',
    hair: '#523A30',
    shirt: '#568BC4',
    glasses: true,
  },
  {name: 'Meera', language: 'English', background: '#FFB2D3', hair: '#45231F', shirt: '#D96A9D'},
  {name: 'Kabir', language: 'Hindi', gender: 'male', background: '#A6D4FF', hair: '#352720', shirt: '#4385B7', glasses: true},
  {name: 'Pooja', language: 'Tamil', background: '#E28CDE', hair: '#302020', shirt: '#B845B0'},
]; */
const FAKE_NAMES = ['Aanya', 'Riya', 'Kiara', 'Meera', 'Sneha', 'Pooja', 'Ananya', 'Kavya', 'Isha', 'Nisha', 'Diya', 'Tanya', 'Aarav', 'Kabir', 'Rohan', 'Aryan', 'Vivaan', 'Arjun', 'Rahul', 'Aditya', 'Sana', 'Maya', 'Neha', 'Ira', 'Anika', 'Sia', 'Reyansh', 'Dev', 'Yash', 'Vihaan', 'Riyaan', 'Aditi', 'Bhavya', 'Rhea', 'Ishaan', 'Manav', 'Naina', 'Tara', 'Samar', 'Zoya'];
const FAKE_LANGUAGES = ['Hindi', 'Marathi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada'];
const FAKE_BACKGROUNDS = ['#A8D0F5', '#B8DDF4', '#9FC7E9', '#C7E2F5', '#AED4EC', '#D2E7F5', '#9EC9EC', '#BCDDF0'];
const FAKE_PROFILES = FAKE_NAMES.map((nickname, index) => ({
  _id: `demo-${index + 1}`,
  nickname,
  age: 20 + (index % 8),
  gender: index % 3 === 0 ? 'male' : 'female',
  languages: [FAKE_LANGUAGES[index % FAKE_LANGUAGES.length], FAKE_LANGUAGES[(index + 2) % FAKE_LANGUAGES.length]],
  isOnline: index % 6 !== 0,
  verified: index % 4 === 0,
  bio: ['Ready to connect ✨', 'Let’s talk! 💜', 'Good vibes only ✨', 'Always up for fun 😄'][index % 4],
  avatarStyle: { avatarSeed: `milo-demo-${index + 1}`, background: FAKE_BACKGROUNDS[index % FAKE_BACKGROUNDS.length], gender: index % 3 === 0 ? 'male' : 'female', hair: index % 3 === 0 ? '#33221E' : '#392323', shirt: index % 3 === 0 ? '#5275BE' : '#E56D9A', bun: index % 5 === 0, glasses: index % 7 === 0 },
}));

function selectDemoProfiles(identity) {
  let hash = 7;
  for (let index = 0; index < identity.length; index += 1) hash = (hash * 31 + identity.charCodeAt(index)) % 2147483647;
  const pool = [...FAKE_PROFILES];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    hash = (hash * 48271) % 2147483647;
    const target = hash % (index + 1);
    [pool[index], pool[target]] = [pool[target], pool[index]];
  }
  return pool.slice(0, 5);
}
const FILTERS = [
  { label: 'For You', icon: Star },
  { label: 'Online' },
  { label: 'Nearby', icon: MapPin },
];
const TABS = [
  { label: 'Home', icon: House },
  { label: 'Chats', icon: MessageCircle },
  { label: 'MILO Special', icon: Sparkles },
  { label: 'Connect', icon: Phone },
  { label: 'Profile', icon: UserRound },
];

const LANGUAGE_LABELS = { Hindi: 'हिंदी', Marathi: 'मराठी', Bengali: 'বাংলা', Tamil: 'தமிழ்', Telugu: 'తెలుగు', Gujarati: 'ગુજરાતી', Kannada: 'ಕನ್ನಡ', English: 'English' };
const languageLabel = language => LANGUAGE_LABELS[language] || language;
function ConnectProfileCard({ person, cardWidth, onPress }) {
  const isOffline = person.isOnline !== true;
  return <View style={[styles.connectCard, { width: cardWidth }]}>
    <View style={styles.connectTop}><View /><View style={styles.connectMore}><MoreHorizontal size={15} color="#F3EDFF" /></View></View>
    <View style={styles.connectAvatar}><ProfileAvatar {...person.avatarStyle} name={person.nickname} /><View style={[styles.profilePresenceDot, isOffline && styles.offlineDot]} /></View>
    <Text numberOfLines={1} style={styles.connectName}>{person.nickname} {person.age || 22}</Text>
    <View style={styles.connectTags}><View style={styles.connectTag}><Text style={styles.connectTagText}>{languageLabel(person.languages[0])}</Text></View></View>
    <Pressable onPress={() => onPress(person)} style={[styles.connectCallButton, isOffline && styles.disabledAction]}><Phone size={16} fill="#FFFFFF" color="#FFFFFF" /><Text style={styles.connectCallText}>Join Call</Text></Pressable>
  </View>;
}
function SeeMoreRoomsCard({ cardWidth, onPress }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="See more rooms" onPress={onPress} style={[styles.seeMoreRoomsCard, { width: cardWidth }]}>
    <View style={styles.seeMoreRoomsIcon}><Phone size={22} color="#DDBBFF" /></View>
    <Text style={styles.seeMoreRoomsTitle}>See more rooms</Text>
    <Text style={styles.seeMoreRoomsText}>Find your next conversation</Text>
    <View style={styles.seeMoreRoomsArrow}><ChevronRight size={22} color="#FFFFFF" /></View>
  </Pressable>;
}
function OnlineProfileRow({person, onPress}) {
  const name = person.nickname || person.name || 'MILO member';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Join call with ${name}`} onPress={() => onPress(person)} style={styles.onlineProfileRow}>
    <View style={styles.onlineProfileAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /><View style={styles.onlineProfileDot} /></View>
    <View style={styles.onlineProfileCopy}><View style={styles.onlineProfileStatus}><View style={styles.onlineProfileStatusDot} /><Text style={styles.onlineProfileStatusText}>Online</Text></View><Text style={styles.onlineProfileName}>{name}</Text><View style={styles.onlineProfileLanguage}><Text style={styles.onlineProfileLanguageText}>{languageLabel(person.languages?.[0] || 'English')}</Text></View></View>
    <Pressable onPress={() => onPress(person)} style={styles.onlineProfileCall}><Phone size={14} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.onlineProfileCallText}>Join Call</Text></Pressable>
    <MoreHorizontal size={15} color="#A7A0B9" style={styles.onlineProfileMore} />
  </Pressable>;
}
function NearbyRadar({profile, people, city, wave}) {
  const positions = [{top: '4%', left: '43%'}, {top: '20%', right: '8%'}, {top: '48%', right: '3%'}, {bottom: '8%', right: '24%'}, {bottom: '9%', left: '21%'}, {top: '48%', left: '4%'}, {top: '22%', left: '9%'}];
  const rippleScale = wave.interpolate({inputRange: [0, 1], outputRange: [0.55, 1]});
  const rippleOpacity = wave.interpolate({inputRange: [0, 0.72, 1], outputRange: [0, 0.75, 0]});
  return <View style={styles.nearbyRadar}><Animated.View style={[styles.radarRing, styles.radarRingOuter, {opacity: rippleOpacity, transform: [{scale: rippleScale}]}]} /><Animated.View style={[styles.radarRing, styles.radarRingMiddle, {opacity: rippleOpacity, transform: [{scale: rippleScale}]}]} /><Animated.View style={[styles.radarRing, styles.radarRingInner, {opacity: rippleOpacity, transform: [{scale: rippleScale}]}]} /><View style={styles.radarGlow} /><View style={styles.radarCenter}><ProfileAvatar {...(profile?.avatarStyle || {avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender || 'female'})} name={profile?.nickname || 'You'} photoUrl={profile?.photoUrl} /><View style={styles.radarCenterDot} /><Text style={styles.radarYou}>You</Text><Text style={styles.radarCity}>{city}</Text></View>{people.map((person, index) => <View key={person._id || person.firebaseUid} style={[styles.radarPerson, positions[index % positions.length]]}><View style={styles.radarPersonAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={person.nickname} photoUrl={person.photoUrl} /><View style={styles.radarPersonDot} /></View><Text style={styles.radarDistance}>{[0.4, 0.8, 1.2, 1.6, 1.9, 2.1, 2.8][index % 7]} km</Text></View>)}</View>;
}
function MiloChatCard({ person, cardWidth, onPress }) {
  const isOffline = person.isOnline !== true;
  const name = person.nickname || person.name || 'MILO member';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Chat with ${name}`} onPress={() => onPress(person)} style={[styles.miloChatCard, { width: cardWidth }]}>
    <View style={styles.miloChatTop}><View /><MoreHorizontal size={15} color="#EDE8F8" /></View>
    <View style={styles.miloChatAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /><View style={[styles.profilePresenceDot, isOffline && styles.offlineDot]} /></View>
    <Text numberOfLines={1} style={styles.miloChatName}>{name} {person.age || ''}</Text>
    <Text numberOfLines={1} style={styles.miloChatLanguage}>{languageLabel(person.languages?.[0] || 'English')}</Text>
    <View style={styles.miloChatButton}><Image source={require('../../../assets/icons/message.png')} style={styles.miloChatButtonIcon} resizeMode="contain" /><Text style={styles.miloChatButtonText}>Chat</Text></View>
  </Pressable>;
} function WelcomeRewardModal({ reward, onClose }) {
  if (!reward) return null;
  return <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.welcomeOverlay}>
      <View style={styles.welcomeCard}>
        <Gradient from="#32106D" to="#100622" radius={24} glow />
        <Pressable accessibilityRole="button" accessibilityLabel="Close welcome reward" onPress={onClose} style={styles.welcomeClose}><Text style={styles.welcomeCloseText}>×</Text></Pressable>
        <Text style={[styles.welcomeConfetti, styles.confettiOne]}>✦</Text><Text style={[styles.welcomeConfetti, styles.confettiTwo]}>✧</Text><Text style={[styles.welcomeConfetti, styles.confettiThree]}>✦</Text>
        <View style={styles.welcomeGift}><Gift /></View>
        <Text style={styles.welcomeTitle}>Congratulations!</Text>
        <Text style={styles.welcomeName}>{reward.nickname} 🎉</Text>
        <Text style={styles.welcomeReceived}>You’ve received</Text>
        <View style={styles.welcomeCoins}><Coin size={31} /><Text style={styles.welcomeCoinText}>{reward.amount} coins</Text></View>
        <Text style={styles.welcomeBody}>Welcome to MILO!{`\n`}Use your coins to start conversations{`\n`}and make new friends.</Text>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.welcomeButton}><Gradient from="#BD58FF" to="#6D24EF" radius={18} /><Text style={styles.welcomeButtonText}>Let’s Go</Text><ChevronRight size={20} color="#FFFFFF" strokeWidth={3} /></Pressable>
      </View>
    </View>
  </Modal>;
}
function SectionTitle({ title, subtitle, isNew, onPress }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionLine}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>New</Text>
          </View>
        )}
        <View style={styles.flex} />
        {onPress && <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.seeAll}><Text style={styles.seeAllText}>See all</Text><ChevronRight size={12} color="#B37AFF" /></Pressable>}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
export default function HomeScreen({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();
  const toast = useToast();
  const [filter, setFilter] = useState('For You');
  const [claimingCoins, setClaimingCoins] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [countdownReady, setCountdownReady] = useState(false);
  const [dailyClaimOpen, setDailyClaimOpen] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [claimSuccessOpen, setClaimSuccessOpen] = useState(false);
  const dailyCoinPulse = React.useRef(new Animated.Value(0)).current;
  const dailySparkles = React.useRef(new Animated.Value(0)).current;
  const claimSuccessPulse = React.useRef(new Animated.Value(0)).current;
  const claimSuccessSparkles = React.useRef(new Animated.Value(0)).current;
  const [welcomeReward, setWelcomeReward] = useState(null);
  const [profile, setProfile] = useState(null);
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const [nearbyRevealCount, setNearbyRevealCount] = useState(0);
  const nearbyWave = React.useRef(new Animated.Value(0)).current;
  const drawerX = React.useRef(new Animated.Value(420)).current;
  const preview = label => toast(`${label} is coming soon`);
  const claimDailyReward = async () => {
    if (claimingCoins) return;
    setClaimingCoins(true);
    try {
      const wallet = await claimDailyCoins();
      const claimedAt = wallet.claimedAt || wallet.lastDailyCoinClaimAt || wallet.dailyClaimedAt || wallet.lastClaimAt || wallet.dailyCoinClaimedAt || new Date().toISOString();
      const firebaseUid = profile?.firebaseUid || getAuth().currentUser?.uid;
      await saveDailyClaimAt(firebaseUid, claimedAt);
      setProfile(current => ({ ...current, coinBalance: wallet.coinBalance ?? current?.coinBalance ?? 0, lastDailyCoinClaimAt: claimedAt }));
      setDailyClaimOpen(false);
      setDailyClaimed(false);
      setClaimSuccessOpen(true);
    } catch (error) {
      toast(error.response?.data?.message || 'Your daily coins are not ready yet.');
    } finally {
      setClaimingCoins(false);
    }
  };
  React.useEffect(() => {
    if (!dailyClaimOpen || dailyClaimed) return undefined;
    dailyCoinPulse.setValue(0);
    dailySparkles.setValue(0);
    const coinLoop = Animated.loop(Animated.sequence([
      Animated.timing(dailyCoinPulse, {toValue: 1, duration: 720, useNativeDriver: true}),
      Animated.timing(dailyCoinPulse, {toValue: 0, duration: 720, useNativeDriver: true}),
    ]));
    const sparkleLoop = Animated.loop(Animated.timing(dailySparkles, {toValue: 1, duration: 1200, useNativeDriver: true}));
    coinLoop.start();
    sparkleLoop.start();
    return () => { coinLoop.stop(); sparkleLoop.stop(); dailyCoinPulse.stopAnimation(); dailySparkles.stopAnimation(); };
  }, [dailyClaimOpen, dailyClaimed, dailyCoinPulse, dailySparkles]);
  React.useEffect(() => {
    if (!claimSuccessOpen) return undefined;
    claimSuccessPulse.setValue(0);
    claimSuccessSparkles.setValue(0);
    const coinLoop = Animated.loop(Animated.sequence([
      Animated.timing(claimSuccessPulse, {toValue: 1, duration: 680, useNativeDriver: true}),
      Animated.timing(claimSuccessPulse, {toValue: 0, duration: 680, useNativeDriver: true}),
    ]));
    const sparkleLoop = Animated.loop(Animated.timing(claimSuccessSparkles, {toValue: 1, duration: 1200, useNativeDriver: true}));
    coinLoop.start(); sparkleLoop.start();
    return () => { coinLoop.stop(); sparkleLoop.stop(); claimSuccessPulse.stopAnimation(); claimSuccessSparkles.stopAnimation(); };
  }, [claimSuccessOpen, claimSuccessPulse, claimSuccessSparkles]);
  React.useEffect(() => {
    let active = true;
    getMyProfile().then(async loadedProfile => {
      const savedClaimAt = await getDailyClaimAt(loadedProfile?.firebaseUid || getAuth().currentUser?.uid);
      const serverClaimAt = loadedProfile?.lastDailyCoinClaimAt || loadedProfile?.claimedAt || loadedProfile?.dailyClaimedAt || loadedProfile?.lastClaimAt || loadedProfile?.dailyCoinClaimedAt;
      const serverTime = new Date(serverClaimAt || 0).getTime();
      const savedTime = new Date(savedClaimAt || 0).getTime();
      const lastDailyCoinClaimAt = savedTime > serverTime ? savedClaimAt : serverClaimAt;
      if (active) setProfile({...loadedProfile, ...(lastDailyCoinClaimAt ? {lastDailyCoinClaimAt} : {})});
    }).catch(() => { });
    return () => { active = false; };
  }, []);
  React.useEffect(() => {
    let mounted = true;
    getConversations()
      .then(conversations => {
        if (mounted) setUnreadChats(conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0));
      })
      .catch(() => { });
    return () => { mounted = false; };
  }, []);
  React.useEffect(() => {
    const updateCountdown = () => {
      const lastClaim = profile?.lastDailyCoinClaimAt ? new Date(profile.lastDailyCoinClaimAt).getTime() : 0;
      setSecondsLeft(Math.max(0, Math.ceil((lastClaim + 24 * 60 * 60 * 1000 - Date.now()) / 1000)));
    };
    updateCountdown();
    setCountdownReady(true);
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [profile?.lastDailyCoinClaimAt]);
  React.useEffect(() => {
    const claimPeriodEnded = !profile?.lastDailyCoinClaimAt || Date.now() >= new Date(profile.lastDailyCoinClaimAt).getTime() + 24 * 60 * 60 * 1000;
    if (profile && countdownReady && secondsLeft === 0 && claimPeriodEnded) setDailyClaimOpen(true);
  }, [profile, countdownReady, secondsLeft]);
  React.useEffect(() => {
    if (!profile) return undefined;
    let mounted = true;
    consumeWelcomeReward().then(reward => {
      if (mounted && reward) setWelcomeReward({ ...reward, nickname: profile.nickname || reward.nickname });
    }).catch(() => { });
    return () => { mounted = false; };
  }, [profile]);
  React.useEffect(() => {
    let mounted = true;
    setLoadingPeople(true);
    getDiscoverProfiles({ page: 1, limit: 12 })
      .then(data => {
        if (!mounted) return;
        setPeople(data.users || []);
        setPage(data.pagination?.page || 1);
        setHasNextPage(!!data.pagination?.hasNextPage);
      })
      .catch(() => mounted && setPeople([]))
      .finally(() => mounted && setLoadingPeople(false));
    return () => { mounted = false; };
  }, []);
  React.useEffect(() => {
    let socket;
    let mounted = true;
    const connectPresence = async () => {
      try {
        const currentUser = getAuth().currentUser;
        if (!currentUser) return;
        const idToken = await getIdToken(currentUser);
        socket = io(SERVER_URL.replace(/\/+$/, ''), { auth: { token: idToken }, transports: ['websocket'] });
        socket.on('user:presence', presence => {
          if (!mounted) return;
          setPeople(current => current.map(person => person.firebaseUid === presence.firebaseUid ? { ...person, isOnline: presence.isOnline, lastSeen: presence.lastSeen || null } : person));
        });
        socket.on('chat:updated', () => {
          getConversations()
            .then(conversations => {
              if (mounted) setUnreadChats(conversations.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0));
            })
            .catch(() => { });
        });
      } catch (_) { }
    };
    connectPresence();
    return () => { mounted = false; socket?.disconnect(); };
  }, []);
  const preferredGender = profile?.gender?.toLowerCase();
  const matchesGenderPreference = person => {
    const personGender = person.gender?.toLowerCase();
    if (preferredGender === 'male') return personGender === 'female';
    if (preferredGender === 'female') return personGender === 'male';
    return true;
  };
  const relevantLanguages = new Set((profile?.languages || []).map(language => language.toLowerCase()));
  if (relevantLanguages.has('marathi')) relevantLanguages.add('hindi');
  const matchesLanguagePreference = person => {
    if (!relevantLanguages.size) return true;
    return (person.languages || []).some(language => relevantLanguages.has(language.toLowerCase()));
  };
  const matchingPeople = people.filter(person => matchesGenderPreference(person) && matchesLanguagePreference(person));
  const visiblePeople = filter === 'Online' ? matchingPeople.filter(person => person.isOnline === true) : matchingPeople;
  const nearbyPeople = matchingPeople.slice(0, nearbyRevealCount);
  const nearbyCity = profile?.city || profile?.location?.city || 'Your city';
  React.useEffect(() => {
    if (filter !== 'Nearby') { setNearbyRevealCount(0); return undefined; }
    setNearbyRevealCount(0);
    let reveal;
    const firstProfileTimer = setTimeout(() => setNearbyRevealCount(current => Math.min(Math.max(current, 1), matchingPeople.length)), 25000);
    const additionalProfilesTimer = setTimeout(() => {
      reveal = setInterval(() => setNearbyRevealCount(current => {
        const next = Math.min(current + 1, matchingPeople.length);
        if (next >= matchingPeople.length) clearInterval(reveal);
        return next;
      }), 5000);
    }, 30000);
    return () => { clearTimeout(firstProfileTimer); clearTimeout(additionalProfilesTimer); clearInterval(reveal); };
  }, [filter, matchingPeople.length]);
  React.useEffect(() => {
    if (filter !== 'Nearby') return undefined;
    nearbyWave.setValue(0);
    const waveLoop = Animated.loop(Animated.timing(nearbyWave, {toValue: 1, duration: 2600, useNativeDriver: true}));
    waveLoop.start();
    return () => { waveLoop.stop(); nearbyWave.stopAnimation(); };
  }, [filter, nearbyWave]);
  const connectProfiles = [
    ...matchingPeople.filter(person => person.isOnline === true),
    ...selectDemoProfiles(profile?.firebaseUid || profile?.phone || profile?.avatarSeed || 'milo-demo').filter(person => matchesGenderPreference(person) && matchesLanguagePreference(person)),
  ];  const joinCall = person => {
    navigation.navigate('AudioRoom', {person, currentUser: profile, isDemo: String(person._id || '').startsWith('demo-'), availablePeople: matchingPeople.filter(member => member.isOnline === true)});
  };
  const openClaimAction = type => {
    setClaimSuccessOpen(false);
    const person = connectProfiles[0];
    if (type === 'chat') return navigation.navigate('Chats');
    if (!person) return preview('MILO Connect');
    navigation.navigate(type === 'video' ? 'VideoRoom' : 'AudioRoom', {person, currentUser: profile, isDemo: String(person._id || '').startsWith('demo-'), availablePeople: matchingPeople.filter(member => member.isOnline === true), callType: type});
  };
  const connectRooms = [...connectProfiles, { _id: 'see-more-rooms', type: 'seeMore' }];
  const connectCardWidth = Math.max(145, (screenWidth - 42) / 2);
  const miloChatCardWidth = Math.max(96, (screenWidth - 44) / 3);
  const loadMoreProfiles = async () => {
    if (loadingMore || loadingPeople || !hasNextPage) return;
    setLoadingMore(true);
    try {
      const data = await getDiscoverProfiles({ page: page + 1, limit: 12 });
      setPeople(current => [...current, ...(data.users || [])]);
      setPage(data.pagination?.page || page + 1);
      setHasNextPage(!!data.pagination?.hasNextPage);
    } catch (_) {
      toast('Could not load more profiles. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };
  const onProfilesScroll = ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 180;
    if (nearBottom) loadMoreProfiles();
  };
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerX, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 190 }).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerX, { toValue: 420, duration: 220, useNativeDriver: true }).start(() => setDrawerOpen(false));
  };
  const userAvatar = profile?.avatarStyle || { avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender || 'female' };
  const rewardHours = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const rewardMinutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const rewardSeconds = String(secondsLeft % 60).padStart(2, '0');
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B0D20" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={onProfilesScroll}
        scrollEventThrottle={200}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={openDrawer} style={styles.headerProfile}>
            <View style={styles.headerAvatar}><ProfileAvatar {...userAvatar} photoUrl={profile?.photoUrl} /><View style={styles.headerOnline} /></View>
            <View><Text numberOfLines={1} style={styles.headerName}>{profile?.nickname || 'My Profile'}</Text><Text style={styles.tagline}>View profile</Text></View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Buy coins" onPress={() => navigation.navigate('CoinStore')} style={styles.wallet}>
              <Coin size={21} />
              <Text style={styles.balance}>{profile?.coinBalance ?? 0}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add coins"
                onPress={() => navigation.navigate('CoinStore')}
                style={styles.plus}
              >
                <Gradient from="#733DCF" to="#291A54" radius={8} />
                <Plus size={16} color="#F6DFFF" />
              </Pressable>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => preview('Notifications')}
              hitSlop={10}
              style={styles.bell}
            >
              <Bell size={22} color="#DBD8E9" />
              <View style={styles.notification} />
            </Pressable>
          </View>
        </View>

        {filter !== 'Nearby' && <View style={styles.reward}>
<Gradient from="#341763" to="#090A1B" radius={24} />
          <View style={styles.rewardTopGlow} />
          <View style={styles.rewardDiagonalGlow} />
          <View style={styles.rewardHeader}><Sparkles size={19} color="#EF80FF" fill="#EF80FF" /><Text style={styles.rewardTitle}>DAILY FREE COINS</Text></View>
          <View style={styles.rewardMain}>
            <View style={styles.dailyCoin}><Image source={require('../../../assets/images/coin.png')} style={styles.dailyCoinImage} resizeMode="contain" /><View style={styles.claimTick}><CircleCheck size={23} color="#FFFFFF" fill="#13B867" /></View></View>
            <View style={styles.rewardAmount}><Text style={styles.rewardAmountText}>70 <Text style={styles.rewardAmountLabel}>coins</Text></Text><Text style={[styles.rewardState, secondsLeft === 0 && styles.rewardReady]}>{secondsLeft > 0 ? 'claimed' : 'ready to claim'}</Text></View>
          </View>
          <View style={styles.rewardTimer}><Clock3 size={23} color="#BEB0E7" /><Text style={styles.rewardTimerLabel}>{secondsLeft > 0 ? 'Next reward in' : 'Daily reward ready'}</Text>{secondsLeft > 0 && <Text style={styles.rewardTimerValue}>{rewardHours}h {rewardMinutes}m {rewardSeconds}s</Text>}</View>
        </View>}<View style={styles.filters}>
          {FILTERS.map(({ label, icon: Icon }) => (
            <Pressable
              key={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: label === filter }}
              onPress={() => setFilter(label)}
              style={[styles.filter, label === filter && styles.selectedFilter]}
            >
              {label === filter ? (
                <Gradient from="#A447FA" to="#5916E6" radius={13} />
              ) : (
                <Gradient from="#171927" to="#0D0E1A" radius={13} />
              )}
              {Icon ? (
                <Icon
                  size={18}
                  color={label === 'Nearby' ? '#BD74FF' : '#FFFFFF'}
                  fill={label === 'For You' ? '#FFFFFF' : 'none'}
                />
              ) : (
                <View style={styles.filterDot} />
              )}
              <Text style={styles.filterLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {filter === 'Online' ? <><View style={styles.onlineSectionHeader}><View><Text style={styles.onlineSectionTitle}>MILO Connect</Text><Text style={styles.onlineSectionSubtitle}>People online right now</Text></View><View style={styles.onlineCount}><Text style={styles.onlineCountText}>{visiblePeople.length} people online</Text><View style={styles.onlineCountDot} /></View></View><View style={styles.onlineProfileList}>{visiblePeople.map(person => <OnlineProfileRow key={person._id || person.firebaseUid} person={person} onPress={joinCall} />)}</View>{!loadingPeople && !visiblePeople.length && <Text style={styles.miloChatEmpty}>No registered members are online yet.</Text>}</> : filter === 'Nearby' ? <><View style={styles.nearbyHeader}><View><Text style={styles.nearbyTitle}>Nearby</Text><Text style={styles.nearbySubtitle}>Find people in {nearbyCity}</Text></View><View style={styles.cityPill}><MapPin size={13} color="#E5CBFF" /><Text style={styles.cityPillText}>{nearbyCity}</Text><ChevronRight size={13} color="#E5CBFF" /></View></View><NearbyRadar profile={profile} people={nearbyPeople.slice(0, 7)} city={nearbyCity} wave={nearbyWave} /><View style={styles.nearbyCountCard}><View style={styles.nearbyCountIcon}><UserRound size={18} color="#BC76FF" /></View><View><Text style={styles.nearbyCountTitle}>{nearbyPeople.length} people nearby</Text><Text style={styles.nearbyCountSubtitle}>in {nearbyCity}</Text></View><ChevronRight size={18} color="#B96DFF" /></View><Text style={styles.peopleNearbyTitle}>People Nearby</Text><View style={styles.onlineProfileList}>{nearbyPeople.map(person => <OnlineProfileRow key={person._id || person.firebaseUid} person={person} onPress={joinCall} />)}</View>{!loadingPeople && !matchingPeople.length && <Text style={styles.miloChatEmpty}>No nearby members are available yet.</Text>}</> : <><SectionTitle title="MILO Connect" subtitle="Real people. Real conversations." />
          <FlatList
            horizontal
            data={connectRooms}
            keyExtractor={item => item._id}
            renderItem={({ item }) => item.type === 'seeMore' ? <SeeMoreRoomsCard cardWidth={connectCardWidth} onPress={() => preview('More rooms')} /> : <ConnectProfileCard person={item} cardWidth={connectCardWidth} onPress={joinCall} />}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={connectCardWidth + 10}
            snapToAlignment="start"
            contentContainerStyle={styles.connectList}
          />
          <SectionTitle title="MILO Chat" subtitle="Start a chat before you call." isNew onPress={() => preview('More chats')} />
          <View style={styles.miloChatRow}>{visiblePeople.slice(0, 3).map(person => <MiloChatCard key={person._id || person.firebaseUid} person={person} cardWidth={miloChatCardWidth} onPress={selectedPerson => navigation.navigate('ChatConversation', { person: selectedPerson })} />)}</View>
          {!loadingPeople && !visiblePeople.length && <Text style={styles.miloChatEmpty}>Registered members will appear here.</Text>}</>}
        <Pressable onPress={() => preview('MILO Premium')} style={styles.premiumBanner}>
          <Gradient from="#3D255F" to="#8D39E8" radius={15} />
          <Image source={require('../../../assets/icons/crown.png')} style={styles.crown} resizeMode="contain" />
          <View style={styles.premiumCopy}><Text style={styles.premiumTitle}>Go Premium</Text><Text style={styles.premiumText}>Get more visibility, unlock filters{`\n`}and enjoy better matches.</Text></View>
          <View style={styles.upgrade}><Text style={styles.upgradeText}>Upgrade</Text><ChevronRight size={15} color="#FFFFFF" /></View>
        </Pressable>
      </ScrollView>
      <WelcomeRewardModal reward={welcomeReward} onClose={() => setWelcomeReward(null)} />
<Modal transparent animationType="slide" visible={dailyClaimOpen} statusBarTranslucent onRequestClose={() => setDailyClaimOpen(false)}><View style={styles.dailySheetOverlay}><Pressable onPress={() => setDailyClaimOpen(false)} style={styles.dailySheetBackdrop} /><View style={styles.dailySheet}><View style={styles.dailySheetBackground} /><View style={styles.dailySheetGlow} /><View style={styles.sheetHandle} /><Pressable onPress={() => setDailyClaimOpen(false)} style={styles.dailyClaimClose}><X size={20} color="#F5EEFF" /></Pressable><View style={styles.dailyCoinStage}><Animated.Text style={[styles.claimSparkle, styles.claimSparkleLeft, {opacity: dailySparkles.interpolate({inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3]}), transform: [{translateY: dailySparkles.interpolate({inputRange: [0, 1], outputRange: [7, -8]})}, {rotate: dailySparkles.interpolate({inputRange: [0, 1], outputRange: ['0deg', '45deg']})}]}]}>✦</Animated.Text><Animated.View style={{transform: [{scale: dailyCoinPulse.interpolate({inputRange: [0, 1], outputRange: [0.94, 1.08]})}]}}><Image source={require('../../../assets/images/coin.png')} style={styles.dailyClaimCoin} resizeMode="contain" /></Animated.View><Animated.Text style={[styles.claimSparkle, styles.claimSparkleRight, {opacity: dailySparkles.interpolate({inputRange: [0, 0.5, 1], outputRange: [1, 0.25, 1]}), transform: [{translateY: dailySparkles.interpolate({inputRange: [0, 1], outputRange: [-7, 8]})}, {rotate: dailySparkles.interpolate({inputRange: [0, 1], outputRange: ['45deg', '0deg']})}]}]}>✦</Animated.Text></View><Text style={styles.dailyClaimTitle}>{dailyClaimed ? 'Coins claimed!' : 'Daily coins are ready!'}</Text><Text style={styles.dailyClaimBody}>{dailyClaimed ? '70 coins were added to your wallet.' : 'Claim your 70 free coins for today.'}</Text><Pressable disabled={claimingCoins || dailyClaimed} onPress={claimDailyReward} style={[styles.dailyClaimButton, dailyClaimed && styles.dailyClaimedButton]}><Gradient from="#C05BFF" to="#7025F0" radius={23} /><Coin size={25} /><Text style={styles.dailyClaimButtonText}>{dailyClaimed ? 'Claimed' : claimingCoins ? 'Claiming...' : 'Claim 70 coins'}</Text><ChevronRight size={20} color="#FFFFFF" /></Pressable></View></View></Modal>
      <Modal transparent animationType="slide" visible={claimSuccessOpen} statusBarTranslucent onRequestClose={() => setClaimSuccessOpen(false)}>
        <View style={styles.claimSuccessOverlay}>
          <Pressable accessibilityLabel="Close reward options" onPress={() => setClaimSuccessOpen(false)} style={styles.claimSuccessBackdrop} />
          <View style={styles.claimSuccessSheet}>
            <View style={styles.claimSuccessHandle} />
            <View style={styles.claimSuccessCoinStage}>
              <Animated.Text style={[styles.claimSuccessSparkle, styles.claimSuccessSparkleOne, {opacity: claimSuccessSparkles.interpolate({inputRange: [0, 0.5, 1], outputRange: [0.35, 1, 0.35]}), transform: [{translateY: claimSuccessSparkles.interpolate({inputRange: [0, 1], outputRange: [7, -8]})}]}]}>✦</Animated.Text>
              <Animated.View style={{transform: [{scale: claimSuccessPulse.interpolate({inputRange: [0, 1], outputRange: [0.94, 1.07]})}]}}><Image source={require('../../../assets/images/coin.png')} style={styles.claimSuccessCoin} resizeMode="contain" /></Animated.View>
              <Animated.Text style={[styles.claimSuccessSparkle, styles.claimSuccessSparkleTwo, {opacity: claimSuccessSparkles.interpolate({inputRange: [0, 0.5, 1], outputRange: [1, 0.3, 1]}), transform: [{translateY: claimSuccessSparkles.interpolate({inputRange: [0, 1], outputRange: [-8, 7]})}]}]}>✦</Animated.Text>
            </View>
            <Text style={styles.claimSuccessTitle}>Nice, you got <Text style={styles.claimSuccessAmount}>70 coins!</Text></Text>
            <Text style={styles.claimSuccessSubtitle}>Want to try a quick call?</Text>
            <View style={styles.claimActionRow}>
              <Pressable onPress={() => openClaimAction('audio')} style={[styles.claimActionCard, styles.audioAction]}><Phone size={27} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.claimActionTitle}>Audio Call</Text><View style={styles.claimActionPrice}><Image source={require('../../../assets/icons/coin.png')} style={styles.claimActionCoin} /><Text style={styles.claimActionPriceText}>15 /min</Text></View></Pressable>
              <Pressable onPress={() => openClaimAction('video')} style={[styles.claimActionCard, styles.videoAction]}><Video size={27} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.claimActionTitle}>Video Call</Text><View style={styles.claimActionPrice}><Image source={require('../../../assets/icons/coin.png')} style={styles.claimActionCoin} /><Text style={styles.claimActionPriceText}>60 /min</Text></View></Pressable>
              <Pressable onPress={() => openClaimAction('chat')} style={[styles.claimActionCard, styles.chatAction]}><MessageCircle size={29} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.claimActionTitle}>Chat</Text><View style={styles.claimActionPrice}><Image source={require('../../../assets/icons/coin.png')} style={styles.claimActionCoin} /><Text style={styles.claimActionPriceText}>10 /4 msgs</Text></View></Pressable>
            </View>
            <Pressable onPress={() => setClaimSuccessOpen(false)} style={styles.claimLaterButton}><Text style={styles.claimLaterIcon}>🚀</Text><Text style={styles.claimLaterText}>I will try later, continue to app</Text><ChevronRight size={20} color="#00D9FF" /></Pressable>
          </View>
        </View>
      </Modal>
      <View style={styles.bottomBar}>
        {TABS.map(({ label, icon: Icon }) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: label === 'Home' }}
            onPress={() => label === 'Profile' ? openDrawer() : label === 'Chats' ? navigation.navigate('Chats') : label !== 'Home' && preview(label)}
            style={styles.navItem}
          >
            <View style={label === 'Home' && styles.homeGlow}>
              {label === 'Chats' ? <Image source={require('../../../assets/icons/message.png')} style={styles.navMessageIcon} resizeMode="contain" /> : <Icon size={23} color={label === 'Home' ? '#BA5BFF' : '#BCB9CC'} fill="none" />}
              {label === 'Chats' && unreadChats > 0 && <View style={styles.navUnreadDot} />}
            </View>
            <Text
              style={[styles.navLabel, label === 'Home' && styles.activeNav]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {drawerOpen && <View style={styles.drawerLayer}>
        <Pressable accessibilityLabel="Close profile" onPress={closeDrawer} style={styles.drawerBackdrop} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
          <View style={styles.drawerHeader}><Text style={styles.drawerTitle}>My Profile</Text><Pressable onPress={closeDrawer} style={styles.drawerClose}><X size={22} color="#F5F0FF" /></Pressable></View>
          <View style={styles.drawerAvatar}><ProfileAvatar {...userAvatar} photoUrl={profile?.photoUrl} /><View style={styles.drawerOnline} /></View>
          <Text style={styles.drawerName}>{profile?.nickname || 'MILO user'}</Text>
          <Text style={styles.drawerPhone}>{profile?.phone || 'Complete your profile'}</Text>
          <Pressable onPress={() => { closeDrawer(); navigation.navigate('Profile'); }} style={styles.editProfile}><Text style={styles.editProfileText}>View & edit profile</Text><ChevronRight size={18} color="#FFFFFF" /></Pressable>
          <View style={styles.drawerInfo}><Text style={styles.drawerLabel}>Gender</Text><Text style={styles.drawerValue}>{profile?.gender || 'Not set'}</Text></View>
          <View style={styles.drawerInfo}><Text style={styles.drawerLabel}>Languages</Text><Text style={styles.drawerValue}>{profile?.languages?.join(', ') || 'Not set'}</Text></View>
        </Animated.View>
      </View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeOverlay: { flex: 1, backgroundColor: 'rgba(3,2,10,0.78)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 22 },
  welcomeCard: { width: '100%', alignSelf: 'stretch', minHeight: 446, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: '#B466FF', alignItems: 'center', paddingHorizontal: 22, paddingTop: 20 },
  welcomeClose: { position: 'absolute', top: 10, right: 10, zIndex: 2, width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#7C60A9', backgroundColor: 'rgba(25,12,52,0.72)', alignItems: 'center', justifyContent: 'center' },
  welcomeCloseText: { color: '#FFFFFF', fontSize: 22, lineHeight: 23 },
  welcomeConfetti: { position: 'absolute', color: '#FF70D6', fontSize: 22 },
  confettiOne: { left: 20, top: 34 }, confettiTwo: { right: 36, top: 72, color: '#FFD05A' }, confettiThree: { left: 28, top: 230, color: '#A962FF' },
  welcomeGift: { width: 132, height: 120, marginTop: 8, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 1.35 }] },
  welcomeTitle: { fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 25, marginTop: 18 },
  welcomeName: { fontFamily: 'Poppins-SemiBold', color: '#F65CD8', fontSize: 17, marginTop: -2 },
  welcomeReceived: { fontFamily: 'Poppins-Regular', color: '#E9DFF4', fontSize: 12, marginTop: -1 },
  welcomeCoins: { height: 54, minWidth: 190, marginTop: 9, borderRadius: 16, borderWidth: 1, borderColor: '#493364', backgroundColor: 'rgba(9,5,23,0.66)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  welcomeCoinText: { fontFamily: 'Poppins-Bold', color: '#FFE45C', fontSize: 23 },
  welcomeBody: { fontFamily: 'Poppins-Regular', color: '#E5DBEF', textAlign: 'center', fontSize: 11, lineHeight: 15, marginTop: 12 },
  welcomeButton: { height: 48, width: '100%', marginTop: 15, marginBottom: 16, borderRadius: 19, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  welcomeButtonText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14 }, screen: { flex: 1, backgroundColor: '#080910' },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 18,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '54%' },
  headerAvatar: { width: 47, height: 47, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#25E989' },
  headerOnline: { position: 'absolute', right: 0, bottom: 0, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: '#0B0D20', backgroundColor: '#25E989' },
  headerName: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#FFF9FF' },
  tagline: { fontFamily: 'Poppins-Regular', fontSize: 10, color: '#C9C3D8' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B334D',
    borderRadius: 18,
    padding: 4,
    gap: 5,
    backgroundColor: '#171322',
  },
  balance: { fontSize: 13, color: '#FFFFFF', marginRight: 2 },
  plus: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#9565C8',
    borderRadius: 8,
  },
  bell: { padding: 3 },
  notification: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FF426C',
  },
  reward: { minHeight: 175, borderRadius: 24, overflow: 'hidden', paddingHorizontal: 12, paddingTop: 15, paddingBottom: 12 },
dailySheetOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3,2,12,0.72)'},
  dailySheetBackdrop: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  dailySheet: {position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', alignSelf: 'stretch', minHeight: 420, backgroundColor: '#0d1117', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: '#A65CF2', overflow: 'hidden', alignItems: 'center', paddingHorizontal: 26, paddingTop: 18, paddingBottom: 32},
  dailySheetBackground: {...StyleSheet.absoluteFillObject, backgroundColor: '#0d1117'},
  dailySheetGlow: {position: 'absolute', top: -110, right: -35, width: 270, height: 270, borderRadius: 140, backgroundColor: 'rgba(247, 91, 194, 0.25)'},
  sheetHandle: {width: 44, height: 5, borderRadius: 3, backgroundColor: '#BB8DF4', marginBottom: 17},
  dailyClaimClose: {position: 'absolute', zIndex: 2, top: 20, right: 20, width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#8C62BB', backgroundColor: 'rgba(31,16,64,0.65)', alignItems: 'center', justifyContent: 'center'},
  dailyCoinStage: {width: 150, height: 145, alignItems: 'center', justifyContent: 'center'},
  dailyClaimCoin: {width: 130, height: 130},
  claimSparkle: {position: 'absolute', fontSize: 31, color: '#FFE25A'}, claimSparkleLeft: {left: 2, top: 41}, claimSparkleRight: {right: 0, top: 71},
  dailyClaimTitle: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 25, textAlign: 'center'},
  dailyClaimBody: {fontFamily: 'Poppins-Regular', color: '#DCCCEB', fontSize: 13, textAlign: 'center', marginTop: 5},
  dailyClaimButton: {height: 55, width: '100%', marginTop: 28, borderRadius: 27, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  dailyClaimedButton: {opacity: 0.72},
  dailyClaimButtonText: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15},
  claimSuccessOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2, 3, 12, 0.72)'},
  claimSuccessBackdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
  claimSuccessSheet: {backgroundColor: '#0D1117', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1.5, borderBottomWidth: 0, borderColor: '#6133FF', paddingHorizontal: 18, paddingTop: 9, paddingBottom: 27, alignItems: 'center'},
  claimSuccessHandle: {width: 42, height: 6, borderRadius: 3, backgroundColor: '#7E47FF', marginBottom: 5},
  claimSuccessCoinStage: {height: 100, width: 170, alignItems: 'center', justifyContent: 'center'},
  claimSuccessCoin: {width: 96, height: 96},
  claimSuccessSparkle: {position: 'absolute', color: '#57E6FF', fontSize: 30, fontFamily: 'Poppins-Bold'},
  claimSuccessSparkleOne: {left: 13, top: 29, color: '#7E47FF'},
  claimSuccessSparkleTwo: {right: 12, top: 21},
  claimSuccessTitle: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 24, textAlign: 'center', lineHeight: 30},
  claimSuccessAmount: {color: '#10D9F5'},
  claimSuccessSubtitle: {fontFamily: 'Poppins-Medium', color: '#C4B3F5', fontSize: 15, marginTop: 4, marginBottom: 16},
  claimActionRow: {flexDirection: 'row', width: '100%', gap: 8},
  claimActionCard: {height: 134, flex: 1, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 7},
  audioAction: {backgroundColor: '#063A52', borderColor: '#05D7E9'},
  videoAction: {backgroundColor: '#202C92', borderColor: '#5367FF'},
  chatAction: {backgroundColor: '#351276', borderColor: '#8C32F7'},
  claimActionTitle: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 13},
  claimActionPrice: {height: 25, minWidth: 77, borderRadius: 13, paddingHorizontal: 7, backgroundColor: 'rgba(3, 8, 29, 0.68)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3},
  claimActionCoin: {width: 15, height: 15},
  claimActionPriceText: {fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 9},
  claimLaterButton: {height: 48, width: '100%', marginTop: 17, borderRadius: 24, borderWidth: 1, borderColor: '#4E32EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11},
  claimLaterIcon: {fontSize: 19},
  claimLaterText: {fontFamily: 'Poppins-Medium', color: '#C7B9F3', fontSize: 11},
  rewardTopGlow: {position: 'absolute', top: -82, left: -54, right: -35, height: 151, borderBottomLeftRadius: 210, borderBottomRightRadius: 210, backgroundColor: 'rgba(129, 67, 201, 0.15)', transform: [{rotate: '-6deg'}]},
  rewardDiagonalGlow: {position: 'absolute', top: 16, right: -88, width: 316, height: 92, borderRadius: 90, backgroundColor: 'rgba(57, 29, 119, 0.34)', transform: [{rotate: '-17deg'}]},
  rewardHeader: { height: 26, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardTitle: { fontFamily: 'Poppins-SemiBold', letterSpacing: 1.2, color: '#F5EDFD', fontSize: 14 },
  rewardMain: { height: 73, flexDirection: 'row', alignItems: 'center' },

  dailyCoin: {width: 79, height: 74, alignItems: 'center', justifyContent: 'center'},
  dailyCoinImage: {width: 70, height: 70},
  claimTick: { position: 'absolute', right: 1, bottom: 3, borderRadius: 14, backgroundColor: '#131632' },
  rewardAmount: { flex: 1, marginLeft: 8 },
  rewardAmountText: { fontFamily: 'Poppins-Bold', color: '#FFD35B', fontSize: 27, lineHeight: 31 },
  rewardAmountLabel: { color: '#F7F3FF', fontSize: 24 },
  rewardState: { fontFamily: 'Poppins-Medium', color: '#50E98C', fontSize: 14, marginTop: -2 },
  rewardReady: { color: '#E685FF' },
  rewardTimer: {height: 45, marginTop: 4, borderWidth: 1, borderColor: 'rgba(118, 77, 166, 0.48)', borderRadius: 23, backgroundColor: 'rgba(52, 29, 87, 0.7)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  rewardTimerLabel: {fontFamily: 'Poppins-Regular', color: '#C8BAE6', fontSize: 11},
  rewardTimerValue: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 16 }, filters: { flexDirection: 'row', gap: 8, marginTop: 16 },
  filter: {
    flex: 1,
    minHeight: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#2D2B41',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  selectedFilter: { borderColor: '#B174FF' },
  filterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E69A',
    marginVertical: 4,
  },
  filterLabel: { fontFamily: 'Poppins-Medium', fontSize: 10, color: '#EEE7FA' },
  sectionHeading: { marginTop: 18, marginBottom: 9 },
  sectionLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 19,
    lineHeight: 24,
    color: '#E8D7FF',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    color: '#A8A5B9',
    fontSize: 10,
    lineHeight: 15,
  },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontSize: 10, color: '#B37AFF' },
  connectList: { paddingRight: 14, gap: 10 },
  onlineSectionHeader: {marginTop: 18, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  onlineSectionTitle: {fontFamily: 'Poppins-SemiBold', color: '#F1E9FB', fontSize: 17},
  onlineSectionSubtitle: {fontFamily: 'Poppins-Regular', color: '#9C96AE', fontSize: 9, marginTop: -2},
  onlineCount: {flexDirection: 'row', alignItems: 'center', gap: 4},
  onlineCountText: {fontFamily: 'Poppins-Regular', color: '#B9B2CA', fontSize: 8},
  onlineCountDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#1DE994'},
  onlineProfileList: {gap: 7},
  onlineProfileRow: {height: 64, borderRadius: 12, borderWidth: 1, borderColor: '#26304A', backgroundColor: '#0D111D', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9},
  onlineProfileAvatar: {width: 47, height: 47, borderRadius: 24, overflow: 'visible'},
  onlineProfileDot: {position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#1DE994', borderWidth: 1.5, borderColor: '#0D111D'},
  onlineProfileCopy: {flex: 1, minWidth: 0, marginLeft: 9, justifyContent: 'center'},
  onlineProfileStatus: {flexDirection: 'row', alignItems: 'center', gap: 4, height: 11},
  onlineProfileStatusDot: {width: 5, height: 5, borderRadius: 3, backgroundColor: '#1DE994'},
  onlineProfileStatusText: {fontFamily: 'Poppins-Regular', color: '#50E8A0', fontSize: 7},
  onlineProfileName: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 11, marginTop: -1},
  onlineProfileLanguage: {alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: '#221444', marginTop: 2},
  onlineProfileLanguageText: {fontFamily: 'Poppins-Medium', color: '#CFA7FF', fontSize: 7},
  onlineProfileCall: {height: 29, minWidth: 85, borderRadius: 15, backgroundColor: '#8538F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginRight: 4},
  onlineProfileCallText: {fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 9},
  onlineProfileMore: {position: 'absolute', top: 8, right: 8},
  nearbyHeader: {marginTop: 17, marginBottom: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  nearbyTitle: {fontFamily: 'Poppins-SemiBold', color: '#F5ECFF', fontSize: 19},
  nearbySubtitle: {fontFamily: 'Poppins-Regular', color: '#AAA2B9', fontSize: 9, marginTop: -3},
  cityPill: {height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#543F7B', backgroundColor: '#17132A', paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4},
  cityPillText: {fontFamily: 'Poppins-Medium', color: '#EEE4F9', fontSize: 9},
  nearbyRadar: {height: 340, marginTop: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  radarRing: {position: 'absolute', borderWidth: 1, borderColor: '#6237EE', borderRadius: 200},
  radarRingOuter: {width: 305, height: 305, borderColor: '#8B34F2'},
  radarRingMiddle: {width: 224, height: 224, borderColor: '#4F3EDB'},
  radarRingInner: {width: 134, height: 134, borderColor: '#3354CF'},
  radarGlow: {position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(130, 52, 255, 0.3)', shadowColor: '#A344FF', shadowOpacity: 0.9, shadowRadius: 30, shadowOffset: {width: 0, height: 0}},
  radarCenter: {width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#B864FF', overflow: 'visible'},
  radarCenterDot: {position: 'absolute', right: -2, bottom: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#1DE994', borderWidth: 2, borderColor: '#211044'},
  radarYou: {position: 'absolute', top: 76, alignSelf: 'center', color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 10},
  radarCity: {position: 'absolute', top: 89, alignSelf: 'center', color: '#B3A6C9', fontSize: 8},
  radarPerson: {position: 'absolute', alignItems: 'center'},
  radarPersonAvatar: {width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#A455F2', overflow: 'visible'},
  radarPersonDot: {position: 'absolute', right: -2, bottom: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#1DE994', borderWidth: 1, borderColor: '#100D21'},
  radarDistance: {fontFamily: 'Poppins-Medium', color: '#E4DCED', fontSize: 8, marginTop: 3},
  nearbyCountCard: {height: 60, marginHorizontal: 8, borderRadius: 18, borderWidth: 1, borderColor: '#3D2684', backgroundColor: '#15123C', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10},
  nearbyCountIcon: {width: 35, height: 35, borderRadius: 18, backgroundColor: '#261753', alignItems: 'center', justifyContent: 'center'},
  nearbyCountTitle: {fontFamily: 'Poppins-Medium', color: '#F1EAFE', fontSize: 12},
  nearbyCountSubtitle: {fontFamily: 'Poppins-Regular', color: '#ACA0C1', fontSize: 9, marginTop: -2},
  peopleNearbyTitle: {fontFamily: 'Poppins-SemiBold', color: '#EEE7F8', fontSize: 15, marginTop: 18, marginBottom: 9},
  connectCard: { height: 234, borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: '#364158', backgroundColor: '#0D1117', padding: 8 },
  seeMoreRoomsCard: { height: 234, borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: '#364158', backgroundColor: '#0D1117', padding: 18, justifyContent: 'center', alignItems: 'center' },
  seeMoreRoomsIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(180, 96, 255, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  seeMoreRoomsTitle: { color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 15, textAlign: 'center' },
  seeMoreRoomsText: { color: '#B9B0CB', fontFamily: 'Poppins-Regular', fontSize: 10, textAlign: 'center', marginTop: 5 },
  seeMoreRoomsArrow: { position: 'absolute', right: 13, bottom: 13, width: 32, height: 32, borderRadius: 16, backgroundColor: '#823AF1', alignItems: 'center', justifyContent: 'center' },
  connectTop: { height: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  connectMore: { width: 21, height: 21, borderRadius: 11, backgroundColor: 'rgba(10,9,22,0.46)', alignItems: 'center', justifyContent: 'center' },
  connectAvatar: { position: 'absolute', left: '50%', marginLeft: -48, top: 27, width: 96, height: 96, overflow: 'hidden', borderRadius: 48, backgroundColor: 'transparent' },
  connectName: { position: 'absolute', left: 10, right: 10, top: 130, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14 },
  connectTags: { position: 'absolute', left: 10, top: 153, flexDirection: 'row', gap: 3 },
  connectTag: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: 'rgba(24,10,48,0.5)' },
  connectTagText: { color: '#F2ECF9', fontFamily: 'Poppins-Medium', fontSize: 9 },
  connectCallButton: { position: 'absolute', left: 8, right: 8, bottom: 9, height: 38, borderRadius: 20, backgroundColor: '#873BF1', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  connectCallText: { fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 11 },
  miloChatRow: { flexDirection: 'row', gap: 7 },
  miloChatCard: { height: 185, borderRadius: 14, borderWidth: 1, borderColor: '#364158', backgroundColor: '#0D1117', overflow: 'hidden', padding: 7 },
  miloChatTop: { height: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miloChatAvatar: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', alignSelf: 'center', marginTop: 1, backgroundColor: '#A8D0F5' },
  miloChatName: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 11, marginTop: 5 },
  miloChatLanguage: { fontFamily: 'Poppins-Medium', color: '#F3ECFB', fontSize: 11, marginTop: 4 },
  miloChatButton: { height: 33, position: 'absolute', left: 7, right: 7, bottom: 10, borderRadius: 13, backgroundColor: '#B863FF', borderWidth: 1, borderColor: '#2B1046', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  miloChatButtonIcon: { width: 15, height: 15, tintColor: '#FFFFFF' },
  miloChatButtonText: { fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 11 },
  miloChatEmpty: { color: '#A9A1B9', fontSize: 11, textAlign: 'center', paddingVertical: 24 },
  cardRow: { flexDirection: 'row', gap: 7 },
  featuredCard: { minHeight: 151, borderRadius: 19, overflow: 'hidden', borderWidth: 1, borderColor: '#4D426C', padding: 8 },
  featuredTopRow: { height: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredMore: { width: 22, height: 22, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,15,34,0.55)' },
  featuredBody: { flexDirection: 'row', marginTop: 2, alignItems: 'center' },
  featuredAvatar: { width: 88, height: 88, borderRadius: 44, overflow: 'hidden', backgroundColor: '#B7AFFF' },
  featuredInfo: { flex: 1, marginLeft: 10, minWidth: 0 },
  featuredNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredName: { fontFamily: 'Poppins-Bold', fontSize: 15, color: '#FFFFFF', flexShrink: 1 },
  featuredVerified: { width: 14, height: 14, borderRadius: 9, backgroundColor: '#9B53FF', alignItems: 'center', justifyContent: 'center' },
  featuredTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  featuredTag: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 9, backgroundColor: 'rgba(15,13,31,0.55)' },
  featuredTagText: { fontFamily: 'Poppins-Medium', color: '#EEE9F6', fontSize: 7 },
  featuredLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  featuredLocationText: { color: '#E5DEEF', fontSize: 8 },
  featuredDetails: { color: '#E5DEEF', fontSize: 8, marginTop: 2 },
  featuredBio: { color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 8, marginTop: 2 },
  featuredPrompt: { color: '#DDD4E9', fontSize: 7, marginTop: 2 },
  featuredActions: { flexDirection: 'row', gap: 7, marginTop: 7 },
  featuredVideo: { flex: 1, minHeight: 31, borderRadius: 24, backgroundColor: '#8B41F2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  featuredVoice: { flex: 1, minHeight: 31, borderRadius: 24, backgroundColor: '#F43882', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  featuredActionText: { fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 9 },
  presenceBadge: { backgroundColor: 'rgba(17,18,29,0.72)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  presenceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#19E58A' },
  offlineDot: { backgroundColor: '#F5C542' }, profilePresenceDot: {position: 'absolute', top: 2, right: 2, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: '#111525', backgroundColor: '#19E58A'},
  presenceText: { fontSize: 8, color: '#FFFFFF', fontFamily: 'Poppins-Medium' },
  disabledAction: { opacity: 0.68 },
  newBadge: {
    borderWidth: 1,
    borderColor: '#027F65',
    borderRadius: 10,
    backgroundColor: '#063426',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  newText: { color: '#05E4A2', fontSize: 9 },
  chatCard: { width: '16.66%', alignItems: 'center' },
  disabledCard: { opacity: 0.45 },
  chatAvatar: { width: 47, height: 47, borderRadius: 24, overflow: 'hidden' },
  smallOnline: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15E787',
  },
  chatName: { fontFamily: 'Poppins-Medium', color: '#F1EAF8', fontSize: 9, marginTop: 5, maxWidth: '100%' },
  chatLanguage: { color: '#AFA8C4', fontSize: 8, marginTop: 1, maxWidth: '100%' },
  profilesStatus: { minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 8, flexDirection: 'row' },
  statusText: { color: '#BFB7CC', fontSize: 12 },
  emptyState: { marginTop: 10, borderRadius: 15, borderWidth: 1, borderColor: '#302B42', backgroundColor: '#161420', padding: 20, alignItems: 'center' },
  emptyTitle: { color: '#F4ECFF', fontFamily: 'Poppins-Medium', fontSize: 15 },
  emptyText: { color: '#AAA3B6', fontSize: 11, textAlign: 'center', marginTop: 5 },
  endText: { color: '#888095', fontSize: 11, textAlign: 'center', marginTop: 14 },
  premiumBanner: { height: 66, marginTop: 24, borderRadius: 15, borderWidth: 1, borderColor: '#9E5CEB', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  crown: { width: 34, height: 34, marginRight: 9 },
  premiumCopy: { flex: 1 },
  premiumTitle: { color: '#FFE549', fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  premiumText: { color: '#F1DFFF', fontSize: 8, lineHeight: 11, marginTop: 1 },
  upgrade: { minWidth: 87, height: 33, borderRadius: 18, backgroundColor: '#A654FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  upgradeText: { color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 11 },
  bottomBar: {
    marginHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 9,
    borderWidth: 1,
    borderColor: '#4F426A',
    borderRadius: 22,
    backgroundColor: 'rgba(21, 24, 35, 0.92)',
    shadowColor: '#000000',
    shadowOpacity: 0.36,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 5},
    elevation: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  navItem: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  navMessageIcon: { width: 22, height: 22, tintColor: '#BCB9CC' },
  navLabel: { color: '#C5BED3', fontSize: 9, textAlign: 'center' },
  activeNav: { color: '#CE88FF', fontWeight: '700' },
  homeGlow: {
    shadowColor: '#B04DFF',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  navUnreadDot: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F94668',
    borderWidth: 1.5,
    borderColor: '#0D0E1C',
  },
  drawerLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, flexDirection: 'row' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' },
  drawer: { width: '86%', maxWidth: 390, height: '100%', paddingHorizontal: 24, paddingTop: 22, backgroundColor: '#121021', borderLeftWidth: 1, borderColor: '#4B3A69', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 18, elevation: 18 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  drawerTitle: { color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 21 },
  drawerClose: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#241D33' },
  drawerAvatar: { width: 108, height: 108, alignSelf: 'center', marginTop: 36, borderRadius: 54, overflow: 'hidden', borderWidth: 3, borderColor: '#A65AFF' },
  drawerOnline: { position: 'absolute', right: 4, bottom: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#25E989', borderWidth: 3, borderColor: '#121021' },
  drawerName: { color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 23, textAlign: 'center', marginTop: 15 },
  drawerPhone: { color: '#B7B0C5', fontSize: 13, textAlign: 'center', marginTop: 3 },
  editProfile: { height: 54, marginTop: 30, paddingHorizontal: 18, borderRadius: 16, backgroundColor: '#8138EF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editProfileText: { fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 15 },
  drawerInfo: { paddingVertical: 18, borderBottomWidth: 1, borderColor: '#30293D' },
  drawerLabel: { color: '#A9A1BA', fontSize: 12 },
  drawerValue: { color: '#F3ECFF', fontFamily: 'Poppins-Medium', fontSize: 15, marginTop: 5, textTransform: 'capitalize' },
});
