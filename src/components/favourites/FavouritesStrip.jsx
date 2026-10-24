import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Heart, Phone} from 'lucide-react-native';
import ProfileAvatar from '../home/ProfileAvatar';
import {getFavourites, setFavourite} from '../../services/userService';
import {getSocket} from '../../services/socketService';

const nameOf = person => person?.nickname || person?.name || 'MILO member';

// "Your favourites" row for Home and Connect: people saved after a call, with live online status.
// Tap to call; long-press to remove. Renders nothing until the user has a favourite.
export default function FavouritesStrip({onCall, style}) {
  const [favourites, setFavourites] = useState([]);

  // Reload whenever the screen comes back into view, e.g. after favouriting someone at the end of a call.
  useFocusEffect(useCallback(() => {
    let active = true;
    getFavourites().then(list => active && setFavourites(list)).catch(() => {});
    return () => { active = false; };
  }, []));

  useEffect(() => {
    const socket = getSocket();
    const onPresence = ({firebaseUid, isOnline}) => setFavourites(current => {
      if (!current.some(person => person.firebaseUid === firebaseUid)) return current;
      const updated = current.map(person => person.firebaseUid === firebaseUid ? {...person, isOnline} : person);
      return [...updated.filter(person => person.isOnline), ...updated.filter(person => !person.isOnline)];
    });
    socket.on('user:presence', onPresence);
    return () => socket.off('user:presence', onPresence);
  }, []);

  const remove = person => Alert.alert('Remove from favourites?', `${nameOf(person)} will no longer appear here.`, [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Remove', style: 'destructive', onPress: () => {
      setFavourites(current => current.filter(item => item._id !== person._id));
      setFavourite(person._id, false).catch(() => setFavourites(current => [person, ...current]));
    }},
  ]);

  if (!favourites.length) return null;
  const onlineCount = favourites.filter(person => person.isOnline).length;
  return <View style={style}>
    <View style={styles.heading}>
      <Heart size={16} color="#FF6FA8" fill="#FF6FA8" />
      <Text style={styles.title}>Your favourites</Text>
      <Text style={styles.count}>{onlineCount ? `${onlineCount} online` : 'All away'}</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {favourites.map(person => {
        const name = nameOf(person);
        return <Pressable key={person._id} accessibilityRole="button" accessibilityLabel={`Call ${name}`} accessibilityHint="Long press to remove from favourites"
          onPress={() => onCall(person)} onLongPress={() => remove(person)} style={({pressed}) => [styles.item, pressed && styles.pressed]}>
          <View style={[styles.avatar, person.isOnline && styles.avatarOnline]}>
            <View style={styles.avatarClip}><ProfileAvatar {...(person.avatarStyle || person)} name={name} photoUrl={person.photoUrl} /></View>
            <View style={[styles.dot, !person.isOnline && styles.dotAway]} />
            <View style={styles.callBadge}><Phone size={10} color="#FFF" fill="#FFF" /></View>
          </View>
          <Text numberOfLines={1} style={styles.name}>{name}</Text>
          <Text style={[styles.status, !person.isOnline && styles.statusAway]}>{person.isOnline ? 'Online' : 'Away'}</Text>
        </Pressable>;
      })}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  heading: {flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10},
  title: {color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 17},
  count: {marginLeft: 'auto', color: '#21E6A1', fontFamily: 'Poppins-Medium', fontSize: 11},
  row: {gap: 14, paddingRight: 8},
  item: {width: 66, alignItems: 'center'},
  pressed: {opacity: 0.7},
  avatar: {width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#3A304F', padding: 2},
  avatarOnline: {borderColor: '#21E6A1'},
  avatarClip: {flex: 1, borderRadius: 28, overflow: 'hidden', backgroundColor: '#25104B'},
  dot: {position: 'absolute', left: 2, bottom: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#21E6A1', borderWidth: 2, borderColor: '#0B0D20'},
  dotAway: {backgroundColor: '#6B6478'},
  callBadge: {position: 'absolute', right: -3, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#8B40EE', borderWidth: 2, borderColor: '#0B0D20', alignItems: 'center', justifyContent: 'center'},
  name: {color: '#F2EAFE', fontFamily: 'Poppins-Medium', fontSize: 11.5, marginTop: 6, maxWidth: 66},
  status: {color: '#21E6A1', fontFamily: 'Poppins-Regular', fontSize: 10},
  statusAway: {color: '#8E879C'},
});
