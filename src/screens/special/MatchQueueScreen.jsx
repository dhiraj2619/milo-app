import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Crown } from 'lucide-react-native';
import { Gradient } from '../../components/home/HomeDecor';
import { useCall } from '../../call/CallProvider';
import { joinRoom, leaveRoom } from '../../services/specialService';
import { ROOMS_BY_KEY } from '../../config/rooms';

const SLOW_AFTER_MS = 45000;
const MESSAGES = {
  already_in_call: "You're already on a call.",
  network: 'Could not connect. Check your internet and try again.',
  invalid: 'This room is not available right now.',
};

// Waits in a MILO Special room until the server pairs us with someone, then opens the call.
// route.params.room is a room key from config/rooms.js.
export default function MatchQueueScreen({ navigation, route }) {
  const room = ROOMS_BY_KEY[route.params?.room] || ROOMS_BY_KEY.friends;
  const { call } = useCall();
  const [state, setState] = useState({ phase: 'joining' });
  const [slow, setSlow] = useState(false);
  const matchedRef = useRef(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const Icon = room.icon;

  useEffect(() => {
    let active = true;
    joinRoom(room.key).then(result => {
      if (!active || matchedRef.current) return;
      if (result?.ok) setState({ phase: 'waiting' });
      else setState({ phase: 'error', reason: result?.reason, limit: result?.limit });
    });
    const slowTimer = setTimeout(() => active && setSlow(true), SLOW_AFTER_MS);
    return () => {
      active = false;
      clearTimeout(slowTimer);
      // Leaving the screen before a match takes us out of the queue.
      if (!matchedRef.current) leaveRoom();
    };
  }, [room.key]);

  // The server paired us: CallProvider has started the call, so switch to the call screen.
  useEffect(() => {
    if (matchedRef.current || call.room !== room.key || !['connecting', 'connected'].includes(call.status)) return;
    matchedRef.current = true;
    navigation.replace('AudioRoom', { matched: true, callType: 'audio', person: call.peer });
  }, [call.peer, call.room, call.status, navigation, room.key]);

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ring = (delay) => ({
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55 - delay, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1 + delay] }) }],
  });
  const atLimit = state.phase === 'error' && state.reason === 'limit';

  return <SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" backgroundColor="#080910" />
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel="Leave room" onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft size={22} color="#FFF" /></Pressable>
    </View>
    <View style={styles.center}>
      <View style={styles.orbit}>
        {state.phase !== 'error' && <><Animated.View style={[styles.ring, { borderColor: room.accent }, ring(0)]} /><Animated.View style={[styles.ring, { borderColor: room.accent }, ring(0.25)]} /></>}
        <View style={[styles.core, { backgroundColor: room.accent + '33', borderColor: room.accent }]}><Icon size={44} color={room.accent} /></View>
      </View>
      <Text style={styles.title}>{room.title}</Text>
      {atLimit ? <>
        <Text style={styles.text}>You've used your {state.limit} free Speed Talk rounds for today.</Text>
        <Text style={styles.subtext}>Come back tomorrow, or get unlimited rounds with MILO Connect.</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.replace('MiloConnectPlans')} style={styles.upgrade}>
          <Gradient from="#BD58FF" to="#6D24EF" radius={18} /><Crown size={17} color="#FFF" /><Text style={styles.upgradeText}>Get MILO Connect</Text>
        </Pressable>
      </> : state.phase === 'error' ? <>
        <Text style={styles.text}>{MESSAGES[state.reason] || 'Something went wrong. Please try again.'}</Text>
      </> : <>
        <Text style={styles.text}>{state.phase === 'joining' ? 'Joining the room…' : 'Finding someone for you…'}</Text>
        <Text style={styles.subtext}>{slow ? 'Few people are here right now. Stay a little longer, or try another room.' : room.subtitle}</Text>
      </>}
    </View>
    <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.cancel}>
      <Text style={styles.cancelText}>{state.phase === 'error' ? 'Back' : 'Cancel'}</Text>
    </Pressable>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080910', paddingHorizontal: 24 },
  top: { height: 56, justifyContent: 'center' },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(156,130,210,0.18)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbit: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  ring: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 2 },
  core: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 24 },
  text: { color: '#EDE9FE', fontFamily: 'Poppins-Medium', fontSize: 15, marginTop: 10, textAlign: 'center' },
  subtext: { color: '#A8A5B9', fontFamily: 'Poppins-Regular', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  upgrade: { marginTop: 22, height: 50, paddingHorizontal: 22, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 8 },
  upgradeText: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  cancel: { height: 52, borderRadius: 16, marginBottom: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B1726', borderWidth: 1, borderColor: '#342E3F' },
  cancelText: { color: '#E9E3F5', fontFamily: 'Poppins-Medium', fontSize: 15 },
});
