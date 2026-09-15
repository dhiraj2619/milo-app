import React, { useState } from 'react';
import {
  FlatList,
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
  X,
} from 'lucide-react-native';
import { Gradient, Coin, Gift } from '../../components/home/HomeDecor';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { useToast } from '../../components/ui/ToastProvider';
import { getDiscoverProfiles, getMyProfile } from '../../services/userService';
import {claimDailyCoins} from '../../services/coinService';
import {consumeWelcomeReward} from '../../services/sessionService';
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
  avatarStyle: {avatarSeed: `milo-demo-${index + 1}`, background: FAKE_BACKGROUNDS[index % FAKE_BACKGROUNDS.length], gender: index % 3 === 0 ? 'male' : 'female', hair: index % 3 === 0 ? '#33221E' : '#392323', shirt: index % 3 === 0 ? '#5275BE' : '#E56D9A', bun: index % 5 === 0, glasses: index % 7 === 0},
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
function GiftMini() {
  return <Text style={styles.giftMini}>🎁</Text>;
}
const TABS = [
  {label: 'Home', icon: House},
  {label: 'Chats', icon: MessageCircle},
  {label: 'MILO Special', icon: Sparkles},
  {label: 'Connect', icon: Phone},
  {label: 'Profile', icon: UserRound},
];

const LANGUAGE_LABELS = {Hindi: 'हिंदी', Marathi: 'मराठी', Bengali: 'বাংলা', Tamil: 'தமிழ்', Telugu: 'తెలుగు', Gujarati: 'ગુજરાતી', Kannada: 'ಕನ್ನಡ', English: 'English'};
const languageLabel = language => LANGUAGE_LABELS[language] || language;
function ConnectProfileCard({person, cardWidth, onPress}) {
  const isOffline = person.isOnline !== true;
  return <View style={[styles.connectCard, {width: cardWidth}]}>
    <Gradient from="#34455F" to="#080D17" radius={16} />
    <View style={styles.connectTop}><View style={styles.presenceBadge}><View style={[styles.presenceDot, isOffline && styles.offlineDot]} /><Text style={styles.presenceText}>{isOffline ? 'Offline' : 'Online'}</Text></View><View style={styles.connectMore}><MoreHorizontal size={15} color="#F3EDFF" /></View></View>
    <View style={styles.connectAvatar}><ProfileAvatar {...person.avatarStyle} name={person.nickname} /></View>
    <Text numberOfLines={1} style={styles.connectName}>{person.nickname} {person.age || 22}</Text>
    <View style={styles.connectTags}><View style={styles.connectTag}><Text style={styles.connectTagText}>{languageLabel(person.languages[0])}</Text></View></View>
    <Pressable disabled={isOffline} onPress={() => onPress(person)} style={[styles.connectCallButton, isOffline && styles.disabledAction]}><Phone size={16} fill="#FFFFFF" color="#FFFFFF" /><Text style={styles.connectCallText}>Join Call</Text></Pressable>
  </View>;
}
function MiloChatCard({person, cardWidth, onPress}) {
  const isOffline = person.isOnline !== true;
  const name = person.nickname || person.name || 'MILO member';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Chat with ${name}`} onPress={() => onPress(person)} style={[styles.miloChatCard, {width: cardWidth}]}>
    <Gradient from="#45637F" to="#151A2B" radius={14} />
    <View style={styles.miloChatTop}><View style={styles.presenceBadge}><View style={[styles.presenceDot, isOffline && styles.offlineDot]} /><Text style={styles.presenceText}>{isOffline ? 'Offline' : 'Online'}</Text></View><MoreHorizontal size={15} color="#EDE8F8" /></View>
    <View style={styles.miloChatAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /></View>
    <Text numberOfLines={1} style={styles.miloChatName}>{name} {person.age || ''}</Text>
    <Text numberOfLines={1} style={styles.miloChatLanguage}>{languageLabel(person.languages?.[0] || 'English')}</Text>
    <View style={styles.miloChatButton}><MessageCircle size={14} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.miloChatButtonText}>Chat</Text></View>
  </Pressable>;
}function WelcomeRewardModal({reward, onClose}) {
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
export default function HomeScreen({navigation}) {
  const {width: screenWidth} = useWindowDimensions();
  const toast = useToast();
  const [filter, setFilter] = useState('For You');
  const [claimingCoins, setClaimingCoins] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [welcomeReward, setWelcomeReward] = useState(null);
  const [profile, setProfile] = useState(null);
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerX = React.useRef(new Animated.Value(420)).current;
  const preview = label => toast(`${label} is coming soon`);
  const claimDailyReward = async () => {
    if (claimingCoins) return;
    setClaimingCoins(true);
    try {
      const wallet = await claimDailyCoins();
      setProfile(current => ({...current, coinBalance: wallet.coinBalance, lastDailyCoinClaimAt: wallet.claimedAt}));
      toast('70 daily coins added to your wallet!');
    } catch (error) {
      toast(error.response?.data?.message || 'Your daily coins are not ready yet.');
    } finally {
      setClaimingCoins(false);
    }
  };
  React.useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
  }, []);
  React.useEffect(() => {
    const updateCountdown = () => {
      const lastClaim = profile?.lastDailyCoinClaimAt ? new Date(profile.lastDailyCoinClaimAt).getTime() : 0;
      setSecondsLeft(Math.max(0, Math.ceil((lastClaim + 24 * 60 * 60 * 1000 - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [profile?.lastDailyCoinClaimAt]);
  React.useEffect(() => {
    if (!profile) return undefined;
    let mounted = true;
    consumeWelcomeReward().then(reward => {
      if (mounted && reward) setWelcomeReward({...reward, nickname: profile.nickname || reward.nickname});
    }).catch(() => {});
    return () => { mounted = false; };
  }, [profile]);
  React.useEffect(() => {
    let mounted = true;
    setLoadingPeople(true);
    getDiscoverProfiles({page: 1, limit: 12})
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
        socket = io(SERVER_URL.replace(/\/+$/, ''), {auth: {token: idToken}, transports: ['websocket']});
        socket.on('user:presence', presence => {
          if (!mounted) return;
          setPeople(current => current.map(person => person.firebaseUid === presence.firebaseUid ? {...person, isOnline: presence.isOnline, lastSeen: presence.lastSeen || null} : person));
        });
      } catch (_) {}
    };
    connectPresence();
    return () => { mounted = false; socket?.disconnect(); };
  }, []);
  const visiblePeople = filter === 'Online' ? people.filter(person => person.isOnline === true) : people;
  const connectProfiles = React.useMemo(() => selectDemoProfiles(profile?.firebaseUid || profile?.phone || profile?.avatarSeed || 'milo-demo'), [profile?.firebaseUid, profile?.phone, profile?.avatarSeed]);
  const connectCardWidth = Math.max(145, (screenWidth - 42) / 2);
  const miloChatCardWidth = Math.max(96, (screenWidth - 44) / 3);
  const loadMoreProfiles = async () => {
    if (loadingMore || loadingPeople || !hasNextPage) return;
    setLoadingMore(true);
    try {
      const data = await getDiscoverProfiles({page: page + 1, limit: 12});
      setPeople(current => [...current, ...(data.users || [])]);
      setPage(data.pagination?.page || page + 1);
      setHasNextPage(!!data.pagination?.hasNextPage);
    } catch (_) {
      toast('Could not load more profiles. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };
  const onProfilesScroll = ({nativeEvent}) => {
    const {contentOffset, contentSize, layoutMeasurement} = nativeEvent;
    const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 180;
    if (nearBottom) loadMoreProfiles();
  };
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerX, {toValue: 0, useNativeDriver: true, damping: 22, stiffness: 190}).start();
  };
  const closeDrawer = () => {
    Animated.timing(drawerX, {toValue: 420, duration: 220, useNativeDriver: true}).start(() => setDrawerOpen(false));
  };
  const userAvatar = profile?.avatarStyle || {avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender || 'female'};
  const rewardHours = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
  const rewardMinutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const rewardSeconds = String(secondsLeft % 60).padStart(2, '0');
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B0D20" />
      <View style={styles.ambient} pointerEvents="none">
        <Gradient from="#171A40" to="#080910" radius={0} />
      </View>
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
            <View style={styles.wallet}>
              <Coin size={21} />
              <Text style={styles.balance}>{profile?.coinBalance ?? 0}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add coins"
                onPress={() => preview('Coin store')}
                style={styles.plus}
              >
                <Gradient from="#733DCF" to="#291A54" radius={8} />
                <Plus size={16} color="#F6DFFF" />
              </Pressable>
            </View>
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

        <View style={styles.reward}>
          <Gradient from="#40137C" to="#140B32" radius={21} glow />
          <View style={styles.rewardSparkleOne}><Sparkles size={18} fill="#FFDC63" color="#FFDC63" /></View>
          <View style={styles.rewardSparkleTwo}><Sparkles size={11} fill="#E58CFF" color="#E58CFF" /></View>
          <View style={styles.rewardGift}><Gift /></View>
          <View style={styles.rewardCopy}>
            <View style={styles.rewardEyebrow}><Sparkles size={15} fill="#FFE664" color="#FFE664" /><Text style={styles.rewardTitle}>DAILY FREE COINS</Text></View>
            <Text style={styles.rewardDescription}>Claim your free coins everyday{`\n`}and keep the conversations going!</Text>
          </View>
          <View style={styles.freeBadge}><GiftMini /><Text style={styles.freeText}>Free</Text></View>
          <View style={styles.rewardClaimArea}>
            <View style={styles.coinPill}><Coin size={29} /><Text style={styles.coinAmount}>70 coins</Text></View>
            <Pressable accessibilityRole="button" accessibilityState={{disabled: claimingCoins || secondsLeft > 0}} disabled={claimingCoins || secondsLeft > 0} onPress={claimDailyReward} style={[styles.claimButton, (claimingCoins || secondsLeft > 0) && styles.claimDisabled]}>
              <Gradient from="#C554FF" to="#6524F5" radius={23} />
              <Text style={styles.claimText}>{claimingCoins ? 'Claiming…' : secondsLeft > 0 ? 'Claimed' : 'Claim Now'}</Text><ChevronRight size={22} color="#FFFFFF" strokeWidth={3} />
            </Pressable>
          </View>
          <View style={styles.rewardCountdown}>
            <View style={styles.nextRewardLabel}><Clock3 size={23} color="#FFFFFF" /><Text style={styles.nextRewardText}>{secondsLeft > 0 ? 'Next reward in' : 'Daily reward ready'}</Text></View>
            {secondsLeft > 0 && <View style={styles.countdownGroups}>
              {[{value:rewardHours,label:'Hours'}, {value:rewardMinutes,label:'Minutes'}, {value:rewardSeconds,label:'Seconds'}].map(item => <View key={item.label} style={styles.timeBox}><Text style={styles.timeValue}>{item.value}</Text><Text style={styles.timeLabel}>{item.label}</Text></View>)}
            </View>}
          </View>
        </View>
        <View style={styles.filters}>
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

        <SectionTitle title="MILO Connect" subtitle="Real people. Real conversations." />
        <FlatList
          horizontal
          data={connectProfiles}
          keyExtractor={item => item._id}
          renderItem={({item}) => <ConnectProfileCard person={item} cardWidth={connectCardWidth} onPress={() => preview('Calling')} />}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={connectCardWidth + 10}
          snapToAlignment="start"
          contentContainerStyle={styles.connectList}
        />
        <SectionTitle
          title="MILO Chat"
          subtitle="Start a chat before you call."
          isNew
          onPress={() => preview('More chats')}
        />
        <View style={styles.miloChatRow}>
          {visiblePeople.slice(0, 3).map(person => <MiloChatCard key={person._id || person.firebaseUid} person={person} cardWidth={miloChatCardWidth} onPress={selectedPerson => navigation.navigate('ChatConversation', {person: selectedPerson})} />)}
        </View>
        {!loadingPeople && !visiblePeople.length && <Text style={styles.miloChatEmpty}>{filter === 'Online' ? 'No registered members are online yet.' : 'Registered members will appear here.'}</Text>}
        <Pressable onPress={() => preview('MILO Premium')} style={styles.premiumBanner}>
          <Gradient from="#3D255F" to="#8D39E8" radius={15} />
          <Text style={styles.crown}>♛</Text>
          <View style={styles.premiumCopy}><Text style={styles.premiumTitle}>Go Premium</Text><Text style={styles.premiumText}>Get more visibility, unlock filters{`\n`}and enjoy better matches.</Text></View>
          <View style={styles.upgrade}><Text style={styles.upgradeText}>Upgrade</Text><ChevronRight size={15} color="#FFFFFF" /></View>
        </Pressable>
      </ScrollView>
      <WelcomeRewardModal reward={welcomeReward} onClose={() => setWelcomeReward(null)} />
      <View style={styles.bottomBar}>
        <Gradient from="#17142F" to="#090B15" radius={22} />
        {TABS.map(({ label, icon: Icon }) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: label === 'Home' }}
            onPress={() => label === 'Profile' ? openDrawer() : label === 'Chats' ? navigation.navigate('Chats') : label !== 'Home' && preview(label)}
            style={styles.navItem}
          >
            <View style={label === 'Home' && styles.homeGlow}>
              <Icon
                size={23}
                color={label === 'Home' ? '#BA5BFF' : '#BCB9CC'}
                fill="none"
              />
              {label === 'Chats' && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>3</Text>
                </View>
              )}
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
        <Animated.View style={[styles.drawer, {transform: [{translateX: drawerX}]}]}>
          <View style={styles.drawerHeader}><Text style={styles.drawerTitle}>My Profile</Text><Pressable onPress={closeDrawer} style={styles.drawerClose}><X size={22} color="#F5F0FF" /></Pressable></View>
          <View style={styles.drawerAvatar}><ProfileAvatar {...userAvatar} photoUrl={profile?.photoUrl} /><View style={styles.drawerOnline} /></View>
          <Text style={styles.drawerName}>{profile?.nickname || 'MILO user'}</Text>
          <Text style={styles.drawerPhone}>{profile?.phone || 'Complete your profile'}</Text>
          <Pressable onPress={() => {closeDrawer(); navigation.navigate('Profile');}} style={styles.editProfile}><Text style={styles.editProfileText}>View & edit profile</Text><ChevronRight size={18} color="#FFFFFF" /></Pressable>
          <View style={styles.drawerInfo}><Text style={styles.drawerLabel}>Gender</Text><Text style={styles.drawerValue}>{profile?.gender || 'Not set'}</Text></View>
          <View style={styles.drawerInfo}><Text style={styles.drawerLabel}>Languages</Text><Text style={styles.drawerValue}>{profile?.languages?.join(', ') || 'Not set'}</Text></View>
        </Animated.View>
      </View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeOverlay: {flex: 1, backgroundColor: 'rgba(3,2,10,0.78)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 22},
  welcomeCard: {width: '100%', alignSelf: 'stretch', minHeight: 446, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: '#B466FF', alignItems: 'center', paddingHorizontal: 22, paddingTop: 20},
  welcomeClose: {position: 'absolute', top: 10, right: 10, zIndex: 2, width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#7C60A9', backgroundColor: 'rgba(25,12,52,0.72)', alignItems: 'center', justifyContent: 'center'},
  welcomeCloseText: {color: '#FFFFFF', fontSize: 22, lineHeight: 23},
  welcomeConfetti: {position: 'absolute', color: '#FF70D6', fontSize: 22},
  confettiOne: {left: 20, top: 34}, confettiTwo: {right: 36, top: 72, color: '#FFD05A'}, confettiThree: {left: 28, top: 230, color: '#A962FF'},
  welcomeGift: {width: 132, height: 120, marginTop: 8, alignItems: 'center', justifyContent: 'center', transform: [{scale: 1.35}]},
  welcomeTitle: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 25, marginTop: 18},
  welcomeName: {fontFamily: 'Poppins-SemiBold', color: '#F65CD8', fontSize: 17, marginTop: -2},
  welcomeReceived: {fontFamily: 'Poppins-Regular', color: '#E9DFF4', fontSize: 12, marginTop: -1},
  welcomeCoins: {height: 54, minWidth: 190, marginTop: 9, borderRadius: 16, borderWidth: 1, borderColor: '#493364', backgroundColor: 'rgba(9,5,23,0.66)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9},
  welcomeCoinText: {fontFamily: 'Poppins-Bold', color: '#FFE45C', fontSize: 23},
  welcomeBody: {fontFamily: 'Poppins-Regular', color: '#E5DBEF', textAlign: 'center', fontSize: 11, lineHeight: 15, marginTop: 12},
  welcomeButton: {height: 48, width: '100%', marginTop: 15, marginBottom: 16, borderRadius: 19, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
  welcomeButtonText: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14},  screen: { flex: 1, backgroundColor: '#080910' },
  flex: { flex: 1 },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
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
  headerProfile: {flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '54%'},
  headerAvatar: {width: 47, height: 47, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: '#25E989'},
  headerOnline: {position: 'absolute', right: 0, bottom: 0, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: '#0B0D20', backgroundColor: '#25E989'},
  headerName: {fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#FFF9FF'},
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
  reward: {height: 190, borderWidth: 1, borderColor: '#B363F2', borderRadius: 21, overflow: 'hidden', shadowColor: '#B14CFF', shadowOpacity: 0.38, shadowRadius: 15, shadowOffset: {width: 0, height: 6}},
  rewardGift: {position: 'absolute', left: 8, top: 47, width: 83, height: 75, alignItems: 'center', justifyContent: 'center', transform: [{scale: 0.9}]},
  rewardCopy: {position: 'absolute', top: 16, left: 104, right: 14},
  rewardEyebrow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  rewardTitle: {fontFamily: 'Poppins-Bold', fontSize: 10, letterSpacing: 0.2, color: '#FF9EFB'},
  rewardDescription: {fontFamily: 'Poppins-Medium', fontSize: 12, lineHeight: 16, color: '#FFFFFF', marginTop: 7},
  rewardSparkleOne: {position: 'absolute', left: 15, top: 27},
  rewardSparkleTwo: {position: 'absolute', right: 25, top: 54},
  freeBadge: {position: 'absolute', right: 10, top: 8, height: 28, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 18, paddingHorizontal: 8, backgroundColor: '#220B38', borderWidth: 1, borderColor: '#CA6CFF'},
  giftMini: {fontSize: 13},
  freeText: {fontFamily: 'Poppins-SemiBold', fontSize: 10, color: '#FFFFFF'},
  rewardClaimArea: {position: 'absolute', left: 12, right: 12, top: 88, height: 48, flexDirection: 'row', alignItems: 'center', gap: 7, padding: 5, borderRadius: 17, borderWidth: 1, borderColor: '#3E3856', backgroundColor: '#140D2B'},
  coinPill: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 4},
  coinAmount: {fontFamily: 'Poppins-Bold', fontSize: 20, color: '#FFE459'},
  claimButton: {width: 112, height: 38, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4},
  claimDisabled: {opacity: 0.62},
  claimText: {fontFamily: 'Poppins-SemiBold', fontSize: 11, color: '#FFFFFF'},
  rewardCountdown: {position: 'absolute', left: 13, right: 13, bottom: 8, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  nextRewardLabel: {flexDirection: 'row', alignItems: 'center', gap: 9, flexShrink: 1},
  nextRewardText: {fontFamily: 'Poppins-Medium', color: '#F6F0FC', fontSize: 10},
  countdownGroups: {flexDirection: 'row', gap: 5},
  timeBox: {width: 42, height: 42, borderRadius: 11, borderWidth: 1, borderColor: '#4F4765', backgroundColor: '#111120', alignItems: 'center', justifyContent: 'center'},
  timeValue: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 15, lineHeight: 18},
  timeLabel: {fontFamily: 'Poppins-Regular', color: '#DAD4E5', fontSize: 7},
  filters: { flexDirection: 'row', gap: 8, marginTop: 16 },
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
  connectList: {paddingRight: 14, gap: 10},
  connectCard: {height: 234, borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: '#616F94', backgroundColor: '#1C2133', padding: 8},
  connectTop: {height: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2},
  connectMore: {width: 21, height: 21, borderRadius: 11, backgroundColor: 'rgba(10,9,22,0.46)', alignItems: 'center', justifyContent: 'center'},
  connectAvatar: {position: 'absolute', left: '50%', marginLeft: -48, top: 27, width: 96, height: 96, overflow: 'hidden', borderRadius: 48, backgroundColor: 'transparent'},
  connectName: {position: 'absolute', left: 10, right: 10, top: 130, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14},
  connectTags: {position: 'absolute', left: 10, top: 153, flexDirection: 'row', gap: 3},
  connectTag: {borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: 'rgba(24,10,48,0.5)'},
  connectTagText: {color: '#F2ECF9', fontFamily: 'Poppins-Medium', fontSize: 9},
  connectCallButton: {position: 'absolute', left: 8, right: 8, bottom: 9, height: 38, borderRadius: 20, backgroundColor: '#873BF1', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5},
  connectCallText: {fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 11},
  miloChatRow: {flexDirection: 'row', gap: 7},
  miloChatCard: {height: 185, borderRadius: 14, borderWidth: 1, borderColor: '#465675', overflow: 'hidden', padding: 7},
  miloChatTop: {height: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  miloChatAvatar: {width: 60, height: 60, borderRadius: 30, overflow: 'hidden', alignSelf: 'center', marginTop: 1, backgroundColor: '#A8D0F5'},
  miloChatName: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 11, marginTop: 5},
  miloChatLanguage: {fontFamily: 'Poppins-Medium', color: '#F3ECFB', fontSize: 11, marginTop: 4},
  miloChatButton: {height: 33, position: 'absolute', left: 7, right: 7, bottom: 10, borderRadius: 13, backgroundColor: '#8F39F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4},
  miloChatButtonText: {fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 11},
  miloChatEmpty: {color: '#A9A1B9', fontSize: 11, textAlign: 'center', paddingVertical: 24},
  cardRow: {flexDirection: 'row', gap: 7},
  featuredCard: {minHeight: 151, borderRadius: 19, overflow: 'hidden', borderWidth: 1, borderColor: '#4D426C', padding: 8},
  featuredTopRow: {height: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  featuredMore: {width: 22, height: 22, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17,15,34,0.55)'},
  featuredBody: {flexDirection: 'row', marginTop: 2, alignItems: 'center'},
  featuredAvatar: {width: 88, height: 88, borderRadius: 44, overflow: 'hidden', backgroundColor: '#B7AFFF'},
  featuredInfo: {flex: 1, marginLeft: 10, minWidth: 0},
  featuredNameRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  featuredName: {fontFamily: 'Poppins-Bold', fontSize: 15, color: '#FFFFFF', flexShrink: 1},
  featuredVerified: {width: 14, height: 14, borderRadius: 9, backgroundColor: '#9B53FF', alignItems: 'center', justifyContent: 'center'},
  featuredTags: {flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4},
  featuredTag: {paddingHorizontal: 5, paddingVertical: 1, borderRadius: 9, backgroundColor: 'rgba(15,13,31,0.55)'},
  featuredTagText: {fontFamily: 'Poppins-Medium', color: '#EEE9F6', fontSize: 7},
  featuredLocation: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5},
  featuredLocationText: {color: '#E5DEEF', fontSize: 8},
  featuredDetails: {color: '#E5DEEF', fontSize: 8, marginTop: 2},
  featuredBio: {color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 8, marginTop: 2},
  featuredPrompt: {color: '#DDD4E9', fontSize: 7, marginTop: 2},
  featuredActions: {flexDirection: 'row', gap: 7, marginTop: 7},
  featuredVideo: {flex: 1, minHeight: 31, borderRadius: 24, backgroundColor: '#8B41F2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8},
  featuredVoice: {flex: 1, minHeight: 31, borderRadius: 24, backgroundColor: '#F43882', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8},
  featuredActionText: {fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 9},
  presenceBadge: {backgroundColor: 'rgba(17,18,29,0.72)', borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4},
  presenceDot: {width: 7, height: 7, borderRadius: 4, backgroundColor: '#19E58A'},
  offlineDot: {backgroundColor: '#8A8493'},
  presenceText: {fontSize: 8, color: '#FFFFFF', fontFamily: 'Poppins-Medium'},
  disabledAction: {opacity: 0.68},
  newBadge: {
    borderWidth: 1,
    borderColor: '#027F65',
    borderRadius: 10,
    backgroundColor: '#063426',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  newText: { color: '#05E4A2', fontSize: 9 },
  chatCard: {width: '16.66%', alignItems: 'center'},
  disabledCard: {opacity: 0.45},
  chatAvatar: {width: 47, height: 47, borderRadius: 24, overflow: 'hidden'},
  smallOnline: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15E787',
  },
  chatName: {fontFamily: 'Poppins-Medium', color: '#F1EAF8', fontSize: 9, marginTop: 5, maxWidth: '100%'},
  chatLanguage: {color: '#AFA8C4', fontSize: 8, marginTop: 1, maxWidth: '100%'},
  profilesStatus: {minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 8, flexDirection: 'row'},
  statusText: {color: '#BFB7CC', fontSize: 12},
  emptyState: {marginTop: 10, borderRadius: 15, borderWidth: 1, borderColor: '#302B42', backgroundColor: '#161420', padding: 20, alignItems: 'center'},
  emptyTitle: {color: '#F4ECFF', fontFamily: 'Poppins-Medium', fontSize: 15},
  emptyText: {color: '#AAA3B6', fontSize: 11, textAlign: 'center', marginTop: 5},
  endText: {color: '#888095', fontSize: 11, textAlign: 'center', marginTop: 14},
  premiumBanner: {height: 66, marginTop: 24, borderRadius: 15, borderWidth: 1, borderColor: '#9E5CEB', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12},
  crown: {fontSize: 34, color: '#FFD643', marginRight: 9},
  premiumCopy: {flex: 1},
  premiumTitle: {color: '#FFE549', fontFamily: 'Poppins-SemiBold', fontSize: 15},
  premiumText: {color: '#F1DFFF', fontSize: 8, lineHeight: 11, marginTop: 1},
  upgrade: {minWidth: 87, height: 33, borderRadius: 18, backgroundColor: '#A654FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2},
  upgradeText: {color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 11},
  bottomBar: {
    marginHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 9,
    borderWidth: 1,
    borderColor: '#4F426A',
    borderRadius: 22,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  navItem: {flex: 1, minWidth: 0, alignItems: 'center', gap: 6},
  navLabel: {color: '#C5BED3', fontSize: 9, textAlign: 'center'},
  activeNav: { color: '#CE88FF', fontWeight: '700' },
  homeGlow: {
    shadowColor: '#B04DFF',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  navBadge: {
    position: 'absolute',
    right: -7,
    top: -7,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#F94668',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBadgeText: { color: '#FFFFFF', fontSize: 10 },
  drawerLayer: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, flexDirection: 'row'},
  drawerBackdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.62)'},
  drawer: {width: '86%', maxWidth: 390, height: '100%', paddingHorizontal: 24, paddingTop: 22, backgroundColor: '#121021', borderLeftWidth: 1, borderColor: '#4B3A69', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 18, elevation: 18},
  drawerHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  drawerTitle: {color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 21},
  drawerClose: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#241D33'},
  drawerAvatar: {width: 108, height: 108, alignSelf: 'center', marginTop: 36, borderRadius: 54, overflow: 'hidden', borderWidth: 3, borderColor: '#A65AFF'},
  drawerOnline: {position: 'absolute', right: 4, bottom: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#25E989', borderWidth: 3, borderColor: '#121021'},
  drawerName: {color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 23, textAlign: 'center', marginTop: 15},
  drawerPhone: {color: '#B7B0C5', fontSize: 13, textAlign: 'center', marginTop: 3},
  editProfile: {height: 54, marginTop: 30, paddingHorizontal: 18, borderRadius: 16, backgroundColor: '#8138EF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  editProfileText: {fontFamily: 'Poppins-Medium', color: '#FFFFFF', fontSize: 15},
  drawerInfo: {paddingVertical: 18, borderBottomWidth: 1, borderColor: '#30293D'},
  drawerLabel: {color: '#A9A1BA', fontSize: 12},
  drawerValue: {color: '#F3ECFF', fontFamily: 'Poppins-Medium', fontSize: 15, marginTop: 5, textTransform: 'capitalize'},
});
