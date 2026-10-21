import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mic, MicOff, MoreHorizontal, PhoneOff, SwitchCamera, Video, VideoOff, Volume2, VolumeX } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { getMyProfile } from '../../services/userService';
import LiveCallRoom from './LiveCallRoom';
import { Control, formatDuration, styles } from './callRoomUi';
const SEARCH_DURATION = 18000;
const CONNECTOR_DOTS = 5;
const TEMPORARY_PEOPLE = [
  { name: 'Pooja', avatarStyle: { avatarSeed: 'milo-call-pooja', background: '#D1B4FF', gender: 'female', hair: '#392323', shirt: '#E56D9A' } },
  { name: 'Sia', avatarStyle: { avatarSeed: 'milo-call-sia', background: '#BFA9FF', gender: 'female', hair: '#63362D', shirt: '#A58CF4', bun: true } },
  { name: 'Riya', avatarStyle: { avatarSeed: 'milo-call-riya', background: '#E7B5FF', gender: 'female', hair: '#2E2120', shirt: '#C768E3' } },
];
const isDemoPerson = person => !person?._id || String(person._id).startsWith('demo-');

// Real profiles get a live WebRTC call; demo profiles keep the simulated room.
export default function AudioRoomScreen(props) {
  const { route } = props;
  const isLive = route.params?.incomingCallId || (!route.params?.isDemo && !isDemoPerson(route.params?.person));
  return isLive ? <LiveCallRoom {...props} /> : <DemoCallRoom {...props} />;
}

function DemoCallRoom({ navigation, route }) {
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
