import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, Check, Mic, MoreHorizontal, Phone, ShieldCheck, Volume2} from 'lucide-react-native';
import {Gradient} from '../../components/home/HomeDecor';
import ProfileAvatar from '../../components/home/ProfileAvatar';

export default function AudioRoomScreen({navigation, route}) {
  const initialPerson = route.params?.person || {};
  const [person, setPerson] = useState(initialPerson);
  const availablePeople = useMemo(() => Array.isArray(route.params?.availablePeople) ? route.params.availablePeople : [], [route.params?.availablePeople]);
  const isDemo = route.params?.isDemo === true;
  const name = person.nickname || 'MILO member';
  const [joined, setJoined] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [findingOther, setFindingOther] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const ambient = useRef(new Animated.Value(0)).current;
  const activity = useRef(new Animated.Value(0)).current;
  const connectionPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDemo) return undefined;
    const busyTimer = setTimeout(() => setUnavailable(true), 2000);
    const findingTimer = setTimeout(() => setFindingOther(true), 3200);
    return () => { clearTimeout(busyTimer); clearTimeout(findingTimer); };
  }, [isDemo]);

  useEffect(() => {
    if (!findingOther) return undefined;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const nextProgress = Math.min(100, ((Date.now() - startedAt) / 120000) * 100);
      setMatchProgress(nextProgress);
      if (nextProgress >= 100) {
        clearInterval(interval);
        const nextPerson = availablePeople.find(member => member._id !== initialPerson._id);
        if (nextPerson) { setPerson(nextPerson); setUnavailable(false); setFindingOther(false); setMatchProgress(0); }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [availablePeople, findingOther, initialPerson._id]);
  useEffect(() => {
    const lines = Animated.loop(Animated.sequence([
      Animated.timing(connectionPulse, {toValue: 1, duration: 760, easing: Easing.out(Easing.quad), useNativeDriver: true}),
      Animated.timing(connectionPulse, {toValue: 0, duration: 760, easing: Easing.in(Easing.quad), useNativeDriver: true}),
    ]));
    lines.start();
    return () => { lines.stop(); connectionPulse.stopAnimation(); };
  }, [connectionPulse]);
  useEffect(() => {
    const ambientLoop = Animated.loop(Animated.sequence([
      Animated.timing(ambient, {toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(ambient, {toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ]));
    const activityLoop = Animated.loop(Animated.timing(activity, {toValue: 1, duration: 1250, easing: Easing.linear, useNativeDriver: true}));
    ambientLoop.start();
    activityLoop.start();
    return () => { ambientLoop.stop(); activityLoop.stop(); ambient.stopAnimation(); activity.stopAnimation(); };
  }, [activity, ambient]);

  const glowTranslate = ambient.interpolate({inputRange: [0, 1], outputRange: [0, 22]});
  const glowOpacity = ambient.interpolate({inputRange: [0, 1], outputRange: [0.34, 0.64]});
  const lineScale = connectionPulse.interpolate({inputRange: [0, 1], outputRange: [0.15, 1]});
  const waveScale = activity.interpolate({inputRange: [0, 1], outputRange: [0.35, 1]});
  const waveOpacity = activity.interpolate({inputRange: [0, 0.75, 1], outputRange: [0.1, 0.95, 0.1]});
  const callStatus = joined ? 'Connected - private room' : 'Waiting for you to join';  const statusText = joined ? 'Your private audio room is live' : 'Preparing a private audio room';

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#08091C" />
    <Animated.View pointerEvents="none" style={[styles.topGlow, {opacity: glowOpacity, transform: [{translateY: glowTranslate}]}]} />
    <Animated.View pointerEvents="none" style={[styles.sideGlow, {opacity: glowOpacity, transform: [{translateY: glowTranslate}]}]} />

    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.headerButton}><ArrowLeft size={21} color="#F6F0FF" /></Pressable>
      <View style={styles.headerCopy}><Text style={styles.headerTitle}>Audio Room</Text><View style={styles.privateLine}><ShieldCheck size={11} color="#35DF9B" /><Text style={styles.privateText}>Private</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Room options" style={styles.headerButton}><MoreHorizontal size={22} color="#F6F0FF" /></Pressable>
    </View>

    <View style={styles.hero}>
      <View style={styles.avatarStage}>
        <View style={styles.avatarFrame}>
          <Gradient from="#C56CFF" to="#5B23DF" radius={70} />
          <View style={styles.avatar}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /></View>
          {!unavailable && <View style={styles.onlineDot}><Check size={9} color="#062015" strokeWidth={3} /></View>}
        </View>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={[styles.callStatus, unavailable && styles.busyStatus]}>{callStatus}</Text>
    </View>

    <View style={styles.statusCard}>
      <View style={styles.statusIcon}><Phone size={16} color="#D797FF" /></View>
      <View style={styles.statusCopy}><Text style={styles.statusTitle}>{statusText}</Text><Text style={styles.statusSubtext}>{unavailable ? 'Please wait a moment.' : 'Only you and your match can hear this call.'}</Text></View>
      {!unavailable && <View style={styles.statusDots}><Animated.View style={[styles.statusDot, {opacity: waveOpacity, transform: [{scale: waveScale}]}]} /><Animated.View style={[styles.statusDot, styles.statusDotDim, {opacity: waveOpacity, transform: [{scale: waveScale}]}]} /><Animated.View style={[styles.statusDot, styles.statusDotDim, {opacity: waveOpacity, transform: [{scale: waveScale}]}]} /></View>}
    </View>

    <View style={styles.participantSection}>
      <Text style={styles.sectionLabel}>PARTICIPANTS</Text>
      <View style={styles.participants}>
        <View style={styles.participant}><View style={styles.participantAvatar}><ProfileAvatar name="You" /></View><Text style={styles.participantName}>You</Text></View>
        <View style={styles.connection}><Animated.View style={[styles.connectionLine, {transform: [{scaleX: lineScale}]}]} /><Animated.View style={{opacity: waveOpacity, transform: [{scale: waveScale}]}}><Phone size={15} color="#B65BFF" /></Animated.View><Animated.View style={[styles.connectionLine, {transform: [{scaleX: lineScale}]}]} /></View>
        <View style={styles.participant}><View style={styles.participantAvatar}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /></View><Text numberOfLines={1} style={styles.participantName}>{name}</Text></View>
      </View>
    </View>

<View style={styles.safetyHint}><ShieldCheck size={14} color="#A978E6" /><Text style={styles.safetyText}>Private conversation - Be kind and stay respectful.</Text></View>
    {unavailable && <View style={styles.unavailableBlock}><View style={styles.unavailableNotice}>{findingOther && <ActivityIndicator size="small" color="#D071FF" />}<Text style={styles.unavailableText}>{findingOther ? 'Connecting with other MILO... Please wait.' : name + ' is busy now'}</Text></View>{findingOther && <View style={styles.matchTrack}><View style={[styles.matchProgress, {width: `${matchProgress}%`}]} /></View>}</View>}

    <View style={styles.controls}>
      <Pressable accessibilityRole="button" style={styles.control}><Mic size={21} color="#F0E8FC" /><Text style={styles.controlText}>Mic</Text></Pressable>
      <Pressable accessibilityRole="button" style={styles.control}><Volume2 size={21} color="#F0E8FC" /><Text style={styles.controlText}>Speaker</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={unavailable} onPress={() => setJoined(value => !value)} style={[styles.joinButton, unavailable && styles.joinDisabled]}><Gradient from="#D65CFF" to="#6822F1" radius={27} /><Phone size={21} color="#FFFFFF" fill="#FFFFFF" /><Text style={styles.joinText}>{joined ? 'Leave Room' : 'Join Room'}</Text></Pressable>
      <Pressable accessibilityRole="button" style={styles.control}><MoreHorizontal size={22} color="#F0E8FC" /><Text style={styles.controlText}>More</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#08091C', paddingHorizontal: 18},
  topGlow: {position: 'absolute', top: -105, left: -74, width: 250, height: 250, borderRadius: 140, backgroundColor: 'rgba(102, 43, 187, 0.34)'},
  sideGlow: {position: 'absolute', top: 128, right: -132, width: 278, height: 370, borderRadius: 160, backgroundColor: 'rgba(62, 28, 131, 0.23)'},
  header: {height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headerButton: {width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(31, 27, 67, 0.78)', borderWidth: 1, borderColor: '#393263', alignItems: 'center', justifyContent: 'center'},
  headerCopy: {alignItems: 'center'}, headerTitle: {fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#FFFFFF'},
  privateLine: {flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: -1}, privateText: {fontFamily: 'Poppins-Medium', fontSize: 9, color: '#AAA1C2'},
  hero: {alignItems: 'center', marginTop: 26}, avatarStage: {width: 158, height: 158, alignItems: 'center', justifyContent: 'center'},
  avatarFrame: {width: 112, height: 112, borderRadius: 56, padding: 4, overflow: 'visible'}, avatar: {flex: 1, borderRadius: 52, overflow: 'hidden'},
  onlineDot: {position: 'absolute', right: 4, bottom: 5, width: 19, height: 19, borderRadius: 10, backgroundColor: '#31EB98', borderWidth: 2, borderColor: '#24105D', alignItems: 'center', justifyContent: 'center'},
  name: {fontFamily: 'Poppins-SemiBold', fontSize: 22, color: '#FFFFFF', marginTop: 8}, callStatus: {fontFamily: 'Poppins-Regular', fontSize: 11, color: '#B4A8CD', marginTop: -2}, busyStatus: {color: '#FF92BF'},
  statusCard: {minHeight: 64, marginTop: 25, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(132, 91, 205, 0.62)', backgroundColor: 'rgba(35, 22, 74, 0.72)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center'},
  statusIcon: {width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(134, 58, 222, 0.22)', alignItems: 'center', justifyContent: 'center'}, statusCopy: {flex: 1, marginLeft: 10}, statusTitle: {fontFamily: 'Poppins-Medium', fontSize: 12, color: '#F7F2FF'}, statusSubtext: {fontFamily: 'Poppins-Regular', fontSize: 9, color: '#AFA4C8', marginTop: 1},
  statusDots: {flexDirection: 'row', gap: 4}, statusDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#CB71FF'}, statusDotDim: {opacity: 0.38},
  participantSection: {marginTop: 30, alignItems: 'center'}, sectionLabel: {fontFamily: 'Poppins-SemiBold', fontSize: 9, letterSpacing: 1.2, color: '#8E83A9'}, participants: {marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 19},
  participant: {width: 74, alignItems: 'center'}, participantAvatar: {width: 54, height: 54, borderRadius: 27, padding: 2, borderWidth: 1.5, borderColor: '#9250DD', overflow: 'hidden'}, participantName: {fontFamily: 'Poppins-Medium', fontSize: 10, color: '#F7F2FF', marginTop: 5, maxWidth: 74},
  connection: {width: 58, flexDirection: 'row', alignItems: 'center', gap: 4}, connectionLine: {height: 1, flex: 1, backgroundColor: '#5F3E91'},
  unavailableBlock: {marginTop: 10, alignItems: 'center'}, unavailableNotice: {height: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8}, unavailableText: {fontFamily: 'Poppins-Medium', fontSize: 11, color: '#D9C7EF'}, matchTrack: {width: 156, height: 6, marginTop: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(184, 158, 225, 0.2)'}, matchProgress: {height: '100%', borderRadius: 2, backgroundColor: '#FFFFFF'},
  safetyHint: {marginTop: 26, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: 'rgba(33, 27, 63, 0.62)'}, safetyText: {fontFamily: 'Poppins-Regular', fontSize: 9, color: '#B8AFCC'},
  controls: {position: 'absolute', left: 18, right: 18, bottom: 18, minHeight: 78, borderRadius: 20, borderWidth: 1, borderColor: '#38305D', backgroundColor: 'rgba(21, 18, 45, 0.94)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 5},
  control: {width: 52, alignItems: 'center', gap: 4}, controlText: {fontFamily: 'Poppins-Regular', fontSize: 8, color: '#D7CFE5'},
  joinButton: {height: 55, minWidth: 108, borderRadius: 28, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6}, joinDisabled: {opacity: 0.48}, joinText: {fontFamily: 'Poppins-SemiBold', fontSize: 11, color: '#FFFFFF'},
});
