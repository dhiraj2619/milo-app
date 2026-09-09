import React, { useId, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  House,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Star,
  UserRound,
} from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { useToast } from '../../components/ui/ToastProvider';

const CONNECT = [
  {
    name: 'Aanya',
    languages: 'Hindi, English',
    background: '#FFD88C',
    tint: '#9963EC',
    verified: true,
  },
  {
    name: 'Riya',
    languages: 'Marathi, Hindi',
    background: '#F89AAB',
    tint: '#7599EE',
    hair: '#63362C',
  },
  {
    name: 'Kiara',
    languages: 'English, Tamil',
    background: '#CBD6F7',
    tint: '#AAA0EF',
    shirt: '#ECE9FA',
  },
];
const CHAT = [
  {
    name: 'Sweety',
    languages: 'Hindi',
    background: '#FFBC64',
    tint: '#202237',
  },
  {
    name: 'Muskan',
    languages: 'Marathi',
    background: '#F39CC9',
    tint: '#242238',
    favorite: true,
  },
  {
    name: 'Neha',
    languages: 'English',
    background: '#A095EF',
    tint: '#242238',
    glasses: true,
    shirt: '#6DAEBB',
  },
];
function Gradient({ from = '#914AFF', to = '#6131E9', radius = 18 }) {
  const id = useId();
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
    >
      <Defs>
        <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
    </Svg>
  );
}
function PersonCard({ person, chat, onPress }) {
  return (
    <View style={styles.card}>
      <View style={styles.portraitArea}>
        <Gradient from={person.tint} to="#171522" radius={16} />
        <View style={styles.avatar}>
          <ProfileAvatar {...person} />
        </View>
        <View style={styles.onlineDot} />
        {person.favorite && (
          <View style={styles.heartBadge}>
            <Text style={styles.heart}>♥</Text>
          </View>
        )}
      </View>
      <View style={styles.nameRow}>
        <Text numberOfLines={1} style={styles.name}>
          {person.name}
        </Text>
        {person.verified && (
          <View style={styles.verified}>
            <Check size={10} color="white" strokeWidth={3} />
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={styles.languages}>
        {person.languages}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${chat ? 'Chat with' : 'Call'} ${person.name}`}
        onPress={onPress}
        style={({ pressed }) => [styles.cardButton, pressed && styles.pressed]}
      >
        <Gradient radius={22} />
        {chat ? (
          <MessageCircle size={14} color="white" fill="white" />
        ) : (
          <Phone size={13} color="white" fill="white" />
        )}
        <Text style={styles.cardButtonLabel}>
          {chat ? 'Chat' : 'Join Call'}
        </Text>
      </Pressable>
    </View>
  );
}
export default function HomeScreen() {
  const [filter, setFilter] = useState('For You');
  const [claimed, setClaimed] = useState(false);
  const toast = useToast();
  const preview = feature => toast(`${feature} is coming soon`);
  const claim = () => {
    setClaimed(true);
    toast('50 demo coins claimed');
  };
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#080910" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <View>
              <Text style={styles.logo}>MiLO</Text>
              <Text style={styles.logoHeart}>♥</Text>
            </View>
            <Text style={styles.tagline}>Meet. Talk. Connect.</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.wallet}>
              <Text style={styles.coin}>🪙</Text>
              <Text style={styles.balance}>{claimed ? 170 : 120}</Text>
              <Pressable
                accessibilityLabel="Add coins"
                accessibilityRole="button"
                onPress={() => preview('Coin store')}
                style={styles.addCoins}
              >
                <Plus size={16} color="white" />
              </Pressable>
            </View>
            <Pressable
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => preview('Notifications')}
              style={styles.bell}
            >
              <Bell size={24} color="#DFDDE8" />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>
        </View>
        <View style={styles.reward}>
          <Gradient from="#653189" to="#17112F" />
          <View style={styles.rewardHeading}>
            <Text style={styles.gift}>🎁</Text>
            <View style={styles.flex}>
              <Text style={styles.rewardTitle}>DAILY FREE COINS</Text>
              <Text style={styles.rewardDescription}>
                Claim your free coins everyday{'\n'}and keep the conversations
                going!
              </Text>
            </View>
          </View>
          <View style={styles.claimRow}>
            <Text style={styles.rewardCoin}>🪙</Text>
            <Text style={styles.rewardAmount}>50 coins</Text>
            <Pressable
              accessibilityRole="button"
              disabled={claimed}
              onPress={claim}
              style={styles.claimButton}
            >
              <Gradient radius={22} />
              <Text style={styles.claimText}>
                {claimed ? 'Claimed' : 'Claim'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.rewardTimer}>
            <Clock3 size={15} color="#DBD4E9" />
            <Text style={styles.timerText}>
              Next reward in <Text style={styles.timerBold}>10h 18m 40s</Text>
            </Text>
          </View>
        </View>
        <View style={styles.filters}>
          {[
            { label: 'For You', icon: Star },
            { label: 'Online', icon: null },
            { label: 'Nearby', icon: MapPin },
          ].map(({ label, icon: Icon }) => (
            <Pressable
              key={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === label }}
              onPress={() => {
                setFilter(label);
                if (label === 'Nearby') {
                  toast('Showing sample nearby profiles');
                }
              }}
              style={[styles.filter, filter === label && styles.filterSelected]}
            >
              {filter === label && <Gradient radius={16} />}
              {Icon ? (
                <Icon
                  size={21}
                  color={label === 'Nearby' ? '#C071FF' : '#FFFFFF'}
                  fill={label === 'For You' ? '#FFFFFF' : 'none'}
                />
              ) : (
                <View style={styles.filterOnline} />
              )}
              <Text style={styles.filterText}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MILO Connect</Text>
          <View style={styles.flex} />
          <Pressable
            onPress={() => preview('More profiles')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.cards}>
          {CONNECT.map(person => (
            <PersonCard
              key={person.name}
              person={person}
              onPress={() => preview('Voice calling')}
            />
          ))}
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MILO Chat</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newText}>New</Text>
          </View>
          <View style={styles.flex} />
          <Pressable
            onPress={() => preview('More chats')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.cards}>
          {CHAT.map(person => (
            <PersonCard
              key={person.name}
              person={person}
              chat
              onPress={() => preview('Chat')}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => preview('Premium')}
          style={styles.premium}
        >
          <Gradient from="#282218" to="#342A1B" radius={16} />
          <Crown size={31} color="#FFD35C" fill="#FFD35C" />
          <View style={styles.flex}>
            <Text style={styles.premiumTitle}>Go Premium</Text>
            <Text style={styles.premiumDescription}>
              Get more visibility & better matches
            </Text>
          </View>
          <View style={styles.premiumArrow}>
            <ChevronRight size={18} color="#4B3114" />
          </View>
        </Pressable>
      </ScrollView>
      <View style={styles.bottomBar}>
        {[
          { label: 'Home', icon: House },
          { label: 'Chats', icon: MessageCircle },
          { label: 'Calls', icon: Phone },
          { label: 'Profile', icon: UserRound },
        ].map(({ label, icon: Icon }) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: label === 'Home' }}
            onPress={() => label !== 'Home' && preview(label)}
            style={styles.navItem}
          >
            <View>
              <Icon
                size={24}
                color={label === 'Home' ? '#9451FF' : '#BCBBC6'}
                fill={label === 'Home' ? '#9451FF' : 'none'}
              />
              {label === 'Chats' && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>3</Text>
                </View>
              )}
            </View>
            <Text
              style={[styles.navLabel, label === 'Home' && styles.navActive]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080910' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  logo: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 33,
    lineHeight: 42,
    color: '#FFF7FF',
    letterSpacing: -1,
  },
  logoHeart: {
    position: 'absolute',
    left: 38,
    top: -5,
    color: '#FF538F',
    fontSize: 14,
  },
  tagline: { fontFamily: 'Poppins-Regular', color: '#E1DCE8', fontSize: 11 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
    paddingTop: 6,
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#302B42',
    borderRadius: 22,
    padding: 4,
    gap: 6,
  },
  coin: { fontSize: 22 },
  balance: { fontSize: 15, color: '#FFFFFF', marginRight: 3 },
  addCoins: {
    backgroundColor: '#783BF5',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: { paddingTop: 3 },
  notificationDot: {
    position: 'absolute',
    right: -2,
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#FF5066',
  },
  reward: {
    borderWidth: 1,
    borderColor: '#684094',
    borderRadius: 18,
    padding: 12,
    overflow: 'hidden',
  },
  rewardHeading: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  gift: { fontSize: 50 },
  rewardTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
  },
  rewardDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#F0E9F9',
  },
  claimRow: {
    backgroundColor: '#171029',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  rewardCoin: { fontSize: 28 },
  rewardAmount: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 22,
    color: '#FFDA62',
    flex: 1,
  },
  claimButton: {
    minWidth: 90,
    minHeight: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: { color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 13 },
  rewardTimer: {
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  timerText: { fontSize: 12, color: '#E2DCEB' },
  timerBold: { fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 6 },
  filter: {
    flex: 1,
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E2B41',
    backgroundColor: '#11121F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  filterSelected: { borderColor: '#A474FF' },
  filterOnline: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#21DE85',
    marginVertical: 4,
  },
  filterText: { color: '#F4EEFA', fontSize: 12, fontFamily: 'Poppins-Regular' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    color: '#F6F5FA',
    fontSize: 20,
  },
  seeAll: { color: '#C6B4E1', fontSize: 12 },
  cards: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#1A1829',
    borderWidth: 1,
    borderColor: '#2B263E',
    borderRadius: 18,
    overflow: 'hidden',
    paddingBottom: 7,
  },
  portraitArea: { height: 100, width: '100%' },
  avatar: { position: 'absolute', left: 5, right: 5, top: 7, bottom: 0 },
  onlineDot: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#00D875',
    borderWidth: 2,
    borderColor: '#83F0B4',
    right: 7,
    top: 9,
  },
  heartBadge: {
    position: 'absolute',
    right: 6,
    bottom: 0,
    borderRadius: 13,
    width: 24,
    height: 24,
    backgroundColor: '#FF496E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: { color: 'white', fontSize: 19 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 3,
    marginTop: 3,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    flexShrink: 1,
  },
  verified: { backgroundColor: '#8C44FF', padding: 2, borderRadius: 8 },
  languages: {
    color: '#D1CADC',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
    marginBottom: 8,
  },
  cardButton: {
    marginHorizontal: 5,
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardButtonLabel: { fontSize: 11, color: 'white' },
  pressed: { opacity: 0.75 },
  newBadge: {
    borderWidth: 1,
    borderColor: '#00CA78',
    backgroundColor: '#08251E',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 1,
  },
  newText: { color: '#71FFB4', fontSize: 11 },
  premium: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#75603A',
    borderRadius: 16,
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 13,
    overflow: 'hidden',
  },
  premiumTitle: {
    color: '#FFCF5A',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  premiumDescription: { color: '#ECE5DA', fontSize: 10 },
  premiumArrow: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#DCA143',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#363045',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#0B0B14',
    paddingTop: 13,
    paddingBottom: 10,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 7 },
  navLabel: { fontSize: 11, color: '#DDD8E4' },
  navActive: { color: '#A367FF', fontWeight: '700' },
  chatBadge: {
    position: 'absolute',
    right: -8,
    top: -7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF475C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBadgeText: { fontSize: 10, color: 'white' },
});
