import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video} from 'lucide-react-native';
import ProfileAvatar from '../home/ProfileAvatar';
import {ROOMS_BY_KEY} from '../../config/rooms';

// outcome comes from the server (GET /users/me/calls), already from this user's side.
const OUTCOMES = {
  answered: {label: direction => (direction === 'incoming' ? 'Incoming' : 'Outgoing'), color: '#5EF2B5'},
  missed: {label: () => 'Missed call', color: '#FF7894'},
  no_answer: {label: () => 'No answer', color: '#F5C542'},
  declined: {label: () => 'Declined', color: '#FF7894'},
  declined_by_you: {label: () => 'You declined', color: '#B9B1C5'},
  cancelled: {label: () => 'Cancelled', color: '#B9B1C5'},
  failed: {label: () => 'Didn’t connect', color: '#B9B1C5'},
};

const ago = date => {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'});
};
const duration = seconds => (seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`);

// One call in "Recent": who, how it went, when; tap the person for their profile, the button to call back.
export default function RecentCallRow({call, onCall, onOpen}) {
  const person = call.person;
  const name = person?.nickname || 'Deleted user';
  const outcome = OUTCOMES[call.outcome] || OUTCOMES.failed;
  const Icon = call.outcome === 'missed' ? PhoneMissed : call.direction === 'incoming' ? PhoneIncoming : PhoneOutgoing;
  const details = [
    call.callType === 'video' ? 'Video' : 'Audio',
    call.outcome === 'answered' && call.durationSeconds ? duration(call.durationSeconds) : null,
    call.source ? ROOMS_BY_KEY[call.source]?.title : null,
    ago(call.startedAt),
  ].filter(Boolean).join(' · ');

  return <View style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${name}'s profile`} disabled={!person} onPress={() => onOpen(person)} style={styles.open}>
      <View style={styles.avatar}>
        <View style={styles.avatarClip}><ProfileAvatar {...(person?.avatarStyle || person || {})} name={name} photoUrl={person?.photoUrl} /></View>
        {person?.isOnline && <View style={styles.dot} />}
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.name, call.outcome === 'missed' && styles.nameMissed]}>{name}</Text>
        <View style={styles.outcomeRow}><Icon size={13} color={outcome.color} /><Text style={[styles.outcome, {color: outcome.color}]}>{outcome.label(call.direction)}</Text></View>
        <Text numberOfLines={1} style={styles.details}>{details}</Text>
      </View>
    </Pressable>
    {!!person && <Pressable accessibilityRole="button" accessibilityLabel={`Call ${name} back`} hitSlop={6} onPress={() => onCall(person, call.callType)} style={({pressed}) => [styles.callBack, pressed && styles.pressed]}>
      {call.callType === 'video' ? <Video size={18} color="#FFF" fill="#FFF" /> : <Phone size={17} color="#FFF" fill="#FFF" />}
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 10, borderRadius: 20, backgroundColor: '#14132A', borderWidth: 1, borderColor: '#2A2545'},
  open: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0},
  avatar: {width: 48, height: 48},
  avatarClip: {flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#25104B'},
  dot: {position: 'absolute', right: 0, bottom: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: '#21E6A1', borderWidth: 2, borderColor: '#14132A'},
  copy: {flex: 1, minWidth: 0},
  name: {fontFamily: 'Poppins-SemiBold', color: '#F7F2FF', fontSize: 15},
  nameMissed: {color: '#FF9AAF'},
  outcomeRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1},
  outcome: {fontFamily: 'Poppins-Medium', fontSize: 12},
  details: {fontFamily: 'Poppins-Regular', color: '#9D96AE', fontSize: 11, marginTop: 1},
  callBack: {width: 42, height: 42, borderRadius: 21, backgroundColor: '#8B40EE', alignItems: 'center', justifyContent: 'center'},
  pressed: {opacity: 0.8, transform: [{scale: 0.95}]},
});
