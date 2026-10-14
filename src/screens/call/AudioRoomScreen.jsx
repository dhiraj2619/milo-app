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
import { ArrowLeft, Mic, MicOff, MoreHorizontal, PhoneOff, SwitchCamera, Video, VideoOff, Volume2, VolumeX } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { getMyProfile } from '../../services/userService';
const AVATAR_SIZE = 124;
const SELF_AVATAR_SIZE = 74;
const REMOTE_VIDEO_AVATAR_SIZE = 168;
const SEARCH_DURATION = 18000;
const CONNECTOR_DOTS = 5;
const TEMPORARY_PEOPLE = [
  { name: 'Pooja', avatarStyle: { avatarSeed: 'milo-call-pooja', background: '#D1B4FF', gender: 'female', hair: '#392323', shirt: '#E56D9A' } },
  { name: 'Sia', avatarStyle: { avatarSeed: 'milo-call-sia', background: '#BFA9FF', gender: 'female', hair: '#63362D', shirt: '#A58CF4', bun: true } },
  { name: 'Riya', avatarStyle: { avatarSeed: 'milo-call-riya', background: '#E7B5FF', gender: 'female', hair: '#2E2120', shirt: '#C768E3' } },
];
const formatDuration = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export default function AudioRoomScreen({ navigation, route }) {
  const isVideo = route.params?.callType === 'video' || route.name === 'VideoRoom';
  const initialPerson = route.params?.person || null;
  const availablePeople = route.params?.availablePeople;
  const candidates = useMemo(
    () => (Array.isArray(availablePeople) ? availablePeople : []).filter(person => person?._id !== initialPerson?._id),
    [availablePeople, initialPerson?._id],
  );
  const initiallyConnected = route.params?.callStatus === 'connected' && route.params?.connectedPerson;
  const selectedIsOnline = initialPerson?.isOnline === true;
  const [callStatus, setCallStatus] = useState(initiallyConnected ? 'connected' : 'searching');
  const [connectedPerson, setConnectedPerson] = useState(route.params?.connectedPerson || null);
  const [waitingPerson, setWaitingPerson] = useState(initialPerson || {});
  const [temporaryIndex, setTemporaryIndex] = useState(() => Math.floor(Math.random() * TEMPORARY_PEOPLE.length));
  const [self, setSelf] = useState(route.params?.currentUser || null);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(isVideo);
  const [cameraOff, setCameraOff] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let active = true;
    if (route.params?.currentUser) return undefined;
    getMyProfile().then(profile => {
      if (active) setSelf(profile);
    }).catch(() => { });
    return () => { active = false; };
  }, [route.params?.currentUser]);
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const equalizer = useRef(new Animated.Value(0)).current;
  const flow = useRef(new Animated.Value(0)).current;
  const connectedReveal = useRef(new Animated.Value(initiallyConnected ? 1 : 0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }));
    const equalizerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(equalizer, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(equalizer, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    );
    const flowLoop = Animated.loop(Animated.timing(flow, { toValue: 1, duration: 1300, easing: Easing.linear, useNativeDriver: true }));
    pulseLoop.start();
    equalizerLoop.start();
    flowLoop.start();
    return () => {
      pulseLoop.stop();
      equalizerLoop.stop();
      flowLoop.stop();
    };
  }, [equalizer, flow, pulse]);

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
    // An online contact is shown by name until their simulated acceptance.
    // Offline contacts transition into anonymous, fast-moving avatar search.
    if (selectedIsOnline) {
      const acceptTimer = setTimeout(() => {
        setConnectedPerson(initialPerson);
        setCallStatus('connected');
      }, 1800);
      return () => {
        progressAnimation.stop();
        clearTimeout(acceptTimer);
      };
    }
    const busyTimer = setTimeout(() => setCallStatus('busy'), 1800);
    let rotateTimer;
    const placeholderTimer = setTimeout(() => {
      setCallStatus('searching');
      setWaitingPerson(null);
      setTemporaryIndex(index => (index + 1) % TEMPORARY_PEOPLE.length);
      rotateTimer = setInterval(() => {
        setTemporaryIndex(index => (index + 1) % TEMPORARY_PEOPLE.length);
      }, 700);
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
  }, [candidates, initialPerson, initiallyConnected, progress, selectedIsOnline]);

  const isConnected = callStatus === 'connected' && Boolean(connectedPerson);
  useEffect(() => {
    if (!isConnected) return undefined;
    setElapsed(0);
    Animated.spring(connectedReveal, { toValue: 1, damping: 16, stiffness: 140, useNativeDriver: true }).start();
    const timer = setInterval(() => setElapsed(seconds => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [connectedReveal, isConnected]);

  const temporaryPerson = TEMPORARY_PEOPLE[temporaryIndex];
  const opposite = isConnected ? connectedPerson : (waitingPerson || temporaryPerson);
  const oppositeName = opposite?.nickname || opposite?.name || temporaryPerson.name;
  const selfName = self?.nickname || self?.name || 'You';
  const selectedName = initialPerson?.nickname || initialPerson?.name || oppositeName;
  const statusText = callStatus === 'busy' || !waitingPerson ? `${selectedName} just got busy` : `Calling ${selectedName}...`;
  const rippleStyle = phase => {
    const value = phase ? Animated.modulo(Animated.add(pulse, phase), 1) : pulse;
    return {
      opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
      transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] }) }],
    };
  };
  const revealStyle = {
    opacity: connectedReveal,
    transform: [{ scale: connectedReveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
  };
  const showRemoteVideo = isVideo && isConnected;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#05001c" />
      <ImageBackground source={require('../../../assets/images/callscreenbg.png')} resizeMode="cover" style={styles.background} />
      <View style={styles.backgroundGlow} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color="#ede9fe" size={20} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.roomTitle}>{isVideo ? 'Video Call' : 'Audio Call'}</Text>
            <View style={[styles.statusPill, isConnected && styles.statusPillLive]}>
              <View style={[styles.statusDot, isConnected && styles.statusDotLive]} />
              <Text style={styles.statusPillText}>{isConnected ? formatDuration(elapsed) : 'Connecting'}</Text>
            </View>
          </View>
          <View style={styles.titleSpacer} />
        </View>

        {showRemoteVideo ? (
          <Animated.View style={[styles.videoStage, revealStyle]}>
            <View style={styles.remoteVideo}>
              <View style={styles.remoteVideoRing}>
                <View style={styles.remoteVideoAvatar}>
                  <ProfileAvatar {...(opposite?.avatarStyle || opposite)} name={oppositeName} photoUrl={opposite?.photoUrl} />
                </View>
              </View>
              <View style={styles.remoteVideoFooter}>
                <View style={styles.liveBadge}><View style={styles.statusDotLive} /><Text style={styles.liveBadgeText}>LIVE</Text></View>
                <Text style={styles.remoteVideoName}>{oppositeName}</Text>
              </View>
            </View>
            <View style={styles.selfPreview}>
              {cameraOff ? (
                <View style={styles.selfPreviewOff}><VideoOff color="#c4b5fd" size={22} /><Text style={styles.selfPreviewOffText}>Camera off</Text></View>
              ) : (
                <View style={[styles.selfPreviewAvatar, !frontCamera && styles.mirrored]}>
                  <ProfileAvatar {...(self?.avatarStyle || self)} name={selfName} photoUrl={self?.photoUrl} />
                </View>
              )}
              {muted && <View style={styles.selfPreviewMuted}><MicOff color="#fff" size={12} /></View>}
            </View>
          </Animated.View>
        ) : (
          <View style={styles.callArea}>
            <View style={styles.oppositeBlock}>
              {!isConnected && <Animated.View style={[styles.ripple, rippleStyle(0)]} />}
              {!isConnected && <Animated.View style={[styles.ripple, rippleStyle(0.5)]} />}
              <Animated.View style={[styles.avatarHalo, isConnected && revealStyle]}>
                <View style={[styles.avatarFrame, isConnected && styles.avatarFrameLive]}>
                  <ProfileAvatar {...(opposite?.avatarStyle || opposite)} name={oppositeName} photoUrl={isConnected ? opposite?.photoUrl : undefined} />
                </View>
                {isConnected && <View style={styles.onlineDot} />}
              </Animated.View>
              <Text numberOfLines={1} style={styles.personName}>{isConnected || waitingPerson ? oppositeName : 'Finding someone...'}</Text>
              {isConnected ? (
                <>
                  <View style={styles.audioStatus}>
                    {[14, 24, 36, 22, 40, 28, 16].map((height, index) => (
                      <Animated.View key={index} style={[styles.bar, { height, transform: [{ scaleY: equalizer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1 + (index % 3) * 0.2] }) }] }]} />
                    ))}
                  </View>
                  <Text style={styles.connectedText}>You're now talking with {oppositeName}</Text>
                </>
              ) : (
                <Text style={styles.callingText}>{statusText}</Text>
              )}
            </View>

            {!isConnected && (
              <View style={styles.connector}>
                {Array.from({ length: CONNECTOR_DOTS }, (_, index) => (
                  <Animated.View
                    key={index}
                    style={[styles.connectorDot, {
                      opacity: flow.interpolate({ inputRange: [-1, index / CONNECTOR_DOTS, (index + 0.5) / CONNECTOR_DOTS, (index + 1) / CONNECTOR_DOTS, 2], outputRange: [0.18, 0.18, 1, 0.18, 0.18] }),
                    }]}
                  />
                ))}
              </View>
            )}

            <View style={[styles.selfBlock, isConnected && styles.selfBlockConnected]}>
              <View style={styles.selfFrame}>
                <ProfileAvatar {...(self?.avatarStyle || self)} name={selfName} photoUrl={self?.photoUrl} />
              </View>
              {muted && <View style={styles.selfMuted}><MicOff color="#fff" size={12} /></View>}
              <Text style={styles.selfName}>You</Text>
            </View>
          </View>
        )}

        {!isConnected && (
          <View style={styles.searchCard}>
            <View style={styles.searchLabelRow}>
              <ActivityIndicator size="small" color="#e879f9" />
              <Text style={styles.searchText}>Connecting with other MILO members...</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { transform: [{ scaleX: progress }] }]} />
            </View>
          </View>
        )}

        <View style={styles.bottomControls}>
          <Control icon={muted ? <MicOff color="#fff" size={21} /> : <Mic color="#f7f4ff" size={21} />} label={muted ? 'Unmute' : 'Mute'} active={muted} onPress={() => setMuted(value => !value)} />
          {isVideo ? (
            <Control icon={cameraOff ? <VideoOff color="#fff" size={21} /> : <Video color="#f7f4ff" size={21} />} label={cameraOff ? 'Camera on' : 'Camera'} active={cameraOff} onPress={() => setCameraOff(value => !value)} />
          ) : (
            <Control icon={speaker ? <Volume2 color="#fff" size={21} /> : <VolumeX color="#f7f4ff" size={21} />} label="Speaker" active={speaker} onPress={() => setSpeaker(value => !value)} />
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="End call" style={({ pressed }) => [styles.endButton, pressed && styles.pressed]} onPress={() => navigation.goBack()}>
            <PhoneOff color="#fff" size={26} />
          </Pressable>
          {isVideo ? (
            <Control icon={<SwitchCamera color="#f7f4ff" size={21} />} label="Flip" disabled={cameraOff} onPress={() => setFrontCamera(value => !value)} />
          ) : (
            <Control icon={<MoreHorizontal color="#f7f4ff" size={22} />} label="More" />
          )}
          {isVideo && <Control icon={speaker ? <Volume2 color="#fff" size={21} /> : <VolumeX color="#f7f4ff" size={21} />} label="Speaker" active={speaker} onPress={() => setSpeaker(value => !value)} />}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Control({ icon, label, active, disabled, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active, disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.controlWrap, pressed && styles.pressed, disabled && styles.controlDisabled]}>
      <View style={[styles.controlButton, active && styles.controlActive]}>{icon}</View>
      <Text numberOfLines={1} style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05001c' },
  background: { ...StyleSheet.absoluteFillObject },
  backgroundGlow: { position: 'absolute', top: '18%', alignSelf: 'center', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(124,58,237,0.16)' },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  topBar: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(156,130,210,0.22)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.18)', alignItems: 'center', justifyContent: 'center' },
  titleBlock: { alignItems: 'center' },
  roomTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5, paddingHorizontal: 10, height: 22, borderRadius: 11, backgroundColor: 'rgba(196,181,253,0.14)' },
  statusPillLive: { backgroundColor: 'rgba(33,230,161,0.14)' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e879f9' },
  statusDotLive: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#21e6a1' },
  statusPillText: { color: '#ede9fe', fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  titleSpacer: { width: 38 },
  callArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  oppositeBlock: { alignItems: 'center', width: '100%' },
  ripple: { position: 'absolute', top: -8, width: AVATAR_SIZE + 16, height: AVATAR_SIZE + 16, borderRadius: (AVATAR_SIZE + 16) / 2, borderWidth: 1.5, borderColor: '#a855f7' },
  avatarHalo: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, shadowColor: '#bb43ff', shadowOpacity: 0.8, shadowRadius: 22, elevation: 14 },
  avatarFrame: { flex: 1, borderRadius: AVATAR_SIZE / 2, borderWidth: 3, borderColor: '#a855f7', backgroundColor: '#25104b', overflow: 'hidden' },
  avatarFrameLive: { borderColor: '#c084fc' },
  onlineDot: { position: 'absolute', right: 6, bottom: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#21e6a1', borderWidth: 3, borderColor: '#170032' },
  personName: { marginTop: 18, color: '#fff', fontSize: 24, fontWeight: '700', maxWidth: '80%' },
  callingText: { marginTop: 6, color: '#c4b5fd', fontSize: 14 },
  audioStatus: { height: 44, flexDirection: 'row', alignItems: 'center', columnGap: 4, marginTop: 14 },
  bar: { width: 4, borderRadius: 2, backgroundColor: '#ec49dc' },
  connectedText: { color: '#c4b5fd', fontSize: 13, marginTop: 10 },
  connector: { alignItems: 'center', gap: 8, marginVertical: 22 },
  connectorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e879f9' },
  selfBlock: { alignItems: 'center' },
  selfBlockConnected: { marginTop: 44 },
  selfFrame: { width: SELF_AVATAR_SIZE, height: SELF_AVATAR_SIZE, borderRadius: SELF_AVATAR_SIZE / 2, borderWidth: 2, borderColor: 'rgba(196,181,253,0.7)', backgroundColor: '#25104b', overflow: 'hidden' },
  selfMuted: { position: 'absolute', top: SELF_AVATAR_SIZE - 22, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fa2468', borderWidth: 2, borderColor: '#0b0225', alignItems: 'center', justifyContent: 'center' },
  selfName: { color: '#ddd6fe', fontSize: 13, fontWeight: '600', marginTop: 8 },
  searchCard: { alignSelf: 'center', width: '100%', maxWidth: 340, marginBottom: 18, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 18, backgroundColor: 'rgba(18,4,54,0.72)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.32)', alignItems: 'center' },
  searchLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchText: { color: '#ede9fe', fontSize: 13, fontWeight: '500' },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 14, backgroundColor: 'rgba(196,181,253,0.18)' },
  progressFill: { width: '100%', height: '100%', borderRadius: 3, backgroundColor: '#b83cff', transformOrigin: 'left' },
  videoStage: { flex: 1, marginTop: 6, marginBottom: 16 },
  remoteVideo: { flex: 1, borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(30,10,72,0.78)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.38)', alignItems: 'center', justifyContent: 'center' },
  remoteVideoRing: { width: REMOTE_VIDEO_AVATAR_SIZE + 24, height: REMOTE_VIDEO_AVATAR_SIZE + 24, borderRadius: (REMOTE_VIDEO_AVATAR_SIZE + 24) / 2, backgroundColor: 'rgba(168,85,247,0.16)', alignItems: 'center', justifyContent: 'center' },
  remoteVideoAvatar: { width: REMOTE_VIDEO_AVATAR_SIZE, height: REMOTE_VIDEO_AVATAR_SIZE, borderRadius: REMOTE_VIDEO_AVATAR_SIZE / 2, overflow: 'hidden', borderWidth: 3, borderColor: '#c084fc' },
  remoteVideoFooter: { position: 'absolute', left: 18, bottom: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 12, backgroundColor: 'rgba(5,0,28,0.6)' },
  liveBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  remoteVideoName: { color: '#ffffff', fontSize: 20, fontWeight: '700', flexShrink: 1 },
  selfPreview: { position: 'absolute', top: 14, right: 14, width: 96, height: 132, borderRadius: 18, overflow: 'hidden', backgroundColor: '#1b0b3d', borderWidth: 2, borderColor: 'rgba(196,181,253,0.55)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  selfPreviewAvatar: { flex: 1 },
  mirrored: { transform: [{ scaleX: -1 }] },
  selfPreviewOff: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  selfPreviewOffText: { color: '#c4b5fd', fontSize: 10, fontWeight: '600' },
  selfPreviewMuted: { position: 'absolute', left: 7, bottom: 7, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fa2468', alignItems: 'center', justifyContent: 'center' },
  bottomControls: { alignSelf: 'center', width: '100%', maxWidth: 360, marginBottom: 12, minHeight: 86, borderRadius: 28, paddingHorizontal: 14, backgroundColor: 'rgba(18,4,54,0.92)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.46)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  controlWrap: { width: 58, alignItems: 'center' },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(123,92,172,0.25)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.12)', alignItems: 'center', justifyContent: 'center' },
  controlActive: { backgroundColor: 'rgba(161,87,242,0.78)', borderColor: 'rgba(233,213,255,0.5)' },
  controlDisabled: { opacity: 0.4 },
  controlLabel: { color: '#ede9fe', fontSize: 10, fontWeight: '500', marginTop: 6 },
  endButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fa2468', alignItems: 'center', justifyContent: 'center', shadowColor: '#fa2468', shadowOpacity: 0.7, shadowRadius: 14, elevation: 8 },
  pressed: { transform: [{ scale: 0.94 }] },
});
