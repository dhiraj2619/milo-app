import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Animated, Easing, Image, Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {Plus, X} from 'lucide-react-native';
import {getProfileOptions} from '../../services/userService';

const COIN = require('../../../assets/icons/coin.png');
const MESSAGES = {
  insufficient_coins: 'You don’t have enough coins for this gift.',
  not_in_call: 'Gifts can be sent once the call is connected.',
  network: 'Couldn’t send the gift. Check your internet and try again.',
};

export function useGiftCatalog() {
  const [gifts, setGifts] = useState(null);
  useEffect(() => {
    let active = true;
    getProfileOptions().then(options => active && setGifts(options.gifts || [])).catch(() => active && setGifts([]));
    return () => { active = false; };
  }, []);
  return gifts;
}

// Bottom sheet to pick and send a gift. `onSend(gift)` resolves to the server's answer.
export function GiftSheet({visible, onClose, peerName, balance, onSend, onGetCoins}) {
  const gifts = useGiftCatalog();
  const [sending, setSending] = useState(null);
  const [error, setError] = useState('');

  const send = async gift => {
    if (sending) return;
    setError('');
    if (typeof balance === 'number' && gift.coins > balance) return setError(MESSAGES.insufficient_coins);
    setSending(gift.id);
    const result = await onSend(gift);
    setSending(null);
    if (result.ok) onClose();
    else setError(MESSAGES[result.reason] || 'Couldn’t send the gift. Please try again.');
  };

  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Send {peerName} a gift</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose}><X size={20} color="#C9C2D6" /></Pressable>
        </View>
        <View style={styles.balanceRow}>
          <Image source={COIN} style={styles.coin} />
          <Text style={styles.balance}>{typeof balance === 'number' ? balance : '—'} coins</Text>
          <Pressable accessibilityRole="button" onPress={onGetCoins} style={styles.topUp}><Plus size={13} color="#F2DEFF" /><Text style={styles.topUpText}>Get coins</Text></Pressable>
        </View>
        {!gifts ? <ActivityIndicator style={styles.loading} color="#B254FF" /> : (
          <View style={styles.grid}>{gifts.map(gift => {
            const short = typeof balance === 'number' && gift.coins > balance;
            return <Pressable key={gift.id} accessibilityRole="button" accessibilityLabel={`Send ${gift.name} for ${gift.coins} coins`} disabled={!!sending}
              onPress={() => send(gift)} style={({pressed}) => [styles.gift, short && styles.giftShort, pressed && styles.pressed]}>
              {sending === gift.id ? <ActivityIndicator color="#E4C4FF" style={styles.giftSpinner} /> : <Text style={styles.giftEmoji}>{gift.emoji}</Text>}
              <Text style={styles.giftName}>{gift.name}</Text>
              <View style={styles.priceRow}><Image source={COIN} style={styles.priceCoin} /><Text style={styles.price}>{gift.coins}</Text></View>
            </Pressable>;
          })}</View>
        )}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.note}>{peerName} sees an animation and keeps the gift on their profile.</Text>
      </Pressable>
    </Pressable>
  </Modal>;
}

// Full-screen animation for the latest gift. `event` is {key, giftId, fromMe, fromName}; a new key replays it.
export function GiftBurst({event, peerName}) {
  const gifts = useGiftCatalog();
  const progress = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!event) return undefined;
    setShown(event);
    progress.setValue(0);
    const animation = Animated.timing(progress, {toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: true});
    animation.start(({finished}) => finished && setShown(null));
    return () => animation.stop();
  }, [event, progress]);

  const gift = shown && gifts?.find(item => item.id === shown.giftId);
  if (!gift) return null;
  const scale = progress.interpolate({inputRange: [0, 0.18, 0.3, 1], outputRange: [0.2, 1.35, 1.1, 1.2]});
  const translateY = progress.interpolate({inputRange: [0, 0.3, 1], outputRange: [60, 0, -120]});
  const opacity = progress.interpolate({inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0]});
  const text = shown.fromMe ? `You sent ${peerName} a ${gift.name}` : `${shown.fromName || peerName} sent you a ${gift.name}`;
  return <View pointerEvents="none" style={styles.burst}>
    <Animated.Text style={[styles.burstEmoji, {opacity, transform: [{translateY}, {scale}]}]}>{gift.emoji}</Animated.Text>
    <Animated.View style={[styles.burstBanner, {opacity}]}><Text style={styles.burstText}>{text}</Text></Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#140A2E', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28, borderTopWidth: 1, borderColor: 'rgba(168,85,247,0.4)'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  title: {color: '#FFFFFF', fontSize: 17, fontWeight: '700', flexShrink: 1},
  balanceRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginBottom: 14},
  coin: {width: 18, height: 18},
  balance: {color: '#FFE160', fontSize: 14, fontWeight: '700'},
  topUp: {marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: 'rgba(168,85,247,0.3)'},
  topUpText: {color: '#F2DEFF', fontSize: 12, fontWeight: '600'},
  loading: {marginVertical: 40},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  gift: {width: '22.5%', alignItems: 'center', paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(123,92,172,0.18)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.14)'},
  giftShort: {opacity: 0.45},
  pressed: {transform: [{scale: 0.94}]},
  giftEmoji: {fontSize: 32, lineHeight: 40},
  giftSpinner: {height: 40},
  giftName: {color: '#EDE9FE', fontSize: 11, fontWeight: '600', marginTop: 2},
  priceRow: {flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3},
  priceCoin: {width: 12, height: 12},
  price: {color: '#FFE160', fontSize: 11, fontWeight: '700'},
  error: {color: '#FF9AAF', fontSize: 13, marginTop: 12},
  note: {color: '#9D93B3', fontSize: 11, marginTop: 12, textAlign: 'center'},
  burst: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 20},
  burstEmoji: {fontSize: 120, lineHeight: 140},
  burstBanner: {position: 'absolute', top: '62%', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(18,4,54,0.85)', borderWidth: 1, borderColor: 'rgba(233,213,255,0.35)'},
  burstText: {color: '#FFFFFF', fontSize: 14, fontWeight: '700'},
});
