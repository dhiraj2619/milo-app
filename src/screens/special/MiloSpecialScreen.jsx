import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, ChevronRight, Crown, Heart, House, Lock, MessageCircle, Phone, Plus, RefreshCw, Sparkles, UserRound, Video } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { Coin, Gradient } from '../../components/home/HomeDecor';
import MiloConnectModal from '../../components/subscription/MiloConnectModal';
import { PromptCard } from '../../components/profile/Interests';
import { useToast } from '../../components/ui/ToastProvider';
import { getMyProfile } from '../../services/userService';
import { answerDailyQuestion, getSpecialHome, showAnotherMatch } from '../../services/specialService';
import { interestEmoji } from '../../config/profileOptions';
import { MOOD_ROOMS, SPEED_TALK } from '../../config/rooms';

// MILO Special: free to try every day, MILO Connect (or coins) for more. The server sets every limit.
const TABS = [{ label: 'Home', icon: House }, { label: 'Chats', icon: MessageCircle }, { label: 'MILO Special', icon: Sparkles }, { label: 'Connect', icon: Phone }, { label: 'Profile', icon: UserRound }];
const ROOM_REFRESH_MS = 15000;
const ANSWERS_SHOWN = 4;
const nameOf = person => person?.nickname || person?.name || 'MILO member';

function SectionHeader({ title, subtitle, badge }) {
  return <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text>{badge}</View>
    {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>;
}

const FreeBadge = () => <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>;

function matchReason(reasons) {
  if (!reasons) return null;
  const interests = reasons.sharedInterests.slice(0, 2).map(item => `${interestEmoji(item)} ${item}`);
  if (interests.length) return `You both love ${interests.join(' & ')}`;
  if (reasons.sharedLanguages.length) return `You both speak ${reasons.sharedLanguages.slice(0, 2).join(' & ')}`;
  return 'Someone new we think you’ll get along with';
}

function TodaysMatch({ match, subscriber, busy, onCall, onChat, onOpen, onAnother, onUpgrade }) {
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const person = match?.person;
  if (!person) {
    return <View style={styles.empty}><Text style={styles.emptyTitle}>No match yet today</Text><Text style={styles.emptyText}>New people join MILO every day. Pull down to refresh.</Text></View>;
  }
  const online = person.isOnline === true;
  const freeLeft = Math.max(match.included - match.used, 0);
  const anotherLabel = !match.canShowAnother ? 'That’s all for today'
    : match.nextCost === 0 ? `Show another · ${freeLeft} free left`
      : `Show another · ${match.nextCost}`;

  return <View style={styles.match}>
    <Gradient from="#5B21B6" to="#160A36" radius={26} glow />
    <View style={styles.matchBadge}><Sparkles size={12} color="#FFD45E" fill="#FFD45E" /><Text style={styles.matchBadgeText}>TODAY'S MATCH</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${nameOf(person)}'s profile`} onPress={() => onOpen(person)} style={styles.matchBody}>
      <View>
        <Animated.View style={[styles.matchGlow, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }]} />
        <View style={styles.matchAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={nameOf(person)} photoUrl={person.photoUrl} /></View>
        <View style={[styles.presenceDot, !online && styles.offlineDot]} />
      </View>
      <View style={styles.matchCopy}>
        <Text numberOfLines={1} style={styles.matchName}>{nameOf(person)}</Text>
        <Text style={[styles.matchStatus, !online && styles.matchStatusAway]}>{online ? '● Online now' : '● Away · try a chat'}</Text>
        <Text style={styles.matchReason}>{matchReason(match.reasons)}</Text>
      </View>
    </Pressable>
    {!!person.prompts?.[0] && <View style={styles.matchPrompt}><PromptCard prompt={person.prompts[0]} compact /></View>}
    <View style={styles.matchActions}>
      <Pressable accessibilityRole="button" onPress={() => onCall(person, 'audio')} style={({ pressed }) => [styles.matchButton, styles.matchPrimary, pressed && styles.pressed]}><Phone size={16} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.matchButtonText}>Audio</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => onCall(person, 'video')} style={({ pressed }) => [styles.matchButton, styles.matchPrimary, pressed && styles.pressed]}><Video size={17} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.matchButtonText}>Video</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => onChat(person)} style={({ pressed }) => [styles.matchButton, styles.matchSecondary, pressed && styles.pressed]}><MessageCircle size={16} color="#E9D5FF" /><Text style={styles.matchButtonText}>Chat</Text></Pressable>
    </View>
    <View style={styles.matchFooter}>
      <Pressable accessibilityRole="button" disabled={busy || !match.canShowAnother} onPress={onAnother} style={({ pressed }) => [styles.anotherButton, (!match.canShowAnother) && styles.disabled, pressed && styles.pressed]}>
        {busy ? <ActivityIndicator size="small" color="#E9D5FF" /> : <RefreshCw size={14} color="#E9D5FF" />}
        <Text style={styles.anotherText}>{anotherLabel}</Text>
        {match.canShowAnother && match.nextCost > 0 && <Coin size={14} />}
      </Pressable>
      {!subscriber && <Pressable accessibilityRole="button" onPress={onUpgrade} hitSlop={6}><Text style={styles.upsellLink}>3 a day with MILO Connect</Text></Pressable>}
    </View>
  </View>;
}

function SpeedTalkCard({ speedTalk, subscriber, onStart, onUpgrade }) {
  const Icon = SPEED_TALK.icon;
  const left = speedTalk.limit === null ? null : Math.max(speedTalk.limit - speedTalk.used, 0);
  const outOfRounds = left === 0;
  return <Pressable accessibilityRole="button" accessibilityLabel="Start Speed Talk" onPress={outOfRounds ? onUpgrade : onStart} style={({ pressed }) => [styles.speed, pressed && styles.pressed]}>
    <Gradient from={SPEED_TALK.from} to={SPEED_TALK.to} radius={22} glow />
    <View style={styles.speedIcon}><Icon size={24} color="#FFFFFF" fill="#FFFFFF" /></View>
    <View style={styles.flex}>
      <View style={styles.sectionTitleRow}><Text style={styles.speedTitle}>Speed Talk</Text>{!subscriber && <FreeBadge />}</View>
      <Text style={styles.speedText}>{Math.round(speedTalk.seconds / 60)}-minute calls with someone new. Both tap ❤️ to match.</Text>
      <Text style={styles.speedMeta}>{subscriber ? 'Unlimited rounds with MILO Connect' : outOfRounds ? 'Free rounds used up today' : `${left} of ${speedTalk.limit} free rounds left today`}</Text>
    </View>
    <View style={styles.speedCta}>{outOfRounds ? <Crown size={16} color="#FFF" /> : <Text style={styles.speedCtaText}>Start</Text>}</View>
  </Pressable>;
}

function MoodRoomCard({ room, waiting, onPress }) {
  const Icon = room.icon;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Join ${room.title}`} onPress={() => onPress(room)} style={({ pressed }) => [styles.moodCard, { borderColor: `${room.accent}55` }, pressed && styles.pressed]}>
    <Gradient from={room.from} to={room.to} radius={20} />
    <View style={[styles.moodIcon, { backgroundColor: `${room.accent}26` }]}><Icon size={20} color={room.accent} /></View>
    <Text style={styles.moodTitle}>{room.title}</Text>
    <Text style={styles.moodSubtitle}>{room.subtitle}</Text>
    <View style={styles.moodFooter}>{waiting > 0 && <View style={styles.liveDot} />}<Text style={styles.moodLive}>{waiting > 0 ? `${waiting} waiting now` : 'Be the first in'}</Text><View style={styles.flex} /><View style={[styles.moodJoin, { backgroundColor: room.accent }]}><ChevronRight size={14} color="#0B0620" strokeWidth={3} /></View></View>
  </Pressable>;
}

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

function PeopleRow({ people, onOpen }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.admirerRow}>
    {people.map(person => <Pressable key={person._id} accessibilityRole="button" accessibilityLabel={`Open ${nameOf(person)}'s profile`} onPress={() => onOpen(person)} style={styles.admirer}>
      <View style={[styles.admirerAvatar, person.isOnline && styles.admirerOnline]}><ProfileAvatar {...(person.avatarStyle || person)} name={nameOf(person)} photoUrl={person.photoUrl} /></View>
      <Text numberOfLines={1} style={styles.admirerName}>{nameOf(person)}</Text>
    </Pressable>)}
  </ScrollView>;
}

// "Who liked you" (favourites) and "Who viewed you" (last 30 days).
// Free: the counts with blurred placeholders (no identities reach the phone). MILO Connect: who they are.
function Admirers({ admirers, viewers, subscriber, onOpen, onUpgrade }) {
  const [tab, setTab] = useState(admirers.count ? 'likes' : 'views');
  const likes = admirers.count;
  const views = viewers?.count || 0;
  if (!likes && !views) {
    return <View style={styles.card}><View style={styles.cardRow}><View style={styles.heartIcon}><Heart size={20} color="#FF6FA8" /></View><View style={styles.flex}><Text style={styles.cardTitle}>No admirers yet</Text><Text style={styles.cardText}>When people like you or open your profile, you'll see it here. Add interests and a photo to stand out.</Text></View></View></View>;
  }
  const stats = <View style={styles.statRow}>
    <View style={styles.stat}><Text style={styles.statValue}>❤️ {likes}</Text><Text style={styles.statLabel}>liked you</Text></View>
    <View style={styles.stat}><Text style={styles.statValue}>👀 {views}</Text><Text style={styles.statLabel}>viewed you · 30 days</Text></View>
  </View>;

  if (subscriber) {
    const people = tab === 'likes' ? admirers.people : viewers.people;
    return <View style={styles.card}>
      {stats}
      <View style={styles.tabs}>{[['likes', 'Liked you'], ['views', 'Viewed you']].map(([key, label]) => (
        <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={[styles.tabPill, tab === key && styles.tabPillOn]}><Text style={[styles.tabPillText, tab === key && styles.tabPillTextOn]}>{label}</Text></Pressable>
      ))}</View>
      {people.length ? <PeopleRow people={people} onOpen={onOpen} /> : <Text style={styles.cardText}>{tab === 'likes' ? 'No likes yet.' : 'No profile views in the last 30 days.'}</Text>}
    </View>;
  }
  const blurred = Math.min(Math.max(likes, views), 5);
  return <Pressable accessibilityRole="button" onPress={onUpgrade} style={({ pressed }) => [styles.card, styles.admirerLocked, pressed && styles.pressed]}>
    {stats}
    <View style={styles.blurRow}>{Array.from({ length: blurred }).map((_, index) => <View key={index} style={[styles.blurAvatar, index > 0 && styles.blurOverlap]}><UserRound size={22} color="#C4B5FD" /></View>)}<View style={styles.lockBadge}><Lock size={13} color="#FFF" /></View></View>
    <Text style={styles.cardTitle}>{likes ? `${plural(likes, 'person', 'people')} liked you 💜` : `${plural(views, 'person', 'people')} checked out your profile`}</Text>
    <Text style={styles.cardText}>See who they are and call them back with MILO Connect.</Text>
    <View style={styles.seeWho}><Crown size={15} color="#FFF" /><Text style={styles.seeWhoText}>See who</Text></View>
  </Pressable>;
}

function QuestionOfTheDay({ question, onAnswered, onCall }) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const answering = editing || !question.myAnswer;

  const save = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    setError('');
    try { onAnswered(await answerDailyQuestion(draft.trim())); setEditing(false); }
    catch (err) { setError(err.response?.data?.message || 'Could not post your answer. Please try again.'); }
    finally { setSaving(false); }
  };

  const answers = showAll ? question.answers : question.answers.slice(0, ANSWERS_SHOWN);
  return <View style={styles.card}>
    <Text style={styles.questionText}>“{question.text}”</Text>
    {answering ? <>
      <View style={styles.answerBox}>
        <TextInput value={draft} onChangeText={setDraft} maxLength={120} placeholder="Your answer…" placeholderTextColor="#7E768C" style={styles.answerInput} multiline />
        <Pressable accessibilityRole="button" disabled={!draft.trim() || saving} onPress={save} style={[styles.postButton, (!draft.trim() || saving) && styles.disabled]}>{saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.postText}>Post</Text>}</Pressable>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </> : <Pressable accessibilityRole="button" accessibilityLabel="Edit your answer" onPress={() => { setDraft(question.myAnswer); setEditing(true); }} style={styles.myAnswer}>
      <Text style={styles.myAnswerLabel}>Your answer · tap to edit</Text>
      <Text style={styles.myAnswerText}>{question.myAnswer}</Text>
    </Pressable>}
    {question.answers.length > 0 && <Text style={styles.answersLabel}>{question.myAnswer ? 'What others said · tap to call' : 'Answer to see everyone’s replies'}</Text>}
    {!!question.myAnswer && answers.map(item => <Pressable key={item._id} accessibilityRole="button" accessibilityLabel={`Call ${nameOf(item.user)}`} onPress={() => onCall(item.user, 'audio')} style={({ pressed }) => [styles.answerRow, pressed && styles.pressed]}>
      <View style={styles.answerAvatar}><ProfileAvatar {...(item.user.avatarStyle || item.user)} name={nameOf(item.user)} photoUrl={item.user.photoUrl} /></View>
      <View style={styles.flex}><Text style={styles.answerName}>{nameOf(item.user)}{item.user.isOnline ? <Text style={styles.answerOnline}>  ● online</Text> : null}</Text><Text style={styles.answerBody}>{item.answer}</Text></View>
      <Phone size={16} color="#C99BFF" />
    </Pressable>)}
    {!!question.myAnswer && question.answers.length > ANSWERS_SHOWN && <Pressable onPress={() => setShowAll(value => !value)} style={styles.showMore}><Text style={styles.showMoreText}>{showAll ? 'Show less' : `Show all ${question.answers.length} answers`}</Text></Pressable>}
  </View>;
}

function Leaderboard({ rows }) {
  return <View style={styles.card}>{rows.map((person, index) => <View key={person._id} style={styles.leaderRow}>
    <Text style={[styles.rank, index === 0 && styles.rankFirst]}>{index + 1}</Text>
    <View style={styles.answerAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={nameOf(person)} photoUrl={person.photoUrl} /></View>
    <Text numberOfLines={1} style={[styles.answerName, styles.flex]}>{nameOf(person)}{index === 0 ? ' 👑' : ''}</Text>
    <Text style={styles.leaderGifts}>🎁 {person.gifts}</Text>
  </View>)}</View>;
}

export default function MiloSpecialScreen({ navigation }) {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchBusy, setMatchBusy] = useState(false);
  const [miloConnectOpen, setMiloConnectOpen] = useState(false);

  const load = useCallback(async ({ quiet = false } = {}) => {
    try { setData(await getSpecialHome()); }
    catch { if (!quiet) toast('Could not load MILO Special right now.'); }
    finally { setLoading(false); }
  }, [toast]);

  // Fresh data whenever the tab comes into view; room counts keep updating while it's open.
  useFocusEffect(useCallback(() => {
    getMyProfile().then(setProfile).catch(() => { });
    load();
    const timer = setInterval(() => load({ quiet: true }), ROOM_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]));

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const upgrade = () => setMiloConnectOpen(true);
  const startCall = (person, type = 'audio') => navigation.navigate(type === 'video' ? 'VideoRoom' : 'AudioRoom', { person, currentUser: profile, callType: type });
  const openChat = person => navigation.navigate('ChatConversation', { person });
  const openProfile = person => navigation.navigate('UserProfile', { userId: person._id, person });
  const joinRoom = room => navigation.navigate('MatchQueue', { room: room.key });

  const another = async () => {
    setMatchBusy(true);
    try {
      const result = await showAnotherMatch();
      setData(current => ({ ...current, match: result.match }));
      setProfile(current => current && { ...current, coinBalance: result.coinBalance });
    } catch (error) {
      if (error.response?.data?.reason === 'insufficient_coins') toast(`${error.response.data.message} Get coins in the Coin Store.`);
      else toast(error.response?.data?.message || 'Could not find another match.');
    } finally {
      setMatchBusy(false);
    }
  };

  const onTabPress = label => {
    if (label === 'Home') return navigation.navigate('Home');
    if (label === 'Chats') return navigation.navigate('Chats');
    if (label === 'Profile') return navigation.navigate('Profile');
    if (label === 'Connect') return navigation.navigate('Connect');
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#080910" />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#B254FF" colors={['#B254FF']} progressBackgroundColor="#1A1433" />}>
      <View style={styles.topBar}>
        <View style={styles.myAvatar}><ProfileAvatar {...(profile?.avatarStyle || { avatarSeed: profile?.avatarSeed || 'milo-user', gender: profile?.gender || 'female' })} name={nameOf(profile)} photoUrl={profile?.photoUrl} /></View>
        <View style={styles.flex} />
        <Pressable accessibilityLabel="Buy coins" onPress={() => navigation.navigate('CoinStore')} style={styles.wallet}><Coin size={19} /><Text style={styles.walletBalance}>{profile?.coinBalance ?? 0}</Text><View style={styles.walletPlus}><Plus size={14} color="#F2DEFF" /></View></Pressable>
        <Pressable accessibilityLabel="Notifications" onPress={() => toast('Notifications are coming soon')} style={styles.bell}><Bell size={20} color="#E8E2F4" /></Pressable>
      </View>

      <View style={styles.header}>
        <View style={styles.titleRow}><Text style={styles.title}>MILO Special</Text><Sparkles size={22} color="#E879F9" fill="#E879F9" />{data?.subscriber && <View style={styles.connectBadge}><Crown size={11} color="#FFE7A3" /><Text style={styles.connectBadgeText}>CONNECT</Text></View>}</View>
        <Text style={styles.subtitle}>New every day · {data?.onlineNow ?? 0} people online now</Text>
      </View>

      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color="#B254FF" /></View> : !data ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>Couldn’t load MILO Special</Text><Text style={styles.emptyText}>Pull down to try again.</Text></View>
      ) : <>
        <TodaysMatch match={data.match} subscriber={data.subscriber} busy={matchBusy} onCall={startCall} onChat={openChat} onOpen={openProfile} onAnother={another} onUpgrade={upgrade} />

        <View style={styles.speedWrap}><SpeedTalkCard speedTalk={data.speedTalk} subscriber={data.subscriber} onStart={() => joinRoom(SPEED_TALK)} onUpgrade={upgrade} /></View>

        <SectionHeader title="Mood Rooms" subtitle="Pick a vibe. We match you with someone in the same room." badge={<FreeBadge />} />
        <View style={styles.moodGrid}>{MOOD_ROOMS.map(room => <MoodRoomCard key={room.key} room={room} waiting={data.rooms?.[room.key] || 0} onPress={joinRoom} />)}</View>

        <SectionHeader title="Your admirers" subtitle="Who liked you and who viewed your profile" />
        <Admirers admirers={data.admirers} viewers={data.viewers} subscriber={data.subscriber} onOpen={openProfile} onUpgrade={upgrade} />

        <SectionHeader title="Question of the day" subtitle="Answer, then call someone whose answer you like" badge={<FreeBadge />} />
        <QuestionOfTheDay question={data.question} onCall={startCall} onAnswered={myAnswer => setData(current => ({ ...current, question: { ...current.question, myAnswer } }))} />

        {data.leaderboard.length > 0 && <>
          <SectionHeader title="Most loved this week" subtitle="Who received the most gifts in calls" />
          <Leaderboard rows={data.leaderboard} />
        </>}

        {!data.subscriber && <Pressable accessibilityRole="button" onPress={upgrade} style={({ pressed }) => [styles.premium, pressed && styles.pressed]}>
          <Gradient from="#3D255F" to="#8D39E8" radius={20} glow />
          <Image source={require('../../../assets/icons/crown.png')} style={styles.crown} resizeMode="contain" />
          <View style={styles.premiumCopy}><Text style={styles.premiumTitle}>Get more with MILO Connect</Text><Text style={styles.premiumText}>3 matches a day · unlimited Speed Talk · see who favourited you · matched first in rooms</Text></View>
          <View style={styles.premiumCta}><Crown size={14} color="#FFFFFF" /><Text style={styles.premiumCtaText}>Upgrade</Text></View>
        </Pressable>}
      </>}
    </ScrollView>
    <MiloConnectModal visible={miloConnectOpen} onClose={() => setMiloConnectOpen(false)} onGetStarted={() => { setMiloConnectOpen(false); navigation.navigate('MiloConnectPlans'); }} />
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
  disabled: { opacity: 0.5 },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3 },
  myAvatar: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  wallet: { height: 35, borderRadius: 18, borderWidth: 1, borderColor: '#584273', backgroundColor: 'rgba(24, 22, 45, 0.92)', paddingLeft: 8, paddingRight: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  walletBalance: { fontFamily: 'Poppins-SemiBold', color: '#FFE16A', fontSize: 12 },
  walletPlus: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#593491', alignItems: 'center', justifyContent: 'center' },
  bell: { marginLeft: 12, padding: 4 },
  header: { paddingHorizontal: 3, paddingTop: 8, paddingBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: 'Poppins-SemiBold', fontSize: 28, lineHeight: 34, color: '#F7F2FF' },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 12, color: '#AAA5BA', marginTop: 2 },
  connectBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,215,94,0.16)', borderWidth: 1, borderColor: 'rgba(255,215,94,0.4)' },
  connectBadgeText: { fontFamily: 'Poppins-SemiBold', color: '#FFE7A3', fontSize: 9, letterSpacing: 1 },
  loading: { paddingTop: 120, alignItems: 'center' },
  empty: { paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center', borderRadius: 22, backgroundColor: '#14132A' },
  emptyTitle: { fontFamily: 'Poppins-SemiBold', color: '#F3ECFB', fontSize: 15 },
  emptyText: { color: '#AAA4B9', fontSize: 12, marginTop: 6, textAlign: 'center' },

  match: { borderRadius: 26, borderWidth: 1.5, borderColor: '#9F5BFF', padding: 18, overflow: 'hidden' },
  matchBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 24, borderRadius: 12, backgroundColor: 'rgba(10,4,30,0.5)' },
  matchBadgeText: { fontFamily: 'Poppins-SemiBold', color: '#FFE7A3', fontSize: 9, letterSpacing: 1 },
  matchBody: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 16 },
  matchGlow: { position: 'absolute', top: -8, left: -8, width: 104, height: 104, borderRadius: 52, backgroundColor: '#C084FC' },
  matchAvatar: { width: 88, height: 88, borderRadius: 44, overflow: 'hidden', borderWidth: 3, borderColor: '#F0ABFC', backgroundColor: '#25104B' },
  presenceDot: { position: 'absolute', right: 4, bottom: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#21E6A1', borderWidth: 3, borderColor: '#1E0E46' },
  offlineDot: { backgroundColor: '#F5C542' },
  matchCopy: { flex: 1, minWidth: 0 },
  matchName: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 22, lineHeight: 28 },
  matchStatus: { fontFamily: 'Poppins-Medium', color: '#5EF2B5', fontSize: 11, marginTop: 1 },
  matchStatusAway: { color: '#F5C542' },
  matchReason: { fontFamily: 'Poppins-Medium', color: '#F3E8FF', fontSize: 12, lineHeight: 17, marginTop: 8 },
  matchPrompt: { marginTop: 14 },
  matchActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  matchButton: { flex: 1, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  matchPrimary: { backgroundColor: '#A855F7' },
  matchSecondary: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(233,213,255,0.35)' },
  matchButtonText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 13 },
  matchFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 10 },
  anotherButton: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: 'rgba(10,4,30,0.45)' },
  anotherText: { fontFamily: 'Poppins-Medium', color: '#E9D5FF', fontSize: 12 },
  upsellLink: { fontFamily: 'Poppins-Medium', color: '#FFD45E', fontSize: 11, textDecorationLine: 'underline' },

  speedWrap: { marginTop: 14 },
  speed: { minHeight: 104, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,138,216,0.45)' },
  speedIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  speedTitle: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 17 },
  speedText: { fontFamily: 'Poppins-Regular', color: '#FBE7F6', fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  speedMeta: { fontFamily: 'Poppins-Medium', color: '#FFD1F0', fontSize: 11, marginTop: 6 },
  speedCta: { minWidth: 58, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#FF5FC5', alignItems: 'center', justifyContent: 'center' },
  speedCtaText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 13 },

  sectionHeader: { paddingHorizontal: 3, marginTop: 26, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', color: '#F7F2FF', fontSize: 18 },
  sectionSubtitle: { fontFamily: 'Poppins-Regular', color: '#A9A3BB', fontSize: 11, marginTop: 1 },
  freeBadge: { paddingHorizontal: 7, height: 18, borderRadius: 9, backgroundColor: 'rgba(33,230,161,0.16)', borderWidth: 1, borderColor: 'rgba(33,230,161,0.5)', justifyContent: 'center' },
  freeBadgeText: { fontFamily: 'Poppins-SemiBold', color: '#5EF2B5', fontSize: 9, letterSpacing: 0.8 },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  moodCard: { width: '48.4%', minHeight: 150, borderRadius: 20, borderWidth: 1, padding: 14, overflow: 'hidden' },
  moodIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  moodTitle: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14, marginTop: 12 },
  moodSubtitle: { fontFamily: 'Poppins-Regular', color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 },
  moodFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto', paddingTop: 12 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#21E6A1' },
  moodLive: { fontFamily: 'Poppins-Medium', color: '#E7E0F5', fontSize: 10 },
  moodJoin: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  card: { borderRadius: 20, padding: 16, backgroundColor: '#14132A', borderWidth: 1, borderColor: '#2A2545' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontFamily: 'Poppins-SemiBold', color: '#F7F2FF', fontSize: 15 },
  cardText: { fontFamily: 'Poppins-Regular', color: '#AAA4B9', fontSize: 12, lineHeight: 17, marginTop: 3 },
  heartIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,111,168,0.14)', alignItems: 'center', justifyContent: 'center' },
  admirerRow: { gap: 14, paddingTop: 12 },
  admirer: { width: 64, alignItems: 'center' },
  admirerAvatar: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: '#3A304F' },
  admirerOnline: { borderColor: '#21E6A1' },
  admirerName: { fontFamily: 'Poppins-Medium', color: '#F2EAFE', fontSize: 11, marginTop: 5, maxWidth: 64 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(139,64,238,0.14)' },
  statValue: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 18 },
  statLabel: { fontFamily: 'Poppins-Regular', color: '#C9BFE0', fontSize: 11 },
  tabs: { flexDirection: 'row', gap: 8 },
  tabPill: { paddingHorizontal: 14, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#38323F', justifyContent: 'center' },
  tabPillOn: { backgroundColor: '#3A1C6B', borderColor: '#9957FF' },
  tabPillText: { fontFamily: 'Poppins-Medium', color: '#C8C3D0', fontSize: 12 },
  tabPillTextOn: { color: '#FFFFFF' },
  admirerLocked: { borderColor: 'rgba(255,111,168,0.45)' },
  blurRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  blurAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#3B2A5E', borderWidth: 2, borderColor: '#14132A', alignItems: 'center', justifyContent: 'center', opacity: 0.85 },
  blurOverlap: { marginLeft: -14 },
  lockBadge: { marginLeft: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: '#8B40EE', alignItems: 'center', justifyContent: 'center' },
  seeWho: { alignSelf: 'flex-start', marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#8B40EE' },
  seeWhoText: { fontFamily: 'Poppins-SemiBold', color: '#FFF', fontSize: 13 },

  questionText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 17, lineHeight: 24 },
  answerBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: '#3D2C5C', backgroundColor: '#100D1F', padding: 8 },
  answerInput: { flex: 1, color: '#FFFFFF', fontFamily: 'Poppins-Regular', fontSize: 14, minHeight: 38, maxHeight: 90, paddingVertical: 6, paddingHorizontal: 6, textAlignVertical: 'top' },
  postButton: { height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#8B40EE', alignItems: 'center', justifyContent: 'center' },
  postText: { fontFamily: 'Poppins-SemiBold', color: '#FFF', fontSize: 13 },
  errorText: { color: '#FF9AAF', fontSize: 12, marginTop: 6 },
  myAnswer: { marginTop: 12, borderRadius: 14, padding: 12, backgroundColor: 'rgba(139,64,238,0.16)', borderWidth: 1, borderColor: 'rgba(196,140,255,0.3)' },
  myAnswerLabel: { fontFamily: 'Poppins-Medium', color: '#C99BFF', fontSize: 11 },
  myAnswerText: { fontFamily: 'Poppins-Medium', color: '#FFF', fontSize: 14, marginTop: 3 },
  answersLabel: { fontFamily: 'Poppins-Medium', color: '#A9A3BB', fontSize: 11, marginTop: 16, marginBottom: 4 },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#221E36' },
  answerAvatar: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden', backgroundColor: '#25104B' },
  answerName: { fontFamily: 'Poppins-SemiBold', color: '#F2EAFE', fontSize: 13 },
  answerOnline: { fontFamily: 'Poppins-Regular', color: '#21E6A1', fontSize: 10 },
  answerBody: { fontFamily: 'Poppins-Regular', color: '#D8D0E6', fontSize: 13, lineHeight: 18, marginTop: 1 },
  showMore: { paddingTop: 12, alignItems: 'center' },
  showMoreText: { fontFamily: 'Poppins-Medium', color: '#C99BFF', fontSize: 12 },

  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rank: { width: 20, textAlign: 'center', fontFamily: 'Poppins-SemiBold', color: '#A9A3BB', fontSize: 14 },
  rankFirst: { color: '#FFD45E' },
  leaderGifts: { fontFamily: 'Poppins-SemiBold', color: '#FFE16A', fontSize: 13 },

  premium: { marginTop: 26, minHeight: 84, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  crown: { width: 46, height: 46 },
  premiumCopy: { flex: 1 },
  premiumTitle: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15 },
  premiumText: { fontFamily: 'Poppins-Regular', color: '#E9D5FF', fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  premiumCta: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(10,4,30,0.45)' },
  premiumCtaText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 11 },
  bottomBar: { position: 'absolute', left: 10, right: 10, bottom: 7, height: 68, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(129, 108, 168, 0.58)', backgroundColor: 'rgba(17, 19, 30, 0.94)', shadowColor: '#000000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10, flexDirection: 'row', paddingTop: 9 },
  tab: { flex: 1, alignItems: 'center', gap: 4, minWidth: 0 },
  activeTabGlow: { shadowColor: '#C05DFF', shadowOpacity: 0.9, shadowRadius: 10 },
  tabMessageIcon: { width: 23, height: 23, tintColor: '#C5BED3' },
  tabText: { color: '#C5BED3', fontSize: 8, textAlign: 'center' },
  activeTabText: { color: '#CE88FF', fontFamily: 'Poppins-Medium' },
});
