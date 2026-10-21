import React, { useEffect, useRef, useState } from 'react';
import { ImageBackground, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RTCView } from 'react-native-webrtc';
import { ArrowLeft, Mic, MicOff, MoreHorizontal, PhoneOff, SwitchCamera, Video, VideoOff, Volume2, VolumeX } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { getMyProfile } from '../../services/userService';
import { useCall } from '../../call/CallProvider';
import { Control, formatDuration, styles } from './callRoomUi';

const LEAVE_AFTER_END_MS = 1600;

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
}[reason] || 'Call ended');

export default function LiveCallRoom({ navigation, route }) {
  const isVideo = route.params?.callType === 'video' || route.name === 'VideoRoom';
  const callType = isVideo ? 'video' : 'audio';
  const incomingCallId = route.params?.incomingCallId;
  const { call, controls, localStream, remoteStream, startCall, endCall, toggleMute, toggleCamera, switchCamera, toggleSpeaker } = useCall();
  const [self, setSelf] = useState(route.params?.currentUser || null);
  const [elapsed, setElapsed] = useState(0);
  const [frontCamera, setFrontCamera] = useState(true);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!incomingCallId) startCall(route.params?.person, callType);
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
  useEffect(() => {
    if (!['idle', 'ended'].includes(call.status)) joinedRef.current = true;
    if (call.status !== 'ended' || !joinedRef.current) return undefined;
    const timer = setTimeout(() => { if (navigation.canGoBack()) navigation.goBack(); }, LEAVE_AFTER_END_MS);
    return () => clearTimeout(timer);
  }, [call.status, navigation]);

  useEffect(() => {
    if (!call.connectedAt) return undefined;
    const tick = () => setElapsed(Math.floor((Date.now() - call.connectedAt) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [call.connectedAt]);

  const isConnected = call.status === 'connected';
  const isEnded = call.status === 'ended' && joinedRef.current;
  const peer = call.peer || route.params?.person || {};
  const peerName = peer.nickname || peer.name || 'MILO member';
  const selfName = self?.nickname || self?.name || 'You';
  const statusText = isEnded ? endedText(call.endReason, peerName) : ({
    starting: `Calling ${peerName}...`,
    ringing: 'Ringing...',
    connecting: 'Connecting...',
  }[call.status] || `Calling ${peerName}...`);
  const pillText = isConnected ? formatDuration(elapsed) : (isEnded ? 'Ended' : 'Connecting');
  const showRemoteVideo = isVideo && isConnected && remoteStream && !call.remoteMedia.cameraOff;
  const showSelfVideo = isVideo && localStream && !controls.cameraOff;
  const flip = () => { switchCamera(); setFrontCamera(value => !value); };
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
            </View>
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
          </View>
        )}

        <View style={styles.bottomControls}>
          <Control icon={controls.muted ? <MicOff color="#fff" size={21} /> : <Mic color="#f7f4ff" size={21} />} label={controls.muted ? 'Unmute' : 'Mute'} active={controls.muted} disabled={isEnded} onPress={toggleMute} />
          {isVideo ? (
            <Control icon={controls.cameraOff ? <VideoOff color="#fff" size={21} /> : <Video color="#f7f4ff" size={21} />} label={controls.cameraOff ? 'Camera on' : 'Camera'} active={controls.cameraOff} disabled={isEnded} onPress={toggleCamera} />
          ) : speakerControl}
          <Pressable accessibilityRole="button" accessibilityLabel="End call" disabled={isEnded} style={({ pressed }) => [styles.endButton, pressed && styles.pressed]} onPress={() => navigation.goBack()}>
            <PhoneOff color="#fff" size={26} />
          </Pressable>
          {isVideo ? (
            <Control icon={<SwitchCamera color="#f7f4ff" size={21} />} label="Flip" disabled={controls.cameraOff || isEnded} onPress={flip} />
          ) : (
            <Control icon={<MoreHorizontal color="#f7f4ff" size={22} />} label="More" />
          )}
          {isVideo && speakerControl}
        </View>
      </SafeAreaView>
    </View>
  );
}

const liveStyles = StyleSheet.create({
  selfBlockSpacing: { marginTop: 44 },
});
