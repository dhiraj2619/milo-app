import React, { useEffect, useRef, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCView } from 'react-native-webrtc';
import { ArrowLeft, Gift, Heart, Mic, MicOff, Phone, PhoneOff, SwitchCamera, Video, VideoOff, Volume2, VolumeX } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { getFavourites, getMyProfile, setFavourite as saveFavourite } from '../../services/userService';
import { useCall } from '../../call/CallProvider';
import { Control, formatDuration, styles } from './callRoomUi';
import { GiftBurst, GiftSheet } from '../../components/call/Gifts';
import { InterestChips, PromptCard } from '../../components/profile/Interests';

const LEAVE_AFTER_END_MS = 1600;
const MAX_SUGGESTIONS = 4;
// When the person couldn't be reached, offer other online people instead of leaving.
const UNREACHABLE_REASONS = ['offline', 'busy', 'no_answer', 'rejected', 'not_found'];

const endedText = (reason, name) => ({
  offline: `${name} is offline right now`,
  busy: `${name} is on another call`,
  no_answer: `${name} didn't answer`,
  rejected: `${name} declined the call`,
  not_found: `${name} is not available`,
  already_in_call: "You're already on a call",
  permission_denied: 'Allow microphone and camera access to call',
  media_error: 'Could not start your microphone or camera',
  network: 'Could not connect. Check your internet',
  failed: 'Connection lost',
  disconnected: 'Call disconnected',
  time_up: "Time's up!",
}[reason] || 'Call ended');

export default function LiveCallRoom({ navigation, route }) {
  const isVideo = route.params?.callType === 'video' || route.name === 'VideoRoom';
  const callType = isVideo ? 'video' : 'audio';
  const incomingCallId = route.params?.incomingCallId;
  const { call, controls, localStream, remoteStream, startCall, endCall, toggleMute, toggleCamera, switchCamera, toggleSpeaker, sendGift, giftEvent } = useCall();
  const [self, setSelf] = useState(route.params?.currentUser || null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [coins, setCoins] = useState(null);
  // The provider keeps the last gift of any call; only animate gifts that arrive while this screen is open.
  const giftOnOpen = useRef(giftEvent);
  const [elapsed, setElapsed] = useState(0);
  const [frontCamera, setFrontCamera] = useState(true);
  const joinedRef = useRef(false);
  const endedRef = useRef(null);
  const [favourite, setFavourite] = useState(false);
  const [mutual, setMutual] = useState(false);

  useEffect(() => {
    // Incoming and room-matched calls are already under way; only direct calls are dialled here.
    if (!incomingCallId && !route.params?.matched) startCall(route.params?.person, callType);
    // Start once per screen; the call provider ignores repeats while busy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    if (route.params?.currentUser) return undefined;
    getMyProfile().then(profile => { if (active) setSelf(profile); }).catch(() => { });
    return () => { active = false; };
  }, [route.params?.currentUser]);

  // Leaving the screen hangs up.
  useEffect(() => navigation.addListener('beforeRemove', () => endCall()), [endCall, navigation]);

  // A previous call may still be showing "ended" when this screen opens, so
  // only leave once this screen has seen its own call in progress.
  if (!['idle', 'ended'].includes(call.status)) joinedRef.current = true;
  // The provider resets an ended call to idle after a moment; keep how this one ended for the end screen.
  if (call.status === 'ended' && joinedRef.current && !endedRef.current) {
    endedRef.current = { reason: call.endReason, peer: call.peer, talkedSeconds: call.connectedAt ? Math.round((Date.now() - call.connectedAt) / 1000) : 0 };
  }
  const ended = endedRef.current;
  const peerId = call.peer?._id || ended?.peer?._id || route.params?.person?._id;
  const suggestions = (Array.isArray(route.params?.availablePeople) ? route.params.availablePeople : [])
    .filter(person => person?._id && person._id !== peerId)
    .slice(0, MAX_SUGGESTIONS);
  const showSuggestions = !!ended && UNREACHABLE_REASONS.includes(ended.reason) && suggestions.length > 0;
  // A call that actually connected: offer to favourite and call again instead of leaving.
  const showAfterCall = !!ended && ended.talkedSeconds > 0 && !String(peerId || '').startsWith('demo-');

  useEffect(() => {
    if (!ended || showSuggestions || showAfterCall) return undefined;
    const timer = setTimeout(() => { if (navigation.canGoBack()) navigation.goBack(); }, LEAVE_AFTER_END_MS);
    return () => clearTimeout(timer);
  }, [ended, navigation, showSuggestions, showAfterCall]);

  useEffect(() => {
    if (!showAfterCall) return undefined;
    let active = true;
    getFavourites().then(list => { if (active) setFavourite(list.some(person => person._id === peerId)); }).catch(() => { });
    return () => { active = false; };
  }, [peerId, showAfterCall]);

  const toggleFavourite = () => {
    const next = !favourite;
    setFavourite(next);
    saveFavourite(peerId, next).then(result => setMutual(next && result.mutual)).catch(() => setFavourite(!next));
  };

  // Restart this screen with the new person so the call state starts fresh (as a normal direct call).
  const callSomeoneElse = person => navigation.replace(route.name, { ...route.params, person, incomingCallId: undefined, matched: undefined });

  useEffect(() => {
    if (!call.connectedAt) return undefined;
    const tick = () => setElapsed(Math.floor((Date.now() - call.connectedAt) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [call.connectedAt]);

  const isConnected = call.status === 'connected';
  const isEnded = !!ended;
  const peer = call.peer || ended?.peer || route.params?.person || {};
  const peerName = peer.nickname || peer.name || 'MILO member';
  const selfName = self?.nickname || self?.name || 'You';
  const afterCallText = ended?.reason === 'time_up' ? `Time's up! Liked talking to ${peerName}? Add them to favourites.` : `You talked for ${formatDuration(ended?.talkedSeconds || 0)}`;
  const statusText = isEnded ? (showAfterCall ? afterCallText : endedText(ended.reason, peerName)) : ({
    starting: `Calling ${peerName}...`,
    // "Calling" until the other phone actually shows the call (it may only have a notification so far).
    ringing: call.delivery === 'calling' ? `Calling ${peerName}...` : 'Ringing...',
    connecting: 'Connecting...',
  }[call.status] || `Calling ${peerName}...`);
  // Speed Talk counts down to the server's time limit.
  const pillText = isConnected
    ? (call.maxSeconds ? `${formatDuration(Math.max(call.maxSeconds - elapsed, 0))} left` : formatDuration(elapsed))
    : (isEnded ? 'Ended' : 'Connecting');
  const showRemoteVideo = isVideo && isConnected && remoteStream && !call.remoteMedia.cameraOff;
  const showSelfVideo = isVideo && localStream && !controls.cameraOff;
  const flip = () => { switchCamera(); setFrontCamera(value => !value); };
  const balance = coins ?? self?.coinBalance;
  const openGifts = () => setGiftOpen(true);
  const giveGift = async gift => {
    const result = await sendGift(gift.id);
    if (result.ok && typeof result.coinBalance === 'number') setCoins(result.coinBalance);
    return result;
  };
  const getCoins = () => { setGiftOpen(false); navigation.navigate('CoinStore'); };
  // Conversation starters: the other person's interests (shared ones highlighted) and their prompts.
  const peerPrompts = Array.isArray(peer.prompts) ? peer.prompts : [];
  const showStarters = !isEnded && (call.question || peer.interests?.length > 0 || peerPrompts.length > 0);
  const starters = showStarters && (
    <View style={liveStyles.starters}>
      {/* Matched in a MILO Special room: the room's icebreaker comes first. */}
      {!!call.question && <View style={liveStyles.roomQuestion}><Text style={liveStyles.roomQuestionLabel}>Ask each other</Text><Text style={liveStyles.roomQuestionText}>{call.question}</Text></View>}
      <InterestChips interests={peer.interests} max={4} small highlight={self?.interests || []} />
      {peerPrompts.slice(0, isConnected ? 1 : 2).map(prompt => <View key={prompt.question} style={liveStyles.starterPrompt}><PromptCard prompt={prompt} compact /></View>)}
    </View>
  );
  const speakerControl = <Control icon={controls.speaker ? <Volume2 color="#fff" size={21} /> : <VolumeX color="#f7f4ff" size={21} />} label="Speaker" active={controls.speaker} onPress={toggleSpeaker} />;

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
              <Text style={styles.statusPillText}>{pillText}</Text>
            </View>
          </View>
          <View style={styles.titleSpacer} />
        </View>

        {isVideo && isConnected ? (
          <View style={styles.videoStage}>
            <Pressable accessibilityRole="button" accessibilityLabel="Send a gift" onPress={openGifts} style={({ pressed }) => [liveStyles.videoGift, pressed && styles.pressed]}>
              <Gift color="#fff" size={20} />
            </Pressable>
            <View style={styles.remoteVideo}>
              {showRemoteVideo ? (
                <RTCView streamURL={remoteStream.toURL()} objectFit="cover" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={styles.remoteVideoRing}>
                  <View style={styles.remoteVideoAvatar}>
                    <ProfileAvatar {...(peer.avatarStyle || peer)} name={peerName} photoUrl={peer.photoUrl} />
                  </View>
                </View>
              )}
              <View style={styles.remoteVideoFooter}>
                <View style={styles.liveBadge}><View style={styles.statusDotLive} /><Text style={styles.liveBadgeText}>LIVE</Text></View>
                <Text style={styles.remoteVideoName}>{peerName}</Text>
                {call.remoteMedia.muted && <MicOff color="#fff" size={16} />}
              </View>
            </View>
            <View style={styles.selfPreview}>
              {showSelfVideo ? (
                <RTCView streamURL={localStream.toURL()} objectFit="cover" mirror={frontCamera} zOrder={1} style={StyleSheet.absoluteFill} />
              ) : (
                <View style={styles.selfPreviewOff}><VideoOff color="#c4b5fd" size={22} /><Text style={styles.selfPreviewOffText}>Camera off</Text></View>
              )}
              {controls.muted && <View style={styles.selfPreviewMuted}><MicOff color="#fff" size={12} /></View>}
            </View>
          </View>
        ) : (
          <View style={styles.callArea}>
            <View style={styles.oppositeBlock}>
              <View style={styles.avatarHalo}>
                <View style={[styles.avatarFrame, isConnected && styles.avatarFrameLive]}>
                  <ProfileAvatar {...(peer.avatarStyle || peer)} name={peerName} photoUrl={peer.photoUrl} />
                </View>
                {isConnected && <View style={styles.onlineDot} />}
              </View>
              <Text numberOfLines={1} style={styles.personName}>{peerName}</Text>
              {isConnected ? (
                <Text style={styles.connectedText}>
                  {call.remoteMedia.muted ? `${peerName} is muted` : `You're now talking with ${peerName}`}
                </Text>
              ) : (
                <Text style={styles.callingText}>{statusText}</Text>
              )}
              {starters}
            </View>
            {showSuggestions || showAfterCall ? (
              <View style={liveStyles.suggestions}>
                {showAfterCall && (
                  <View style={liveStyles.afterCall}>
                    <Pressable accessibilityRole="button" accessibilityState={{ selected: favourite }} accessibilityLabel={favourite ? `Remove ${peerName} from favourites` : `Add ${peerName} to favourites`} onPress={toggleFavourite} style={({ pressed }) => [liveStyles.afterButton, favourite && liveStyles.afterButtonOn, pressed && styles.pressed]}>
                      <Heart color={favourite ? '#ff6fa8' : '#fff'} fill={favourite ? '#ff6fa8' : 'none'} size={18} />
                      <Text style={liveStyles.afterButtonText}>{favourite ? 'In favourites' : 'Add to favourites'}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Call ${peerName} again`} onPress={() => callSomeoneElse(peer)} style={({ pressed }) => [liveStyles.afterButton, liveStyles.afterButtonPrimary, pressed && styles.pressed]}>
                      {isVideo ? <Video color="#fff" size={18} /> : <Phone color="#fff" size={17} fill="#fff" />}
                      <Text style={liveStyles.afterButtonText}>Call again</Text>
                    </Pressable>
                  </View>
                )}
                {mutual && <Text style={liveStyles.mutual}>💜 It's a match! You both added each other.</Text>}
                {showAfterCall && (
                  <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} hitSlop={8} style={liveStyles.doneLink}>
                    <Text style={liveStyles.doneText}>Done</Text>
                  </Pressable>
                )}
                {suggestions.length > 0 && <Text style={liveStyles.suggestionsTitle}>Talk to someone else</Text>}
                <ScrollView style={liveStyles.suggestionsList} showsVerticalScrollIndicator={false}>
                  {suggestions.map(person => {
                    const name = person.nickname || person.name || 'MILO member';
                    return (
                      <Pressable key={person._id} accessibilityRole="button" accessibilityLabel={`Call ${name}`} onPress={() => callSomeoneElse(person)} style={({ pressed }) => [liveStyles.suggestionRow, pressed && styles.pressed]}>
                        <View style={liveStyles.suggestionAvatar}>
                          <View style={liveStyles.suggestionAvatarClip}>
                            <ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} />
                          </View>
                          <View style={liveStyles.suggestionDot} />
                        </View>
                        <View style={liveStyles.suggestionCopy}>
                          <Text numberOfLines={1} style={liveStyles.suggestionName}>{name}</Text>
                          <Text style={liveStyles.suggestionStatus}>Online now</Text>
                        </View>
                        <View style={liveStyles.suggestionCall}>
                          {isVideo ? <Video color="#fff" size={15} /> : <Phone color="#fff" size={14} fill="#fff" />}
                          <Text style={liveStyles.suggestionCallText}>Call</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
            <View style={[styles.selfBlock, liveStyles.selfBlockSpacing]}>
              <View style={styles.selfFrame}>
                {showSelfVideo ? (
                  <RTCView streamURL={localStream.toURL()} objectFit="cover" mirror={frontCamera} style={StyleSheet.absoluteFill} />
                ) : (
                  <ProfileAvatar {...(self?.avatarStyle || self)} name={selfName} photoUrl={self?.photoUrl} />
                )}
              </View>
              {controls.muted && <View style={styles.selfMuted}><MicOff color="#fff" size={12} /></View>}
              <Text style={styles.selfName}>You</Text>
            </View>
            )}
          </View>
        )}

        <View style={styles.bottomControls}>
          <Control icon={controls.muted ? <MicOff color="#fff" size={21} /> : <Mic color="#f7f4ff" size={21} />} label={controls.muted ? 'Unmute' : 'Mute'} active={controls.muted} disabled={isEnded} onPress={toggleMute} />
          {isVideo ? (
            <Control icon={controls.cameraOff ? <VideoOff color="#fff" size={21} /> : <Video color="#f7f4ff" size={21} />} label={controls.cameraOff ? 'Camera on' : 'Camera'} active={controls.cameraOff} disabled={isEnded} onPress={toggleCamera} />
          ) : speakerControl}
          <Pressable accessibilityRole="button" accessibilityLabel="End call" disabled={isEnded} style={({ pressed }) => [styles.endButton, pressed && styles.pressed]} onPress={() => (isConnected ? endCall() : navigation.goBack())}>
            <PhoneOff color="#fff" size={26} />
          </Pressable>
          {isVideo ? (
            <Control icon={<SwitchCamera color="#f7f4ff" size={21} />} label="Flip" disabled={controls.cameraOff || isEnded} onPress={flip} />
          ) : (
            <Control icon={<Gift color="#f7f4ff" size={21} />} label="Gift" disabled={!isConnected} onPress={openGifts} />
          )}
          {isVideo && speakerControl}
        </View>
      </SafeAreaView>
      <GiftBurst event={giftEvent === giftOnOpen.current ? null : giftEvent} peerName={peerName} />
      <GiftSheet visible={giftOpen && isConnected} onClose={() => setGiftOpen(false)} peerName={peerName} balance={balance} onSend={giveGift} onGetCoins={getCoins} />
    </View>
  );
}

const liveStyles = StyleSheet.create({
  selfBlockSpacing: { marginTop: 44 },
  suggestions: { width: '100%', maxWidth: 360, marginTop: 28 },
  suggestionsTitle: { color: '#ede9fe', fontSize: 14, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  afterCall: { flexDirection: 'row', gap: 10 },
  starters: { width: '100%', maxWidth: 340, alignItems: 'center', marginTop: 16, gap: 10 },
  roomQuestion: { alignSelf: 'stretch', borderRadius: 16, padding: 12, backgroundColor: 'rgba(232,121,249,0.14)', borderWidth: 1, borderColor: 'rgba(232,121,249,0.45)' },
  roomQuestionLabel: { color: '#f0abfc', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  roomQuestionText: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginTop: 4 },
  mutual: { color: '#f9a8d4', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  starterPrompt: { alignSelf: 'stretch' },
  videoGift: { position: 'absolute', zIndex: 5, left: 14, top: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(161,87,242,0.85)', alignItems: 'center', justifyContent: 'center' },
  afterButton: { flex: 1, height: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(18,4,54,0.72)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.5)' },
  afterButtonOn: { borderColor: '#ff6fa8', backgroundColor: 'rgba(255,111,168,0.14)' },
  afterButtonPrimary: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  afterButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  doneLink: { alignSelf: 'center', paddingVertical: 12, marginBottom: 8 },
  doneText: { color: '#c4b5fd', fontSize: 14, fontWeight: '600' },
  suggestionsList: { maxHeight: 264 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, marginBottom: 8, borderRadius: 18, backgroundColor: 'rgba(18,4,54,0.72)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.32)' },
  suggestionAvatar: { width: 44, height: 44 },
  suggestionAvatarClip: { flex: 1, borderRadius: 22, overflow: 'hidden', backgroundColor: '#25104b' },
  suggestionDot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#21e6a1', borderWidth: 2, borderColor: '#120436' },
  suggestionCopy: { flex: 1 },
  suggestionName: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  suggestionStatus: { color: '#21e6a1', fontSize: 11, fontWeight: '600', marginTop: 2 },
  suggestionCall: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 34, borderRadius: 17, backgroundColor: '#a855f7' },
  suggestionCallText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
