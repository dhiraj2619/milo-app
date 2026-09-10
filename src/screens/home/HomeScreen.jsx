import React, { useState } from 'react';
import {
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
  Check,
  ChevronRight,
  Clock3,
  House,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react-native';
import { Gradient, Coin, Gift } from '../../components/home/HomeDecor';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { useToast } from '../../components/ui/ToastProvider';

const PEOPLE = [
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
];
const FILTERS = [
  { label: 'For You', icon: Star },
  { label: 'Online' },
  { label: 'Nearby', icon: MapPin },
];
const TABS = [
  { label: 'Home', icon: House },
  { label: 'Chats', icon: MessageCircle },
  { label: 'Calls', icon: Phone },
  { label: 'Profile', icon: UserRound },
];

function CallCard({ person, onPress }) {
  return (
    <View style={styles.callCard}>
      <Gradient from="#25273C" to="#151321" radius={17} />
      <View style={styles.portrait}>
        <ProfileAvatar {...person} />
        <View style={styles.online} />
      </View>
      <View style={styles.personNameRow}>
        <Text numberOfLines={1} style={styles.personName}>
          {person.name}
        </Text>
        <Text style={styles.age}>{person.age}</Text>
        {person.verified && (
          <View style={styles.verified}>
            <Check size={9} strokeWidth={3} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.languageTags}>
        {person.languages.map(language => (
          <View key={language} style={styles.languageTag}>
            <Text style={styles.languageText}>{language}</Text>
          </View>
        ))}
      </View>
      <Text numberOfLines={1} style={styles.bio}>
        {person.bio}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Join call with ${person.name}`}
        onPress={onPress}
        style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}
      >
        <Gradient radius={22} />
        <Phone size={13} fill="#FFFFFF" color="#FFFFFF" />
        <Text style={styles.callLabel}>Join Call</Text>
      </Pressable>
    </View>
  );
}
function ChatCard({ person, onPress }) {
  return (
    <View style={styles.chatCard}>
      <Gradient from="#1C2135" to="#121321" radius={14} />
      <View style={styles.chatTop}>
        <View style={styles.chatAvatar}>
          <ProfileAvatar {...person} />
          <View style={styles.smallOnline} />
        </View>
        <View style={styles.chatDetails}>
          <Text numberOfLines={1} style={styles.chatName}>
            {person.name}
          </Text>
          <Text style={styles.chatLanguage}>{person.language}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${person.name}`}
        onPress={onPress}
        style={({ pressed }) => [styles.chatButton, pressed && styles.pressed]}
      >
        <MessageCircle size={11} color="#FFFFFF" fill="#FFFFFF" />
        <Text style={styles.chatButtonText}>Chat</Text>
      </Pressable>
    </View>
  );
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
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          hitSlop={8}
          style={styles.seeAll}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight size={12} color="#B37AFF" />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
export default function HomeScreen({navigation}) {
  const toast = useToast();
  const [filter, setFilter] = useState('For You');
  const [claimed, setClaimed] = useState(false);
  const preview = label => toast(`${label} is coming soon`);
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
              <Coin size={21} />
              <Text style={styles.balance}>{claimed ? 220 : 170}</Text>
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
          <Gradient from="#8139CF" to="#2B1555" radius={17} glow />
          <View style={styles.rewardTop}>
            <Gift />
            <View style={styles.rewardCopy}>
              <Text style={styles.rewardTitle}>DAILY FREE COINS</Text>
              <Text style={styles.rewardDescription}>
                Claim your free coins everyday{'\n'}and keep the conversations
                going!
              </Text>
            </View>
          </View>
          <View style={styles.freeBadge}>
            <Sparkles size={10} color="#FFCC6B" />
            <Text style={styles.freeText}>Free</Text>
          </View>
          <View style={styles.claimRow}>
            <Coin size={27} />
            <Text style={styles.coinAmount}>50 coins</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: claimed }}
              disabled={claimed}
              onPress={() => {
                setClaimed(true);
                toast('50 demo coins claimed');
              }}
              style={styles.claimButton}
            >
              <Gradient from="#D25BFF" to="#6B25EE" radius={18} />
              <Text style={styles.claimText}>
                {claimed ? 'Claimed' : 'Claim Now'}
              </Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.timer}>
            <Clock3 size={12} color="#C4B8D8" />
            <Text style={styles.timerText}>
              Next reward in <Text style={styles.timerBold}>10h 18m 40s</Text>
            </Text>
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

        <SectionTitle
          title="MILO Connect"
          subtitle="Real people. Real conversations."
          onPress={() => preview('More profiles')}
        />
        <View style={styles.cardRow}>
          {PEOPLE.map(person => (
            <CallCard
              key={person.name}
              person={person}
              onPress={() => preview('Voice calling')}
            />
          ))}
        </View>
        <SectionTitle
          title="MILO Chat"
          subtitle="Start a chat before you call."
          isNew
          onPress={() => preview('More chats')}
        />
        <View style={styles.cardRow}>
          {CHATS.map(person => (
            <ChatCard
              key={person.name}
              person={person}
              onPress={() => preview('Chat')}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <Gradient from="#17142F" to="#090B15" radius={22} />
        {TABS.map(({ label, icon: Icon }) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: label === 'Home' }}
            onPress={() => label === 'Profile' ? navigation.navigate('Profile') : label !== 'Home' && preview(label)}
            style={styles.navItem}
          >
            <View style={label === 'Home' && styles.homeGlow}>
              <Icon
                size={23}
                color={label === 'Home' ? '#BA5BFF' : '#BCB9CC'}
                fill={label === 'Home' ? '#A449FA' : 'none'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080910' },
  flex: { flex: 1 },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 31,
    lineHeight: 37,
    color: '#FFF9FF',
    letterSpacing: -1,
  },
  logoHeart: {
    position: 'absolute',
    left: 34,
    top: -6,
    fontSize: 15,
    color: '#FF628C',
  },
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
  reward: {
    borderWidth: 1,
    borderColor: '#A265DE',
    borderRadius: 17,
    padding: 12,
    overflow: 'hidden',
    shadowColor: '#A447FA',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  rewardTop: { flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
  rewardCopy: { flex: 1, paddingTop: 5 },
  rewardTitle: { fontFamily: 'Poppins-Bold', fontSize: 14, color: '#FFFFFF' },
  rewardDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    lineHeight: 13,
    color: '#F3E8FF',
  },
  freeBadge: {
    position: 'absolute',
    right: 9,
    top: 6,
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    backgroundColor: '#542278',
    borderColor: '#D984F3',
    borderWidth: 0.7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  freeText: { fontSize: 9, color: '#FFEAF6' },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 11,
    gap: 9,
    backgroundColor: '#1C0E3C',
    borderRadius: 15,
  },
  coinAmount: {
    flex: 1,
    fontFamily: 'Poppins-Bold',
    fontSize: 21,
    color: '#FFDC51',
  },
  claimButton: {
    height: 35,
    minWidth: 101,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  claimText: { fontFamily: 'Poppins-Medium', fontSize: 11, color: '#FFFFFF' },
  timer: {
    marginTop: 5,
    borderRadius: 12,
    backgroundColor: '#1B0C36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  timerText: { fontSize: 9, color: '#C9BBD9' },
  timerBold: { color: '#F1EAF8', fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 10, marginTop: 22 },
  filter: {
    flex: 1,
    minHeight: 51,
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
  sectionHeading: { marginTop: 28, marginBottom: 14 },
  sectionLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    lineHeight: 27,
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
  cardRow: { flexDirection: 'row', gap: 7 },
  callCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: '#36334C',
    borderRadius: 17,
    padding: 9,
    overflow: 'hidden',
  },
  portrait: { width: '100%', aspectRatio: 1, maxHeight: 140 },
  online: {
    position: 'absolute',
    right: 3,
    top: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#20EE90',
    borderWidth: 1,
    borderColor: '#398C77',
  },
  personNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  personName: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    flexShrink: 1,
  },
  age: { color: '#DDD8EA', fontSize: 10 },
  verified: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#5E526F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 3,
  },
  languageTag: {
    borderRadius: 8,
    backgroundColor: '#2C2B40',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  languageText: { fontSize: 8, color: '#D1CDDF' },
  bio: { fontSize: 8, color: '#DDD7E8', marginTop: 7, marginBottom: 7 },
  callButton: {
    height: 33,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  callLabel: { color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 10 },
  pressed: { opacity: 0.7 },
  newBadge: {
    borderWidth: 1,
    borderColor: '#027F65',
    borderRadius: 10,
    backgroundColor: '#063426',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  newText: { color: '#05E4A2', fontSize: 9 },
  chatCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#292A40',
    padding: 8,
    overflow: 'hidden',
  },
  chatTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatAvatar: { width: '48%', aspectRatio: 1 },
  chatDetails: { flex: 1 },
  smallOnline: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15E787',
  },
  chatName: { fontFamily: 'Poppins-Medium', color: '#F1EAF8', fontSize: 9 },
  chatLanguage: { color: '#AFA8C4', fontSize: 8, marginTop: 2 },
  chatButton: {
    alignSelf: 'flex-end',
    minHeight: 24,
    borderRadius: 14,
    backgroundColor: '#3B285F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  chatButtonText: { fontSize: 9, color: '#FFFFFF' },
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
  navItem: { flex: 1, alignItems: 'center', gap: 6 },
  navLabel: { color: '#C5BED3', fontSize: 10 },
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
});
