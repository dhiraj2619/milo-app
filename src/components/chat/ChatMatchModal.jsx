import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { MessageCircle, RefreshCw, X } from 'lucide-react-native';
import ProfileAvatar from '../home/ProfileAvatar';
import { getDiscoverProfiles } from '../../services/userService';

const AVATAR_SIZE = 116;
const MIN_SEARCH_MS = 3800;
const MATCH_REVEAL_MS = 1100;
const PLACEHOLDERS = [
  { name: 'Pooja', avatarStyle: { avatarSeed: 'milo-call-pooja', background: '#D1B4FF', gender: 'female', hair: '#392323', shirt: '#E56D9A' } },
  { name: 'Sia', avatarStyle: { avatarSeed: 'milo-call-sia', background: '#BFA9FF', gender: 'female', hair: '#63362D', shirt: '#A58CF4', bun: true } },
  { name: 'Riya', avatarStyle: { avatarSeed: 'milo-call-riya', background: '#E7B5FF', gender: 'female', hair: '#2E2120', shirt: '#C768E3' } },
  { name: 'Kabir', avatarStyle: { avatarSeed: 'milo-call-kabir', background: '#A6D4FF', gender: 'male', hair: '#352720', shirt: '#4385B7' } },
];
const nameOf = person => person?.nickname || person?.name || 'MILO member';

// Finds a random online member who suits the viewer's preference, preferring people
// the viewer has not chatted with yet.
function pickMatch(users, self, excludeIds) {
  const preferred = self?.gender?.toLowerCase();
  const online = users.filter(person => person.isOnline === true && person._id !== self?._id && person.firebaseUid !== self?.firebaseUid).filter(person => {
    const gender = person.gender?.toLowerCase();
    if (preferred === 'male') return gender === 'female';
    if (preferred === 'female') return gender === 'male';
    return true;
  });
  const fresh = online.filter(person => !excludeIds.has(person._id));
  const pool = fresh.length ? fresh : online;
  return { match: pool[Math.floor(Math.random() * pool.length)] || null, pool };
}

export default function ChatMatchModal({ visible, self, excludeIds, onClose, onMatch }) {
  const [status, setStatus] = useState('searching');
  const [preview, setPreview] = useState(PLACEHOLDERS[0]);
  const [match, setMatch] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const onMatchRef = useRef(onMatch);
  onMatchRef.current = onMatch;
  const excludeRef = useRef(excludeIds);
  excludeRef.current = excludeIds;
  const selfRef = useRef(self);
  selfRef.current = self;

  useEffect(() => {
    if (!visible) return undefined;
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse, visible]);

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    let rotateTimer;
    let revealTimer;
    setStatus('searching');
    setMatch(null);
    reveal.setValue(0);
    progress.setValue(0);
    Animated.timing(progress, { toValue: 0.92, duration: MIN_SEARCH_MS + 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    let pool = PLACEHOLDERS;
    let index = 0;
    rotateTimer = setInterval(() => {
      index = (index + 1) % pool.length;
      setPreview(pool[index]);
    }, 520);
    const searchStarted = Date.now();
    getDiscoverProfiles({ page: 1, limit: 40 })
      .then(data => pickMatch(data.users || [], selfRef.current, excludeRef.current || new Set()))
      .catch(() => ({ match: null, pool: [] }))
      .then(result => {
        if (!active) return;
        if (result.pool.length > 1) pool = result.pool;
        const wait = Math.max(0, MIN_SEARCH_MS + Math.random() * 1500 - (Date.now() - searchStarted));
        revealTimer = setTimeout(() => {
          if (!active) return;
          clearInterval(rotateTimer);
          if (!result.match) { setStatus('empty'); return; }
          setMatch(result.match);
          setStatus('matched');
          Animated.timing(progress, { toValue: 1, duration: 250, useNativeDriver: true }).start();
          Animated.spring(reveal, { toValue: 1, damping: 14, stiffness: 150, useNativeDriver: true }).start();
          revealTimer = setTimeout(() => active && onMatchRef.current?.(result.match), MATCH_REVEAL_MS);
        }, wait);
      });
    return () => { active = false; clearInterval(rotateTimer); clearTimeout(revealTimer); progress.stopAnimation(); };
  }, [attempt, progress, reveal, visible]);

  const shown = match || preview;
  const searching = status === 'searching';
  const ripple = phase => {
    const value = phase ? Animated.modulo(Animated.add(pulse, phase), 1) : pulse;
    return { opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }), transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }] };
  };

  return <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <StatusBar barStyle="light-content" backgroundColor="#05001c" />
    <View style={styles.screen}>
      <View style={styles.glow} />
      <Pressable accessibilityRole="button" accessibilityLabel="Cancel search" hitSlop={8} onPress={onClose} style={styles.close}><X size={20} color="#EDE9FE" /></Pressable>
      <View style={styles.center}>
        <Text style={styles.kicker}>CONNECT BEST</Text>
        <View style={styles.stage}>
          {searching && <Animated.View style={[styles.ripple, ripple(0)]} />}
          {searching && <Animated.View style={[styles.ripple, ripple(0.33)]} />}
          {searching && <Animated.View style={[styles.ripple, ripple(0.66)]} />}
          <Animated.View style={[styles.avatar, status === 'matched' && styles.avatarMatched, status === 'matched' && { transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
            {status === 'empty' ? <View style={styles.emptyAvatar}><MessageCircle size={42} color="#A78BFA" /></View> : <ProfileAvatar {...(shown?.avatarStyle || shown)} name={nameOf(shown)} photoUrl={status === 'matched' ? shown?.photoUrl : undefined} />}
          </Animated.View>
          {status === 'matched' && <View style={styles.onlineDot} />}
        </View>
        {status === 'matched' ? <>
          <Animated.Text style={[styles.title, { opacity: reveal }]}>Say hi to {nameOf(match)}!</Animated.Text>
          <Text style={styles.subtitle}>{match.languages?.[0] ? `Speaks ${match.languages.slice(0, 2).join(' & ')} · ` : ''}Opening chat...</Text>
        </> : status === 'empty' ? <>
          <Text style={styles.title}>No one is free right now</Text>
          <Text style={styles.subtitle}>Everyone's busy at the moment. Try again in a little while.</Text>
        </> : <>
          <Text style={styles.title}>Finding someone to chat...</Text>
          <Text style={styles.subtitle}>Looking for online members who match you</Text>
        </>}
      </View>
      <View style={styles.footer}>
        {status === 'empty' ? <Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><RefreshCw size={18} color="#FFFFFF" /><Text style={styles.retryText}>Try again</Text></Pressable> : <View style={styles.searchCard}>
          <View style={styles.searchRow}>{searching ? <ActivityIndicator size="small" color="#E879F9" /> : <MessageCircle size={16} color="#21E6A1" />}<Text style={styles.searchText}>{searching ? 'Connecting with available MILO members...' : 'Match found'}</Text></View>
          <View style={styles.track}><Animated.View style={[styles.fill, { transform: [{ scaleX: progress }] }]} /></View>
        </View>}
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05001c', paddingHorizontal: 22, paddingTop: 56, paddingBottom: 34 },
  glow: { position: 'absolute', top: '22%', alignSelf: 'center', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(124,58,237,0.18)' },
  close: { alignSelf: 'flex-start', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(156,130,210,0.22)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.18)', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontFamily: 'Poppins-SemiBold', color: '#E879F9', fontSize: 11, letterSpacing: 2, marginBottom: 36 },
  stage: { width: AVATAR_SIZE, height: AVATAR_SIZE, alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 1.5, borderColor: '#A855F7' },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: '#A855F7', backgroundColor: '#25104B', overflow: 'hidden', shadowColor: '#BB43FF', shadowOpacity: 0.8, shadowRadius: 22, elevation: 14 },
  avatarMatched: { borderColor: '#21E6A1' },
  emptyAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', right: 6, bottom: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#21E6A1', borderWidth: 3, borderColor: '#05001c' },
  title: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 22, marginTop: 34, textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins-Regular', color: '#C4B5FD', fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 290 },
  footer: { alignItems: 'center', gap: 14 },
  searchCard: { width: '100%', maxWidth: 340, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 18, backgroundColor: 'rgba(18,4,54,0.72)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.32)' },
  searchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  searchText: { fontFamily: 'Poppins-Medium', color: '#EDE9FE', fontSize: 12 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 14, backgroundColor: 'rgba(196,181,253,0.18)' },
  fill: { width: '100%', height: '100%', borderRadius: 3, backgroundColor: '#B83CFF', transformOrigin: 'left' },
  retry: { height: 50, paddingHorizontal: 28, borderRadius: 25, backgroundColor: '#8737F4', flexDirection: 'row', alignItems: 'center', gap: 8 },
  retryText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14 },
  cancel: { paddingVertical: 8, paddingHorizontal: 20 },
  cancelText: { fontFamily: 'Poppins-Medium', color: '#A9A3BB', fontSize: 13 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
