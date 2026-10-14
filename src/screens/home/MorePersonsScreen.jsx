import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, MessageCircle, Phone, Users, Video } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { Gradient } from '../../components/home/HomeDecor';

const FALLBACK_PEOPLE = [
  { _id: 'more-aanya', nickname: 'Aanya', age: 22, isOnline: true, languages: ['Hindi', 'English'], avatarStyle: { avatarSeed: 'more-aanya', background: '#A8D0F5', gender: 'female', shirt: '#E56D9A' } },
  { _id: 'more-riya', nickname: 'Riya', age: 24, isOnline: true, languages: ['Marathi', 'Hindi'], avatarStyle: { avatarSeed: 'more-riya', background: '#BFA9FF', gender: 'female', shirt: '#A58CF4', bun: true } },
  { _id: 'more-kiara', nickname: 'Kiara', age: 23, isOnline: true, languages: ['English', 'Tamil'], avatarStyle: { avatarSeed: 'more-kiara', background: '#FFE3A3', gender: 'female', shirt: '#292338' } },
  { _id: 'more-kabir', nickname: 'Kabir', age: 25, isOnline: true, languages: ['Hindi', 'Gujarati'], avatarStyle: { avatarSeed: 'more-kabir', background: '#A6D4FF', gender: 'male', shirt: '#4385B7', glasses: true } },
  { _id: 'more-meera', nickname: 'Meera', age: 21, isOnline: true, languages: ['English', 'Bengali'], avatarStyle: { avatarSeed: 'more-meera', background: '#FFB2D3', gender: 'female', shirt: '#D96A9D' } },
  { _id: 'more-rohan', nickname: 'Rohan', age: 26, isOnline: true, languages: ['Telugu', 'English'], avatarStyle: { avatarSeed: 'more-rohan', background: '#87C6FF', gender: 'male', shirt: '#568BC4', glasses: true } },
];

const LANGUAGE_LABELS = {
  Hindi: 'हिंदी',
  Marathi: 'मराठी',
  Bengali: 'বাংলা',
  Tamil: 'தமிழ்',
  Telugu: 'తెలుగు',
  Gujarati: 'ગુજરાતી',
  Kannada: 'ಕನ್ನಡ',
  English: 'English',
};
const RING_COLORS = ['#C084FC', '#F472B6', '#5EE7FF', '#FFC861', '#34D399', '#A78BFA'];
const BUBBLE_AVATAR = 84;
const BUBBLE_WIDTH = 112;
const BUBBLE_HEIGHT = 132;
const DRIFT_SPEED = 46; // px per second, shared by every bubble so they never overtake each other.
const SPAWN_TICK_MS = 650;
const MAX_BUBBLES = 12;

const nameOf = person => person?.nickname || person?.name || 'MILO member';
const personKey = person => person?._id || person?.firebaseUid || nameOf(person);
const hashOf = value => [...String(value)].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 9973, 7);
const languageLabel = language => LANGUAGE_LABELS[language] || language;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function FloatingPerson({ bubble, width, onPress, onDone }) {
  const progress = useRef(new Animated.Value(0)).current;
  const { person, top, mode } = bubble;
  const ring = RING_COLORS[hashOf(personKey(person)) % RING_COLORS.length];
  useEffect(() => {
    const travel = width + BUBBLE_WIDTH * 1.3;
    const animation = Animated.timing(progress, { toValue: 1, duration: (travel / DRIFT_SPEED) * 1000, easing: Easing.linear, useNativeDriver: true });
    animation.start(() => onDone(bubble.id));
    return () => animation.stop();
  }, [bubble.id, onDone, progress, width]);
  const bob = bubble.phase;
  return <Animated.View style={[styles.bubble, {
    top,
    left: width + BUBBLE_WIDTH * 0.1,
    transform: [
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -(width + BUBBLE_WIDTH * 1.3)] }) },
      { translateY: progress.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -7 * bob, 0, 7 * bob, 0, -7 * bob] }) },
    ],
  }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Connect with ${nameOf(person)}`} onPress={() => onPress(person)} style={({ pressed }) => [styles.bubbleInner, pressed && styles.pressed]}>
      <View style={[styles.bubbleRing, { borderColor: ring, shadowColor: ring }]}>
        <View style={styles.bubbleAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={nameOf(person)} photoUrl={person.photoUrl} /></View>
      </View>
      <View style={[styles.modeBadge, mode === 'video' ? styles.modeVideo : styles.modeAudio]}>
        {mode === 'video' ? <Video size={12} color="#FFFFFF" fill="#FFFFFF" /> : <Phone size={11} color="#FFFFFF" fill="#FFFFFF" />}
      </View>
      <View style={styles.languageChip}><Text numberOfLines={1} style={styles.languageChipText}>{languageLabel(person.languages?.[0] || 'English')}</Text></View>
      <Text numberOfLines={1} style={styles.bubbleName}>{nameOf(person)}</Text>
    </Pressable>
  </Animated.View>;
}

function PersonSheet({ person, onClose, onAction }) {
  if (!person) return null;
  const languages = (person.languages || ['English']).slice(0, 3);
  return <Modal transparent animationType="slide" visible statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.sheetOverlay}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetAvatarRing}><View style={styles.sheetAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={nameOf(person)} photoUrl={person.photoUrl} /></View><View style={styles.sheetOnline} /></View>
        <Text style={styles.sheetName}>{nameOf(person)}{person.age ? `, ${person.age}` : ''}</Text>
        <Text style={styles.sheetStatus}>● Online now</Text>
        <View style={styles.sheetTags}>{languages.map(language => <View key={language} style={styles.sheetTag}><Text style={styles.sheetTagText}>{languageLabel(language)}</Text></View>)}</View>
        {!!person.bio && <Text numberOfLines={2} style={styles.sheetBio}>{person.bio}</Text>}
        <View style={styles.sheetActions}>
          <ActionButton type="audio" onPress={() => onAction(person, 'audio')} />
          <ActionButton type="video" onPress={() => onAction(person, 'video')} />
          <ActionButton type="chat" onPress={() => onAction(person, 'chat')} />
        </View>
      </View>
    </View>
  </Modal>;
}

const ACTIONS = {
  audio: { label: 'Audio', price: '15 /min', icon: Phone, style: 'actionAudio', color: '#5EE7FF' },
  video: { label: 'Video', price: '60 /min', icon: Video, style: 'actionVideo', color: '#D8B4FE' },
  chat: { label: 'Chat', price: '10 /4 msg', icon: MessageCircle, style: 'actionChat', color: '#FF8AD8' },
};

function ActionButton({ type, onPress, disabled }) {
  const { label, price, icon: Icon, style, color } = ACTIONS[type];
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${price}`} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, styles[style], pressed && styles.pressed, disabled && styles.disabled]}>
    <View style={styles.actionLabelRow}><Icon size={16} color={color} fill={type === 'chat' ? 'none' : color} /><Text style={[styles.actionLabel, { color }]}>{label}</Text></View>
    <View style={styles.actionPriceRow}><Image source={require('../../../assets/icons/coin.png')} style={styles.actionCoin} /><Text style={styles.actionPrice}>{price}</Text></View>
  </Pressable>;
}

export default function MorePersonsScreen({ navigation, route }) {
  const availablePeople = useMemo(() => {
    const supplied = Array.isArray(route.params?.people) ? route.params.people : [];
    const source = supplied.length ? supplied : FALLBACK_PEOPLE;
    return shuffle(source.filter(person => person?.isOnline === true));
  }, [route.params?.people]);
  const languages = useMemo(() => {
    const counts = new Map();
    availablePeople.forEach(person => (person.languages || []).forEach(language => counts.set(language, (counts.get(language) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([language]) => language);
  }, [availablePeople]);
  const [language, setLanguage] = useState('All');
  const pool = useMemo(() => language === 'All' ? availablePeople : availablePeople.filter(person => person.languages?.includes(language)), [availablePeople, language]);
  const [canvas, setCanvas] = useState(null);
  const [bubbles, setBubbles] = useState([]);
  const [selected, setSelected] = useState(null);
  const laneLastSpawn = useRef([]);
  const nextIndex = useRef(0);
  const bubbleId = useRef(0);
  const bubblesRef = useRef(bubbles);
  bubblesRef.current = bubbles;

  const laneCount = canvas ? Math.max(1, Math.floor((canvas.height - 16) / BUBBLE_HEIGHT)) : 0;

  // Spawns bubbles at the right edge in free lanes. All bubbles share one speed, so a lane
  // only needs a minimum time gap between spawns to keep bubbles from overlapping.
  useEffect(() => {
    setBubbles([]);
    if (!canvas || !laneCount || !pool.length) return undefined;
    const laneGap = ((BUBBLE_WIDTH * 1.9) / DRIFT_SPEED) * 1000;
    // Lanes open one after another so the first bubbles arrive staggered rather than all at once.
    laneLastSpawn.current = shuffle(Array.from({ length: laneCount }, (_, lane) => lane)).map(order => Date.now() - laneGap + order * 700);
    nextIndex.current = 0;
    const laneHeight = (canvas.height - 16) / laneCount;
    const spawn = () => {
      if (bubblesRef.current.length >= MAX_BUBBLES) return;
      const now = Date.now();
      const freeLanes = laneLastSpawn.current.map((last, lane) => ({ lane, last })).filter(({ last }) => now - last >= laneGap);
      if (!freeLanes.length) return;
      const { lane } = freeLanes[Math.floor(Math.random() * freeLanes.length)];
      const onScreen = new Set(bubblesRef.current.map(bubble => personKey(bubble.person)));
      let person = pool[nextIndex.current % pool.length];
      for (let tries = 0; tries < pool.length && onScreen.has(personKey(person)); tries += 1) {
        nextIndex.current += 1;
        person = pool[nextIndex.current % pool.length];
      }
      nextIndex.current += 1;
      laneLastSpawn.current[lane] = now + Math.random() * 1200;
      bubbleId.current += 1;
      const jitter = (Math.random() - 0.5) * Math.max(0, laneHeight - BUBBLE_HEIGHT);
      setBubbles(current => [...current, {
        id: bubbleId.current,
        person,
        top: 8 + lane * laneHeight + (laneHeight - BUBBLE_HEIGHT) / 2 + jitter,
        mode: hashOf(personKey(person) + lane) % 2 === 0 ? 'video' : 'audio',
        phase: Math.random() > 0.5 ? 1 : -1,
      }]);
    };
    spawn();
    const timer = setInterval(spawn, SPAWN_TICK_MS);
    return () => clearInterval(timer);
  }, [canvas, laneCount, pool]);

  const removeBubble = useCallback(id => setBubbles(current => current.filter(bubble => bubble.id !== id)), []);
  const connect = (person, type) => {
    setSelected(null);
    if (type === 'chat') return navigation.navigate('ChatConversation', { person });
    navigation.navigate(type === 'video' ? 'VideoRoom' : 'AudioRoom', { person, availablePeople, callType: type, isDemo: String(person._id || '').startsWith('demo-') });
  };
  const connectRandom = type => {
    const target = pool.length ? pool : availablePeople;
    if (!target.length) return;
    connect(target[Math.floor(Math.random() * target.length)], type);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0420" />
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => navigation.goBack()} style={styles.backButton}><ArrowLeft size={20} color="#F4EDFF" /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.headerTitle}>MILO Rooms</Text><Text style={styles.headerSubtitle}>Tap someone to start talking</Text></View>
          <View style={styles.onlinePill}><View style={styles.onlinePillDot} /><Text style={styles.onlinePillText}>{availablePeople.length} online</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsScroll}>
          {['All', ...languages].map(item => {
            const active = item === language;
            return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setLanguage(item)} style={[styles.chip, active && styles.chipActive]}>
              {active && <Gradient from="#A447FA" to="#5916E6" radius={16} />}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item === 'All' ? 'All' : languageLabel(item)}</Text>
            </Pressable>;
          })}
        </ScrollView>

        <View style={styles.canvas} onLayout={({ nativeEvent }) => {
          const { width, height } = nativeEvent.layout;
          setCanvas(current => current && current.width === width && current.height === height ? current : { width, height });
        }}>
          {canvas && bubbles.map(bubble => <FloatingPerson key={bubble.id} bubble={bubble} width={canvas.width} onPress={setSelected} onDone={removeBubble} />)}
          {!pool.length && <View style={styles.empty}>
            <View style={styles.emptyIcon}><Users size={30} color="#B776FF" /></View>
            <Text style={styles.emptyTitle}>{availablePeople.length ? 'No one online for this language' : 'No one is online right now'}</Text>
            <Text style={styles.emptyText}>{availablePeople.length ? 'Try another language filter.' : 'New people join MILO every day. Check back soon.'}</Text>
          </View>}
        </View>

        <View style={styles.bottomBar}>
          <ActionButton type="audio" disabled={!pool.length} onPress={() => connectRandom('audio')} />
          <ActionButton type="video" disabled={!pool.length} onPress={() => connectRandom('video')} />
          <ActionButton type="chat" disabled={!pool.length} onPress={() => connectRandom('chat')} />
        </View>
      </SafeAreaView>
      <PersonSheet person={selected} onClose={() => setSelected(null)} onAction={connect} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0420' },
  backgroundGlowTop: { position: 'absolute', top: 80, right: -120, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(168,85,247,0.16)' },
  backgroundGlowBottom: { position: 'absolute', bottom: 60, left: -140, width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(236,72,153,0.12)' },
  safeArea: { flex: 1 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.4 },
  header: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(145,83,224,0.24)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.18)' },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { fontFamily: 'Poppins-SemiBold', color: '#F9F4FF', fontSize: 20, lineHeight: 26 },
  headerSubtitle: { fontFamily: 'Poppins-Regular', color: '#A99EC2', fontSize: 11 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 11, borderRadius: 14, backgroundColor: 'rgba(33,230,161,0.12)', borderWidth: 1, borderColor: 'rgba(33,230,161,0.3)' },
  onlinePillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#21E6A1' },
  onlinePillText: { fontFamily: 'Poppins-Medium', color: '#B9F8DF', fontSize: 11 },
  chipsScroll: { flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 18, paddingVertical: 8 },
  chip: { height: 34, paddingHorizontal: 16, borderRadius: 17, overflow: 'hidden', justifyContent: 'center', backgroundColor: '#1A1433', borderWidth: 1, borderColor: 'rgba(173,113,255,0.25)' },
  chipActive: { borderColor: 'transparent' },
  chipText: { fontFamily: 'Poppins-Medium', color: '#D4C6EE', fontSize: 12 },
  chipTextActive: { color: '#FFFFFF' },
  canvas: { flex: 1, overflow: 'hidden' },
  bubble: { position: 'absolute', width: BUBBLE_WIDTH, height: BUBBLE_HEIGHT },
  bubbleInner: { alignItems: 'center' },
  bubbleRing: { width: BUBBLE_AVATAR + 8, height: BUBBLE_AVATAR + 8, borderRadius: (BUBBLE_AVATAR + 8) / 2, borderWidth: 3, padding: 2, backgroundColor: '#1B0E3A', shadowOpacity: 0.8, shadowRadius: 12, elevation: 8 },
  bubbleAvatar: { flex: 1, borderRadius: BUBBLE_AVATAR / 2, overflow: 'hidden' },
  modeBadge: { position: 'absolute', top: 2, left: 12, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0B0420' },
  modeVideo: { backgroundColor: '#13B867' },
  modeAudio: { backgroundColor: '#7C35D1' },
  languageChip: { marginTop: -12, maxWidth: 90, paddingHorizontal: 9, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  languageChipText: { fontFamily: 'Poppins-Medium', color: '#2A1257', fontSize: 10 },
  bubbleName: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 13, marginTop: 5, maxWidth: BUBBLE_WIDTH, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#1A1733', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: 'Poppins-SemiBold', color: '#F3ECFB', fontSize: 16, textAlign: 'center' },
  emptyText: { fontFamily: 'Poppins-Regular', color: '#AAA4B9', fontSize: 12, marginTop: 6, textAlign: 'center' },
  bottomBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 },
  actionButton: { flex: 1, height: 58, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 3 },
  actionAudio: { backgroundColor: 'rgba(14,93,115,0.35)', borderColor: '#5EE7FF' },
  actionVideo: { backgroundColor: 'rgba(124,53,209,0.35)', borderColor: '#C084FC' },
  actionChat: { backgroundColor: 'rgba(190,24,93,0.3)', borderColor: '#FF8AD8' },
  actionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 14 },
  actionPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionCoin: { width: 12, height: 12 },
  actionPrice: { fontFamily: 'Poppins-Regular', color: '#E4DAF5', fontSize: 10 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3,2,12,0.7)' },
  sheet: { backgroundColor: '#0D1117', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1.5, borderBottomWidth: 0, borderColor: '#7E47FF', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30, alignItems: 'center' },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#7E47FF', marginBottom: 18 },
  sheetAvatarRing: { width: 104, height: 104, borderRadius: 52, padding: 3, backgroundColor: '#A855F7' },
  sheetAvatar: { flex: 1, borderRadius: 49, overflow: 'hidden' },
  sheetOnline: { position: 'absolute', right: 6, bottom: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#21E6A1', borderWidth: 3, borderColor: '#0D1117' },
  sheetName: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 22, marginTop: 12 },
  sheetStatus: { fontFamily: 'Poppins-Medium', color: '#5EF2B5', fontSize: 12 },
  sheetTags: { flexDirection: 'row', gap: 6, marginTop: 10 },
  sheetTag: { paddingHorizontal: 11, height: 26, borderRadius: 13, backgroundColor: '#1E1A3A', justifyContent: 'center' },
  sheetTagText: { fontFamily: 'Poppins-Medium', color: '#E3D5FF', fontSize: 11 },
  sheetBio: { fontFamily: 'Poppins-Regular', color: '#B8AED0', fontSize: 12, marginTop: 10, textAlign: 'center' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 22, alignSelf: 'stretch' },
});
