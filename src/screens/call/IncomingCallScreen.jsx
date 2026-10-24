import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, Easing, ImageBackground, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, PhoneOff, Video } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { useCall } from '../../call/CallProvider';
import { styles } from './callRoomUi';
import { InterestChips, PromptCard } from '../../components/profile/Interests';

const LEAVE_AFTER_END_MS = 1200;

export default function IncomingCallScreen({ navigation }) {
  const { call, acceptCall, rejectCall } = useCall();
  const pulse = useRef(new Animated.Value(0)).current;
  const isVideo = call.callType === 'video';
  const peer = call.peer || {};
  const peerName = peer.nickname || 'MILO member';
  const isRinging = call.status === 'incoming';

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Hardware back declines the call.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      rejectCall();
      return false;
    });
    return () => subscription.remove();
  }, [rejectCall]);

  // Caller hung up, the call timed out, or it was answered on another device.
  useEffect(() => {
    if (isRinging) return undefined;
    const timer = setTimeout(() => { if (navigation.canGoBack()) navigation.goBack(); }, LEAVE_AFTER_END_MS);
    return () => clearTimeout(timer);
  }, [isRinging, navigation]);

  const accept = () => {
    const { callId, callType } = call;
    acceptCall();
    navigation.replace(callType === 'video' ? 'VideoRoom' : 'AudioRoom', { person: peer, callType, incomingCallId: callId });
  };
  const decline = () => {
    rejectCall();
    navigation.goBack();
  };

  const rippleStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] }) }],
  };
  const endedText = call.endReason === 'answered_elsewhere' ? 'Answered on another device' : 'Missed call';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#05001c" />
      <ImageBackground source={require('../../../assets/images/callscreenbg.png')} resizeMode="cover" style={styles.background} />
      <View style={styles.backgroundGlow} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.callArea}>
          <View style={styles.oppositeBlock}>
            {isRinging && <Animated.View style={[styles.ripple, rippleStyle]} />}
            <View style={styles.avatarHalo}>
              <View style={styles.avatarFrame}>
                <ProfileAvatar {...(peer.avatarStyle || peer)} name={peerName} photoUrl={peer.photoUrl} />
              </View>
            </View>
            <Text numberOfLines={1} style={styles.personName}>{peerName}</Text>
            <Text style={styles.callingText}>
              {isRinging ? `Incoming ${isVideo ? 'video' : 'audio'} call...` : endedText}
            </Text>
            {isRinging && (peer.interests?.length > 0 || peer.prompts?.length > 0) && (
              <View style={incomingStyles.starters}>
                <InterestChips interests={peer.interests} max={4} small />
                {peer.prompts?.[0] && <View style={incomingStyles.prompt}><PromptCard prompt={peer.prompts[0]} compact /></View>}
              </View>
            )}
          </View>
        </View>
        <View style={incomingStyles.actions}>
          <ActionButton label="Decline" color="#fa2468" disabled={!isRinging} onPress={decline} icon={<PhoneOff color="#fff" size={28} />} />
          <ActionButton label="Accept" color="#21c98f" disabled={!isRinging} onPress={accept} icon={isVideo ? <Video color="#fff" size={28} /> : <Phone color="#fff" size={28} />} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function ActionButton({ label, color, icon, disabled, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [incomingStyles.action, pressed && styles.pressed, disabled && styles.controlDisabled]}>
      <View style={[incomingStyles.actionCircle, { backgroundColor: color, shadowColor: color }]}>{icon}</View>
      <Text style={incomingStyles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const incomingStyles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 40 },
  starters: { width: '100%', maxWidth: 340, alignItems: 'center', marginTop: 18, gap: 10 },
  prompt: { alignSelf: 'stretch' },
  action: { alignItems: 'center' },
  actionCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.7, shadowRadius: 14, elevation: 8 },
  actionLabel: { color: '#ede9fe', fontSize: 13, fontWeight: '600', marginTop: 10 },
});
