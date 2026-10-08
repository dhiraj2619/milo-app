import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, ChevronRight, Languages, Phone, Video } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileAvatar from '../../components/home/ProfileAvatar';

const FALLBACK_PEOPLE = [
  { _id: 'more-aanya', nickname: 'Aanya', age: 22, languages: ['Hindi', 'English'], avatarStyle: { avatarSeed: 'more-aanya', background: '#A8D0F5', gender: 'female', shirt: '#E56D9A' } },
  { _id: 'more-riya', nickname: 'Riya', age: 24, languages: ['Marathi', 'Hindi'], avatarStyle: { avatarSeed: 'more-riya', background: '#BFA9FF', gender: 'female', shirt: '#A58CF4', bun: true } },
  { _id: 'more-kiara', nickname: 'Kiara', age: 23, languages: ['English', 'Tamil'], avatarStyle: { avatarSeed: 'more-kiara', background: '#FFE3A3', gender: 'female', shirt: '#292338' } },
  { _id: 'more-kabir', nickname: 'Kabir', age: 25, languages: ['Hindi', 'Gujarati'], avatarStyle: { avatarSeed: 'more-kabir', background: '#A6D4FF', gender: 'male', shirt: '#4385B7', glasses: true } },
  { _id: 'more-meera', nickname: 'Meera', age: 21, languages: ['English', 'Bengali'], avatarStyle: { avatarSeed: 'more-meera', background: '#FFB2D3', gender: 'female', shirt: '#D96A9D' } },
  { _id: 'more-rohan', nickname: 'Rohan', age: 26, languages: ['Telugu', 'English'], avatarStyle: { avatarSeed: 'more-rohan', background: '#87C6FF', gender: 'male', shirt: '#568BC4', glasses: true } },
];

const LANGUAGE_LABELS = {
  Hindi: 'हिंदी',
  Marathi: 'मराठी',
  Bengali: 'বাংলা',
  Tamil: 'தமிழ்',
  Telugu: 'తెలుగు',
  Gujarati: 'ગુજરાતી',
  English: 'English',
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function PersonCard({ person, mode, onPress }) {
  const name = person.nickname || person.name || 'MILO member';
  const languages = person.languages?.slice(0, 2) || ['English'];
  const isVideo = mode === 'video';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${isVideo ? 'Video' : 'Audio'} call with ${name}`} onPress={() => onPress(person, mode)} style={styles.personCard}>
      <View style={styles.callModeBadge}>
        {isVideo ? <Video size={14} color="#FFFFFF" /> : <Phone size={14} color="#FFFFFF" />}
      </View>
      <View style={styles.avatarRing}>
        <ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} />
        <View style={styles.onlineDot} />
      </View>
      <Text numberOfLines={1} style={styles.personName}>{name} {person.age || ''}</Text>
      <View style={styles.languageRow}>
        <Languages size={12} color="#D2B4FF" />
        <Text numberOfLines={1} style={styles.languageText}>{languages.map(language => LANGUAGE_LABELS[language] || language).join(' · ')}</Text>
      </View>
      <View style={styles.viewProfile}><Text style={styles.viewProfileText}>{isVideo ? 'Video call' : 'Audio call'}</Text><ChevronRight size={14} color="#DCA8FF" /></View>
    </Pressable>
  );
}

function MarqueeRow({ people, reverse, onPress }) {
  const offset = useRef(new Animated.Value(0)).current;
  const distance = 184 * people.length;
  const track = [...people, ...people];
  useEffect(() => {
    offset.setValue(reverse ? -distance : 0);
    const animation = Animated.loop(Animated.timing(offset, {
      toValue: reverse ? 0 : -distance,
      duration: 22000,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [distance, offset, reverse]);
  return <View style={styles.marqueeViewport}><Animated.View style={[styles.marqueeTrack, { transform: [{ translateX: offset }] }]}>{track.map((person, index) => { const mode = index % 2 === 0 ? 'video' : 'audio'; return <PersonCard key={`${person._id || person.firebaseUid}-${index}`} person={person} mode={mode} onPress={onPress} />; })}</Animated.View></View>;
}

export default function MorePersonsScreen({ navigation, route }) {
  const people = useMemo(() => {
    const supplied = Array.isArray(route.params?.people) ? route.params.people : [];
    return shuffle(supplied.length ? supplied : FALLBACK_PEOPLE);
  }, [route.params?.people]);
  const firstRow = people.filter((_, index) => index % 2 === 0);
  const secondRow = people.filter((_, index) => index % 2 === 1);
  const rows = [firstRow.length ? firstRow : people, secondRow.length ? secondRow : people];
  const openPerson = (person, mode) => navigation.navigate(mode === 'video' ? 'VideoRoom' : 'AudioRoom', { person, availablePeople: people, callType: mode, isDemo: String(person._id || '').startsWith('demo-') });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#08051A" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.backButton}><ArrowLeft size={21} color="#F4EDFF" /></Pressable>
          <View><Text style={styles.headerTitle}>See more persons</Text><Text style={styles.headerSubtitle}>Find someone who speaks your language</Text></View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.intro}><Text style={styles.title}>Meet someone new.</Text><Text style={styles.copy}>Explore people from the MILO community and discover conversations that feel natural.</Text></View>
        <View style={styles.marqueeArea}><MarqueeRow people={rows[0]} onPress={openPerson} /><MarqueeRow people={rows[1]} reverse onPress={openPerson} /></View>
        <View style={styles.footerHint}><View style={styles.pulseDot} /><Text style={styles.footerHintText}>New people are joining MILO every day</Text></View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#08051A' },
  safeArea: { flex: 1 },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(180,130,255,0.16)' },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(145,83,224,0.24)' },
  headerTitle: { color: '#F9F4FF', fontSize: 18, fontWeight: '700', marginLeft: 13 },
  headerSubtitle: { color: '#9C91B3', fontSize: 11, marginLeft: 13, marginTop: 2 },
  headerSpacer: { flex: 1 },
  intro: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 22 },
  title: { color: '#F7EFFF', fontSize: 28, fontWeight: '800' },
  copy: { maxWidth: 310, color: '#ACA1C5', fontSize: 13, lineHeight: 20, marginTop: 8 },
  marqueeArea: { gap: 16, paddingVertical: 14 },
  marqueeViewport: { width: '100%', overflow: 'hidden' },
  marqueeTrack: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  personCard: { width: 172, minHeight: 206, borderRadius: 22, padding: 15, backgroundColor: '#11152A', borderWidth: 1, borderColor: 'rgba(173,113,255,0.3)' },
  callModeBadge: { position: 'absolute', top: 12, right: 12, width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C35D1', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', zIndex: 2 },
  avatarRing: { alignSelf: 'center', width: 88, height: 88, borderRadius: 44, padding: 3, backgroundColor: '#703BBD', position: 'relative' },
  onlineDot: { position: 'absolute', right: 2, bottom: 4, width: 13, height: 13, borderRadius: 7, backgroundColor: '#12D79B', borderWidth: 2, borderColor: '#11152A' },
  personName: { color: '#FAF7FF', textAlign: 'center', fontSize: 15, fontWeight: '700', marginTop: 12 },
  languageRow: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  languageText: { color: '#D2B4FF', fontSize: 11 },
  viewProfile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  viewProfileText: { color: '#C48BFF', fontSize: 11, fontWeight: '600' },
  footerHint: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 8, marginTop: 'auto', marginBottom: 20 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#18D6A1' },
  footerHintText: { color: '#9D92B4', fontSize: 11 },
});
