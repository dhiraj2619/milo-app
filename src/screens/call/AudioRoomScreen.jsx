import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mic, MoreHorizontal, PhoneOff, Volume2 } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import {getMyProfile} from '../../services/userService';
const AVATAR_SIZE = 92;
const SEARCH_DURATION = 18000;
const TEMPORARY_PEOPLE = [
  { name: 'Pooja', avatarStyle: { avatarSeed: 'milo-call-pooja', background: '#D1B4FF', gender: 'female', hair: '#392323', shirt: '#E56D9A' } },
  { name: 'Sia', avatarStyle: { avatarSeed: 'milo-call-sia', background: '#BFA9FF', gender: 'female', hair: '#63362D', shirt: '#A58CF4', bun: true } },
  { name: 'Riya', avatarStyle: { avatarSeed: 'milo-call-riya', background: '#E7B5FF', gender: 'female', hair: '#2E2120', shirt: '#C768E3' } },
];

export default function AudioRoomScreen({ navigation, route }) {
  const initialPerson = route.params?.person || {};
  const availablePeople = route.params?.availablePeople;
  const candidates = useMemo(
    () => (Array.isArray(availablePeople) ? availablePeople : []).filter(person => person?._id !== initialPerson?._id),
    [availablePeople, initialPerson?._id],
  );
  const initiallyConnected = route.params?.callStatus === 'connected' && route.params?.connectedPerson;
  const [callStatus, setCallStatus] = useState(initiallyConnected ? 'connected' : 'searching');
  const [connectedPerson, setConnectedPerson] = useState(route.params?.connectedPerson || null);
  const [waitingPerson, setWaitingPerson] = useState(initialPerson);
  const [temporaryIndex, setTemporaryIndex] = useState(() => Math.floor(Math.random() * TEMPORARY_PEOPLE.length));
  const [self, setSelf] = useState(route.params?.currentUser || null);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  useEffect(() => {
    let active = true;
    if (route.params?.currentUser) return undefined;
    getMyProfile().then(profile => {
      if (active) setSelf(profile);
    }).catch(() => {});
    return () => { active = false; };
  }, [route.params?.currentUser]);
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const equalizer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const equalizerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(equalizer, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(equalizer, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();
    equalizerLoop.start();
    return () => {
      pulseLoop.stop();
      equalizerLoop.stop();
    };
  }, [equalizer, pulse]);

  useEffect(() => {
    if (initiallyConnected) return undefined;
    progress.setValue(0);
    const progressAnimation = Animated.timing(progress, {
      toValue: 0.9,
      duration: SEARCH_DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    progressAnimation.start();
    // First show the selected person. Only after they are unavailable do we
    // rotate temporary profiles while searching for a real participant.
    const busyTimer = setTimeout(() => setCallStatus('busy'), 1800);
    let rotateTimer;
    const placeholderTimer = setTimeout(() => {
      setCallStatus('searching');
      setWaitingPerson(null);
      setTemporaryIndex(index => (index + 1) % TEMPORARY_PEOPLE.length);
      rotateTimer = setInterval(() => {
        setTemporaryIndex(index => (index + 1) % TEMPORARY_PEOPLE.length);
      }, 1800);
    }, 3300);
    const joinTimer = setTimeout(() => {
      const nextPerson = candidates[Math.floor(Math.random() * candidates.length)];
      if (!nextPerson) return;
      setConnectedPerson(nextPerson);
      setCallStatus('connected');
    }, SEARCH_DURATION);
    return () => {
      progressAnimation.stop();
      clearTimeout(busyTimer);
      clearTimeout(placeholderTimer);
      if (rotateTimer) clearInterval(rotateTimer);
      clearTimeout(joinTimer);
    };
  }, [candidates, initiallyConnected, progress]);

  const isConnected = callStatus === 'connected' && Boolean(connectedPerson);
  const temporaryPerson = TEMPORARY_PEOPLE[temporaryIndex];
  const opposite = isConnected ? connectedPerson : (waitingPerson || temporaryPerson);
  const oppositeName = opposite?.nickname || opposite?.name || temporaryPerson.name;
  const selfName = self?.nickname || self?.name || 'You';
  const selectedName = initialPerson?.nickname || initialPerson?.name || oppositeName;
 const rippleStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.7] }) }],
  };
  const progressStyle = {
    transform: [{ scaleX: progress }],
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#05001c" />
      <ImageBackground source={require('../../../assets/images/callscreenbg.png')} resizeMode="cover" style={styles.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#ddd6fe" size={21} />
          </Pressable>
          <Text style={styles.roomTitle}>Audio Room</Text>
          <View style={styles.titleSpacer} />
        </View>

        <View style={styles.callArea}>
          <View style={styles.oppositeBlock}>
            <Animated.View style={[styles.ripple, rippleStyle]} />
            <View style={styles.avatarFrame}>
              <ProfileAvatar {...(opposite?.avatarStyle || opposite)} name={oppositeName} photoUrl={isConnected ? opposite?.photoUrl : undefined} />
              {isConnected && <View style={styles.onlineDot} />}
            </View>
            <Text style={styles.personName}>{oppositeName}</Text>
            {isConnected ? (
              <>
                <View style={styles.audioStatus}>
                  {[16, 28, 39, 25, 44, 31, 18].map((height, index) => (
                    <Animated.View key={index} style={[styles.bar, { height, transform: [{ scaleY: equalizer.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1 + (index % 3) * 0.2] }) }] }]} />
                  ))}
                </View>
                <Text style={styles.connectedText}>{oppositeName} is connected!</Text>
              </>
            ) : null}

          </View>


          <View style={styles.selfBlock}>
            <View style={styles.avatarFrame}>
              <ProfileAvatar {...(self?.avatarStyle || self)} name={selfName} photoUrl={self?.photoUrl} />
            </View>
            <Text style={styles.selfName}>{selfName === 'You' ? 'You' : selfName}</Text>
          </View>

          {!isConnected && (
            <View style={styles.searchArea}>
              <Text style={styles.busyText}>{callStatus === 'busy' || !waitingPerson ? selectedName + ' just got busy' : 'Calling ' + selectedName + '...'}</Text>
              <View style={styles.searchLabelRow}>
                <ActivityIndicator size="small" color="#e879f9" />
                <Text style={styles.searchText}>Connecting with other MILO...</Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomControls}>
          <Control icon={<Mic color="#f7f4ff" size={21} />} label="Mic" active={muted} onPress={() => setMuted(value => !value)} />
          <Control icon={<Volume2 color="#f7f4ff" size={21} />} label="Speaker" active={speaker} onPress={() => setSpeaker(value => !value)} />
          <Pressable style={styles.endButton} onPress={() => navigation.goBack()}>
            <PhoneOff color="#fff" size={25} fill="#fff" />
          </Pressable>
          <Control icon={<MoreHorizontal color="#f7f4ff" size={22} />} label="More" />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Control({ icon, label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.controlWrap}>
      <View style={[styles.controlButton, active && styles.controlActive]}>{icon}</View>
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05001c' },
  background: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  topBar: { height: 54, justifyContent: 'center' },
  backButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(156,130,210,0.28)', alignItems: 'center', justifyContent: 'center' },
  callArea: { flex: 1, alignItems: 'center', paddingTop: 47 },
  oppositeBlock: { alignItems: 'center', minHeight: 215 },
  ripple: { position: 'absolute', top: -17, width: 126, height: 126, borderRadius: 63, borderWidth: 1, borderColor: '#7c3aed' },
  avatarFrame: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: '#a855f7', backgroundColor: '#25104b', alignItems: 'center', justifyContent: 'center', shadowColor: '#bb43ff', shadowOpacity: 0.75, shadowRadius: 15, elevation: 10 },
  onlineDot: { position: 'absolute', right: 2, bottom: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#21e6a1', borderWidth: 2, borderColor: '#170032' },
  personName: { marginTop: 15, color: '#fff', fontSize: 20, fontWeight: '700' },
  busyText: { marginTop: 14, color: '#e9d5ff', fontSize: 12 },
  audioStatus: { height: 45, flexDirection: 'row', alignItems: 'center', columnGap: 3, marginTop: 16 },
  bar: { width: 3, borderRadius: 3, backgroundColor: '#ec49dc' },
  connectedText: { color: '#c4b5fd', fontSize: 12, marginTop: 11 },
  searchArea: { width: '100%', alignItems: 'center', marginTop: 18 },
  searchLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  searchText: { color: '#e9d5ff', fontSize: 13 },
  progressTrack: { width: 180, height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 16, backgroundColor: 'rgba(196,181,253,0.24)' },
  progressFill: { width: '100%', height: '100%', borderRadius: 3, backgroundColor: '#b83cff', transformOrigin: 'left' },
  selfBlock: { alignItems: 'center', marginTop: 72 },
  selfName: { color: '#fff', fontSize: 12, marginTop: 7 },
  bottomControls: { alignSelf: 'center', width: '100%', maxWidth: 326, marginBottom: 10, minHeight: 68, borderRadius: 20, paddingHorizontal: 15, backgroundColor: 'rgba(18,4,54,0.91)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.46)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  controlWrap: { width: 49, alignItems: 'center' },
  controlButton: { width: 37, height: 37, borderRadius: 19, backgroundColor: 'rgba(123,92,172,0.25)', alignItems: 'center', justifyContent: 'center' },
  controlActive: { backgroundColor: 'rgba(161,87,242,0.72)' },
  controlLabel: { color: '#f5f3ff', fontSize: 9, marginTop: 4 },
  endButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fa2468', alignItems: 'center', justifyContent: 'center', shadowColor: '#fa2468', shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
});