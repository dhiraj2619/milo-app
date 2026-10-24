import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle, Phone, Video } from 'lucide-react-native';
import ProfileAvatar from '../../components/home/ProfileAvatar';
import { InterestChips, PromptCard } from '../../components/profile/Interests';
import { useToast } from '../../components/ui/ToastProvider';
import { getMyProfile, getProfileOptions, getPublicProfile, setFavourite } from '../../services/userService';

const nameOf = person => person?.nickname || person?.name || 'MILO member';

// Another member's profile. route.params: {userId, person?}; `person` (from a list) shows instantly
// while the full profile loads. Loading it counts as a profile view for them.
export default function UserProfileScreen({ navigation, route }) {
  const toast = useToast();
  const userId = route.params?.userId || route.params?.person?._id;
  const [person, setPerson] = useState(route.params?.person || null);
  const [me, setMe] = useState(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    let active = true;
    getPublicProfile(userId)
      .then(data => { if (active) { setPerson(data.user); setLiked(data.isFavourite); } })
      .catch(error => active && toast(error.response?.data?.message || 'Could not load this profile.'))
      .finally(() => active && setLoading(false));
    getMyProfile().then(profile => active && setMe(profile)).catch(() => { });
    getProfileOptions().then(options => active && setGifts(options.gifts || [])).catch(() => { });
    return () => { active = false; };
  }, [toast, userId]);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setFavourite(userId, next)
      .then(result => { if (next) toast(result.mutual ? `💜 It's a match! You and ${nameOf(person)} like each other.` : `You liked ${nameOf(person)}`); })
      .catch(() => { setLiked(!next); toast('Could not save. Please try again.'); });
  };
  const call = type => navigation.navigate(type === 'video' ? 'VideoRoom' : 'AudioRoom', { person, currentUser: me, callType: type });
  const chat = () => navigation.navigate('ChatConversation', { person });

  const online = person?.isOnline === true;
  const receivedGifts = gifts.filter(gift => person?.giftCounts?.[gift.id]);
  return <SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" backgroundColor="#09080F" />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft color="#FFF" /></Pressable>
      <Text style={styles.headerTitle}>Profile</Text>
      <View style={styles.back} />
    </View>
    {!person ? <View style={styles.loading}><ActivityIndicator size="large" color="#B254FF" /></View> : (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.photo, online && styles.photoOnline]}>
          <ProfileAvatar {...(person.avatarStyle || person)} name={nameOf(person)} photoUrl={person.photoUrl} />
        </View>
        <Text style={styles.name}>{nameOf(person)}</Text>
        <Text style={[styles.status, !online && styles.statusAway]}>{online ? '● Online now' : '● Away'}</Text>
        {person.languages?.length > 0 && <Text style={styles.languages}>Speaks {person.languages.join(', ')}</Text>}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Audio call ${nameOf(person)}`} onPress={() => call('audio')} style={({ pressed }) => [styles.action, styles.actionPrimary, pressed && styles.pressed]}><Phone size={18} color="#FFF" fill="#FFF" /><Text style={styles.actionText}>Audio</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Video call ${nameOf(person)}`} onPress={() => call('video')} style={({ pressed }) => [styles.action, styles.actionPrimary, pressed && styles.pressed]}><Video size={19} color="#FFF" fill="#FFF" /><Text style={styles.actionText}>Video</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Chat with ${nameOf(person)}`} onPress={chat} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><MessageCircle size={18} color="#E9D5FF" /><Text style={styles.actionText}>Chat</Text></Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: liked }} disabled={loading} onPress={toggleLike} style={({ pressed }) => [styles.like, liked && styles.likeOn, pressed && styles.pressed]}>
          <Heart size={19} color={liked ? '#FF6FA8' : '#FFF'} fill={liked ? '#FF6FA8' : 'none'} />
          <Text style={styles.likeText}>{liked ? 'Liked · in your favourites' : 'Like'}</Text>
        </Pressable>

        {person.interests?.length > 0 && <View style={styles.section}><Text style={styles.sectionTitle}>Interests</Text><InterestChips interests={person.interests} highlight={me?.interests || []} /></View>}
        {person.prompts?.length > 0 && <View style={styles.section}>{person.prompts.map(prompt => <View key={prompt.question} style={styles.prompt}><PromptCard prompt={prompt} /></View>)}</View>}
        {person.giftsReceived > 0 && <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎁 {person.giftsReceived} gift{person.giftsReceived === 1 ? '' : 's'} received</Text>
          <View style={styles.giftRow}>{receivedGifts.map(gift => <Text key={gift.id} style={styles.gift}>{gift.emoji} ×{person.giftCounts[gift.id]}</Text>)}</View>
        </View>}
      </ScrollView>
    )}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09080F' },
  header: { height: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingTop: 10, paddingBottom: 40, alignItems: 'center' },
  photo: { width: 150, height: 150, borderRadius: 75, overflow: 'hidden', borderWidth: 3, borderColor: '#A95CFF', backgroundColor: '#211933' },
  photoOnline: { borderColor: '#21E6A1' },
  name: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 26, marginTop: 16 },
  status: { color: '#5EF2B5', fontFamily: 'Poppins-Medium', fontSize: 13, marginTop: 2 },
  statusAway: { color: '#F5C542' },
  languages: { color: '#BDB5CB', fontFamily: 'Poppins-Regular', fontSize: 13, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 22 },
  action: { flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(233,213,255,0.3)' },
  actionPrimary: { backgroundColor: '#A855F7', borderColor: '#A855F7' },
  actionText: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 14 },
  like: { alignSelf: 'stretch', marginTop: 10, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,111,168,0.5)' },
  likeOn: { backgroundColor: 'rgba(255,111,168,0.14)', borderColor: '#FF6FA8' },
  likeText: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 14 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  section: { alignSelf: 'stretch', marginTop: 26 },
  sectionTitle: { color: '#F7F2FD', fontFamily: 'Poppins-SemiBold', fontSize: 16, marginBottom: 10 },
  prompt: { marginBottom: 10 },
  giftRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gift: { color: '#D8C7F5', fontFamily: 'Poppins-Medium', fontSize: 16 },
});
