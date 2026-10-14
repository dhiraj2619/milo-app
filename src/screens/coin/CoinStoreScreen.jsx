import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft, Check, ChevronRight, Gift, Lock, MessageCircle, Phone, ShieldCheck, Sparkles, Ticket, Video } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyProfile } from '../../services/userService';
import { Gradient } from '../../components/home/HomeDecor';
import { useToast } from '../../components/ui/ToastProvider';

const packages = [
  { coins: 70, oldPrice: 49, price: 29 },
  { coins: 190, oldPrice: 99, price: 59 },
  { coins: 520, oldPrice: 199, price: 119, tag: 'POPULAR' },
  { coins: 1100, oldPrice: 399, price: 239 },
  { coins: 2600, oldPrice: 799, price: 479 },
  { coins: 5600, oldPrice: 1599, price: 959, tag: 'BEST VALUE' },
];
const COSTS = [
  { label: 'Audio', value: '15 /min', icon: Phone, color: '#5EE7FF' },
  { label: 'Video', value: '60 /min', icon: Video, color: '#D8B4FE' },
  { label: 'Chat', value: '10 /4 msgs', icon: MessageCircle, color: '#FF8AD8' },
];
const FEATURES = [
  { label: 'Calls', icon: Phone },
  { label: 'Chat', icon: MessageCircle },
  { label: 'Gifts', icon: Gift },
  { label: 'Special', icon: Sparkles },
];
const AUDIO_COINS_PER_MIN = 15;
const coinIcon = require('../../../assets/icons/coin.png');
const rupees = value => `₹${value.toLocaleString('en-IN')}`;
const discountOf = item => Math.round((1 - item.price / item.oldPrice) * 100);

function PackageCard({ item, selected, onPress }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${item.coins} coins for ${rupees(item.price)}`} onPress={() => onPress(item)} style={({ pressed }) => [styles.packageCard, selected && styles.packageCardSelected, pressed && styles.pressed]}>
    {selected && <Gradient from="#3A1782" to="#140A35" radius={16} />}
    {item.tag ? <View style={[styles.tag, item.tag === 'BEST VALUE' && styles.tagBest]}><Text style={styles.tagText}>{item.tag}</Text></View> : <View style={styles.tagSpacer} />}
    <View style={[styles.check, selected && styles.checkSelected]}>{selected && <Check size={11} color="#FFFFFF" strokeWidth={3} />}</View>
    <View style={styles.coinStack}>
      <Image source={coinIcon} style={styles.stackCoin} />
      <Image source={coinIcon} style={[styles.stackCoin, styles.stackCoinTop]} />
    </View>
    <Text style={styles.packageCoins}>{item.coins.toLocaleString('en-IN')}</Text>
    <Text style={styles.packageCoinsLabel}>coins</Text>
    <Text style={styles.price}>{rupees(item.price)}</Text>
    <View style={styles.priceLine}><Text style={styles.oldPrice}>{rupees(item.oldPrice)}</Text><Text style={styles.discount}>{discountOf(item)}% OFF</Text></View>
  </Pressable>;
}

export default function CoinStoreScreen({ navigation }) {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [selected, setSelected] = useState(packages[2]);
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => { getMyProfile().then(setProfile).catch(() => { }); }, []);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [float]);
  const applyCoupon = () => toast(`Coupon "${coupon.trim().toUpperCase()}" could not be applied yet. Coupons are coming soon.`);
  const pay = () => toast(`Payments are coming soon. You picked ${selected.coins} coins for ${rupees(selected.price)}.`);

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#080910" />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft size={20} color="#F5EEFF" /></Pressable>
      <Text style={styles.headerTitle}>Buy Coins</Text>
      <View style={styles.wallet}><Image source={coinIcon} style={styles.walletCoin} /><Text style={styles.walletText}>{(profile?.coinBalance ?? 0).toLocaleString('en-IN')}</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Gradient from="#5B21B6" to="#1A0A45" radius={22} glow />
        <View style={styles.heroOrb} />
        <View style={styles.heroCopy}>
          <Text style={styles.milo}>milo</Text>
          <Text style={styles.heroTitle}>Get More Coins</Text>
          <Text style={styles.heroSubtitle}>Unlock more fun, calls & chats!</Text>
          <View style={styles.heroFeatures}>{FEATURES.map(({ label, icon: Icon }) => <View key={label} style={styles.heroFeature}><Icon size={11} color="#F4E5FF" /><Text style={styles.heroFeatureText}>{label}</Text></View>)}</View>
        </View>
        <Animated.View style={[styles.heroCoinWrap, { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) }, { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) }] }]}>
          <View style={styles.heroCoinGlow} />
          <Image source={require('../../../assets/images/coin.png')} style={styles.heroCoin} resizeMode="contain" />
        </Animated.View>
        <Sparkles size={20} color="#FFE65E" fill="#FFE65E" style={styles.heroSparkle} />
      </View>

      <View style={styles.costs}>{COSTS.map(({ label, value, icon: Icon, color }) => <View key={label} style={styles.costTile}><Icon size={15} color={color} /><View><Text style={styles.costLabel}>{label}</Text><View style={styles.costValueRow}><Image source={coinIcon} style={styles.costCoin} /><Text style={styles.costValue}>{value}</Text></View></View></View>)}</View>

      <View style={styles.coupon}>
        <View style={styles.couponIcon}><Ticket size={16} color="#FFFFFF" /></View>
        <TextInput value={coupon} onChangeText={setCoupon} autoCapitalize="characters" placeholder="Enter coupon code" placeholderTextColor="#8E84A8" style={styles.couponInput} returnKeyType="done" onSubmitEditing={() => coupon.trim() && applyCoupon()} />
        <Pressable accessibilityRole="button" disabled={!coupon.trim()} onPress={applyCoupon} style={({ pressed }) => [styles.apply, !coupon.trim() && styles.applyDisabled, pressed && styles.pressed]}><Text style={styles.applyText}>Apply</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => toast('Coupons are coming soon')} style={styles.couponLink}><Gift size={13} color="#B57CFF" /><Text style={styles.couponLinkText}>View all coupons</Text><ChevronRight size={13} color="#B57CFF" /></Pressable>

      <View style={styles.packageHeader}><Text style={styles.packageTitle}>Coin Packages</Text><View style={styles.secure}><ShieldCheck size={13} color="#5EF2B5" /><Text style={styles.secureText}>100% Secure Payment</Text></View></View>
      <View accessibilityRole="radiogroup" style={styles.grid}>{packages.map(item => <PackageCard key={item.coins} item={item} selected={selected.coins === item.coins} onPress={setSelected} />)}</View>
    </ScrollView>

    <View style={styles.payBar}>
      <View style={styles.paySummary}>
        <View style={styles.paySummaryRow}><Image source={coinIcon} style={styles.payCoin} /><Text style={styles.payCoins}>{selected.coins.toLocaleString('en-IN')} coins</Text></View>
        <Text style={styles.payHint}>≈ {Math.floor(selected.coins / AUDIO_COINS_PER_MIN)} min of audio calls</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Pay ${rupees(selected.price)}`} onPress={pay} style={({ pressed }) => [styles.payButton, pressed && styles.pressed]}>
        <Gradient from="#C05BFF" to="#7025F0" radius={24} />
        <Lock size={15} color="#FFFFFF" />
        <Text style={styles.payButtonText}>Pay {rupees(selected.price)}</Text>
      </Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080910' },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(145,83,224,0.22)', borderWidth: 1, borderColor: 'rgba(196,181,253,0.18)' },
  headerTitle: { flex: 1, fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 19 },
  wallet: { height: 34, borderRadius: 17, paddingLeft: 6, paddingRight: 12, backgroundColor: '#19142E', borderWidth: 1, borderColor: '#4E3D74', flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletCoin: { width: 22, height: 22 },
  walletText: { fontFamily: 'Poppins-SemiBold', color: '#FFE16A', fontSize: 13 },
  hero: { minHeight: 150, borderRadius: 22, overflow: 'hidden', padding: 18, marginTop: 4, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(192,132,252,0.45)' },
  heroOrb: { position: 'absolute', right: -60, top: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(139,92,246,0.35)' },
  heroCopy: { flex: 1, minWidth: 0 },
  milo: { fontFamily: 'Poppins-Bold', color: '#F1E7FF', fontSize: 24, lineHeight: 28 },
  heroTitle: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 20, lineHeight: 26 },
  heroSubtitle: { fontFamily: 'Poppins-Regular', color: '#D7C5EF', fontSize: 12 },
  heroFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  heroFeature: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)' },
  heroFeatureText: { fontFamily: 'Poppins-Medium', color: '#F4E5FF', fontSize: 10 },
  heroCoinWrap: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  heroCoinGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,214,94,0.28)' },
  heroCoin: { width: 96, height: 96 },
  heroSparkle: { position: 'absolute', right: 14, top: 14 },
  costs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  costTile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 14, backgroundColor: '#12122A', borderWidth: 1, borderColor: '#25214A' },
  costLabel: { fontFamily: 'Poppins-Medium', color: '#E9E1F7', fontSize: 11 },
  costValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  costCoin: { width: 10, height: 10 },
  costValue: { fontFamily: 'Poppins-Regular', color: '#A9A0C0', fontSize: 9 },
  coupon: { marginTop: 14, height: 52, borderRadius: 16, borderWidth: 1, borderColor: '#3A2F70', backgroundColor: '#0F1130', flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 6 },
  couponIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#6639D6', alignItems: 'center', justifyContent: 'center' },
  couponInput: { flex: 1, color: '#FFFFFF', fontFamily: 'Poppins-Medium', fontSize: 13, paddingHorizontal: 10, paddingVertical: 0, letterSpacing: 0.5 },
  apply: { height: 38, minWidth: 78, borderRadius: 19, backgroundColor: '#7D38F2', alignItems: 'center', justifyContent: 'center' },
  applyDisabled: { opacity: 0.45 },
  applyText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 13 },
  couponLink: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingVertical: 4 },
  couponLinkText: { fontFamily: 'Poppins-Medium', color: '#B9AEDB', fontSize: 11 },
  packageHeader: { marginTop: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packageTitle: { fontFamily: 'Poppins-SemiBold', color: '#F7F1FF', fontSize: 17 },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secureText: { fontFamily: 'Poppins-Regular', color: '#B5ECD7', fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  packageCard: { width: '31.8%', paddingTop: 6, paddingBottom: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#2E2560', backgroundColor: '#111230', alignItems: 'center', overflow: 'hidden' },
  packageCardSelected: { borderColor: '#C084FC' },
  tag: { height: 16, paddingHorizontal: 7, borderRadius: 8, backgroundColor: '#E83FDD', justifyContent: 'center' },
  tagBest: { backgroundColor: '#F59E0B' },
  tagText: { fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 7, letterSpacing: 0.5 },
  tagSpacer: { height: 16 },
  check: { position: 'absolute', top: 7, right: 7, width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#4A3F7A', alignItems: 'center', justifyContent: 'center' },
  checkSelected: { backgroundColor: '#8944ED', borderColor: '#C084FC' },
  coinStack: { height: 42, width: 56, marginTop: 8 },
  stackCoin: { width: 36, height: 36, position: 'absolute', left: 4, bottom: 0 },
  stackCoinTop: { left: 17, bottom: 5 },
  packageCoins: { fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 17, lineHeight: 22, marginTop: 6 },
  packageCoinsLabel: { fontFamily: 'Poppins-Regular', color: '#A9A0C0', fontSize: 10, lineHeight: 13 },
  price: { fontFamily: 'Poppins-Bold', color: '#F1A7FF', fontSize: 15, marginTop: 6 },
  priceLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  oldPrice: { fontFamily: 'Poppins-Regular', color: '#8D84A3', textDecorationLine: 'line-through', fontSize: 10 },
  discount: { fontFamily: 'Poppins-SemiBold', color: '#5EF2B5', fontSize: 9 },
  payBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 12, marginBottom: 8, paddingVertical: 10, paddingLeft: 16, paddingRight: 10, borderRadius: 22, backgroundColor: 'rgba(20,16,44,0.97)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.5)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
  paySummary: { flex: 1, minWidth: 0 },
  paySummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payCoin: { width: 18, height: 18 },
  payCoins: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15 },
  payHint: { fontFamily: 'Poppins-Regular', color: '#A9A0C0', fontSize: 10, marginTop: 1 },
  payButton: { height: 48, paddingHorizontal: 22, borderRadius: 24, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 7 },
  payButtonText: { fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15 },
});
