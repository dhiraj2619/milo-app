import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  ArrowLeft, BadgeCheck, Check, ChevronRight, Coins, Crown, Eye, Languages, MapPin, MessageCircle,
  PhoneCall, RefreshCw, Rocket, ShieldCheck, Sparkles, TrendingUp, Zap,
} from 'lucide-react-native';
import {Gradient} from '../../components/home/HomeDecor';
import {useToast} from '../../components/ui/ToastProvider';
import {getMySubscription, getSubscriptionPlans} from '../../services/subscriptionService';

// Labels for the feature flags on SubscriptionPlan.features, in display order.
const FEATURES = [
  {key: 'nearbyUsers', label: 'Discover people nearby', Icon: MapPin},
  {key: 'priorityConnect', label: 'Priority connect', Icon: Zap},
  {key: 'fasterConnectMatching', label: 'Faster matching', Icon: Rocket},
  {key: 'extraCallRequests', label: 'Extra call requests', Icon: PhoneCall},
  {key: 'higherCallChatPriority', label: 'Higher call & chat priority', Icon: MessageCircle},
  {key: 'profileVisibilityBoost', label: 'Profile visibility boost', Icon: Eye},
  {key: 'profilePriority', label: 'Priority profile placement', Icon: TrendingUp},
  {key: 'dailyProfileBoost', label: 'Daily profile boost', Icon: Rocket},
  {key: 'premiumBadge', label: 'Premium badge on your profile', Icon: BadgeCheck},
  {key: 'languageFiltersAdvanced', label: 'Advanced language filters', Icon: Languages},
  {key: 'languageFiltersBasic', label: 'Language filters', Icon: Languages},
  {key: 'exclusiveAvatarStyles', label: 'Exclusive avatar styles', Icon: Sparkles},
];

const rupees = (amount, currency = 'INR') => {
  const value = Number(amount) || 0;
  const formatted = value.toLocaleString('en-IN', {maximumFractionDigits: value % 1 ? 2 : 0});
  return currency === 'INR' ? `₹${formatted}` : `${currency} ${formatted}`;
};

const durationLabel = days => {
  if (days % 365 === 0) return days === 365 ? '1 year' : `${days / 365} years`;
  if (days >= 28 && Math.round(days / 30) * 30 === days) return days === 30 ? '1 month' : `${days / 30} months`;
  if (days % 7 === 0) return days === 7 ? '1 week' : `${days / 7} weeks`;
  return days === 1 ? '1 day' : `${days} days`;
};

const perDay = plan => (Number(plan.price?.amount) || 0) / Math.max(1, plan.durationDays);
// A per-month price is easier to compare for long plans; short plans show a per-day price.
const unitPrice = plan => plan.durationDays >= 60
  ? `${rupees(Math.round(perDay(plan) * 30), plan.price?.currency)}/month`
  : `${rupees(Math.round(perDay(plan) * 10) / 10, plan.price?.currency)}/day`;

const featureList = plan => {
  const flags = plan.features || {};
  const list = FEATURES.filter(item => flags[item.key] && !(item.key === 'languageFiltersBasic' && flags.languageFiltersAdvanced));
  if (flags.dailyBonusCoins && plan.bonusCoins?.daily) list.unshift({key: 'daily', label: `${plan.bonusCoins.daily} bonus coins every day`, Icon: Coins});
  if (flags.monthlyBonusCoins && plan.bonusCoins?.monthly) list.unshift({key: 'monthly', label: `${plan.bonusCoins.monthly} bonus coins every month`, Icon: Coins});
  return list;
};

function PlanCard({plan, selected, savings, onPress}) {
  const trial = plan.planType === 'trial';
  const free = !(Number(plan.price?.amount) > 0);
  return <Pressable accessibilityRole="radio" accessibilityState={{checked: selected}} accessibilityLabel={`${plan.name}, ${durationLabel(plan.durationDays)}, ${free ? 'free' : rupees(plan.price?.amount, plan.price?.currency)}`} onPress={() => onPress(plan)} style={({pressed}) => [styles.plan, selected && styles.planSelected, pressed && styles.pressed]}>
    {selected && <Gradient from="#3A1772" to="#1A0B3B" radius={20} opacity={0.9} />}
    {plan.isPopular && <View style={styles.popular}><Crown size={11} color="#2A1500" /><Text style={styles.popularText}>MOST POPULAR</Text></View>}
    <View style={styles.planRow}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Check size={13} color="#FFF" strokeWidth={3} />}</View>
      <View style={styles.planInfo}>
        <View style={styles.planTitleRow}>
          <Text style={styles.planName} numberOfLines={1}>{plan.name}</Text>
          {trial && <View style={styles.trialTag}><Text style={styles.trialText}>TRIAL</Text></View>}
        </View>
        <Text style={styles.planDuration}>{durationLabel(plan.durationDays)}{!free && ` · ${unitPrice(plan)}`}</Text>
      </View>
      <View style={styles.priceBox}>
        <Text style={styles.price}>{free ? 'Free' : rupees(plan.price?.amount, plan.price?.currency)}</Text>
        {savings >= 5 && <View style={styles.saveTag}><Text style={styles.saveText}>SAVE {savings}%</Text></View>}
      </View>
    </View>
    {!!plan.shortDescription && <Text style={styles.planDescription}>{plan.shortDescription}</Text>}
  </Pressable>;
}

export default function MiloConnectPlansScreen({navigation}) {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, subscription] = await Promise.all([getSubscriptionPlans(), getMySubscription().catch(() => null)]);
      setPlans(list);
      setCurrent(subscription);
      setSelectedId(id => (list.some(plan => plan._id === id) ? id : (list.find(plan => plan.isPopular) || list[0])?._id ?? null));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load plans. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const selected = plans.find(plan => plan._id === selectedId) || null;
  const highestPerDay = useMemo(() => Math.max(0, ...plans.map(perDay)), [plans]);
  const savingsFor = plan => (highestPerDay > 0 && perDay(plan) > 0 ? Math.round((1 - perDay(plan) / highestPerDay) * 100) : 0);
  const features = selected ? featureList(selected) : [];
  const currentPlanName = current?.plan?.name;
  const currentEnds = current?.endsAt ? new Date(current.endsAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}) : '';

  const subscribe = () => {
    if (!selected) return;
    toast(`Payments are coming soon. You picked ${selected.name} for ${rupees(selected.price?.amount, selected.price?.currency)}.`);
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
    <StatusBar barStyle="light-content" backgroundColor="#090021" />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft size={21} color="#F5EEFF" /></Pressable>
      <Text style={styles.headerTitle}>MILO <Text style={styles.accent}>Connect</Text></Text>
      <View style={styles.back} />
    </View>

    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Gradient from="#C84DFF" to="#6327F1" radius={22} glow /><Crown size={26} color="#FFF" /></View>
        <Text style={styles.heroTitle}>Choose your plan</Text>
        <Text style={styles.heroCopy}>Unlock Nearby, priority matching and more. Meet real people in your city.</Text>
      </View>

      {!!currentPlanName && <View style={styles.currentCard}><ShieldCheck size={18} color="#7CF0B5" /><Text style={styles.currentText}>You are on <Text style={styles.currentStrong}>{currentPlanName}</Text>{currentEnds ? ` until ${currentEnds}` : ''}.</Text></View>}

      {loading && <View style={styles.state}><ActivityIndicator color="#C77CFF" /><Text style={styles.stateText}>Loading plans…</Text></View>}
      {!loading && !!error && <View style={styles.state}><Text style={styles.stateError}>{error}</Text><Pressable accessibilityRole="button" onPress={load} style={styles.retry}><RefreshCw size={15} color="#E4C4FF" /><Text style={styles.retryText}>Try again</Text></Pressable></View>}
      {!loading && !error && !plans.length && <View style={styles.state}><Text style={styles.stateText}>No plans are available right now. Please check back soon.</Text></View>}

      {!loading && !error && plans.length > 0 && <>
        <View accessibilityRole="radiogroup" style={styles.plans}>
          {plans.map(plan => <PlanCard key={plan._id} plan={plan} selected={plan._id === selectedId} savings={savingsFor(plan)} onPress={item => setSelectedId(item._id)} />)}
        </View>

        {features.length > 0 && <View style={styles.included}>
          <Text style={styles.includedTitle}>Included in {selected.name}</Text>
          {features.map(({key, label, Icon}) => <View key={key} style={styles.featureRow}><View style={styles.featureIcon}><Icon size={16} color="#D29BFF" /></View><Text style={styles.featureText}>{label}</Text><Check size={16} color="#7CF0B5" strokeWidth={3} /></View>)}
        </View>}
        {!!selected?.detailedDescription && <Text style={styles.details}>{selected.detailedDescription}</Text>}
      </>}
    </ScrollView>

    {!loading && !error && selected && <View style={styles.footer}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Continue with ${selected.name}`} onPress={subscribe} style={({pressed}) => [styles.cta, pressed && styles.pressed]}>
        <Gradient from="#C84DFF" to="#7B2CF5" radius={27} glow />
        <Text style={styles.ctaText}>{Number(selected.price?.amount) > 0 ? `Continue · ${rupees(selected.price?.amount, selected.price?.currency)}` : 'Start free trial'}</Text>
        <ChevronRight size={20} color="#FFF" />
      </Pressable>
      <Text style={styles.footnote}>Valid for {durationLabel(selected.durationDays)} · Secure payment</Text>
    </View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#090021'},
  header: {height: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  back: {width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 18},
  accent: {color: '#C84DFF'},
  content: {paddingHorizontal: 18, paddingBottom: 28},
  hero: {alignItems: 'center', paddingTop: 6, paddingBottom: 18},
  heroIcon: {width: 56, height: 56, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'visible'},
  heroTitle: {color: '#FFF', fontFamily: 'Poppins-Bold', fontSize: 24, marginTop: 14},
  heroCopy: {color: '#CFC3E2', fontFamily: 'Poppins-Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4, maxWidth: 300},
  currentCard: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: '#2C6B52', backgroundColor: '#0F2A22', padding: 12, marginBottom: 14},
  currentText: {flex: 1, color: '#D5F7E6', fontFamily: 'Poppins-Regular', fontSize: 12.5},
  currentStrong: {fontFamily: 'Poppins-SemiBold', color: '#FFF'},
  state: {alignItems: 'center', paddingVertical: 40, gap: 12},
  stateText: {color: '#CFC3E2', fontFamily: 'Poppins-Regular', fontSize: 13, textAlign: 'center'},
  stateError: {color: '#FF9AAF', fontFamily: 'Poppins-Regular', fontSize: 13, textAlign: 'center'},
  retry: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#5B3F8C'},
  retryText: {color: '#E4C4FF', fontFamily: 'Poppins-Medium', fontSize: 13},
  plans: {gap: 12},
  plan: {borderRadius: 20, borderWidth: 1.5, borderColor: '#2E2348', backgroundColor: '#130A2C', padding: 16, overflow: 'hidden'},
  planSelected: {borderColor: '#B45CFF'},
  pressed: {opacity: 0.86},
  popular: {position: 'absolute', top: 0, right: 18, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFC94D', paddingHorizontal: 9, paddingVertical: 3, borderBottomLeftRadius: 8, borderBottomRightRadius: 8},
  popularText: {color: '#2A1500', fontFamily: 'Poppins-Bold', fontSize: 9, letterSpacing: 0.5},
  planRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4},
  radio: {width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#6A5A88', alignItems: 'center', justifyContent: 'center'},
  radioOn: {backgroundColor: '#A84DFF', borderColor: '#A84DFF'},
  planInfo: {flex: 1},
  planTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  planName: {color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 16, flexShrink: 1},
  trialTag: {backgroundColor: '#1D4A3A', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1},
  trialText: {color: '#7CF0B5', fontFamily: 'Poppins-SemiBold', fontSize: 9},
  planDuration: {color: '#BEB2D3', fontFamily: 'Poppins-Regular', fontSize: 12, marginTop: 1},
  priceBox: {alignItems: 'flex-end'},
  price: {color: '#FFF', fontFamily: 'Poppins-Bold', fontSize: 20},
  saveTag: {marginTop: 3, backgroundColor: '#123D2E', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1},
  saveText: {color: '#7CF0B5', fontFamily: 'Poppins-SemiBold', fontSize: 9.5},
  planDescription: {color: '#D9CDEB', fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 17, marginTop: 10, marginLeft: 34},
  included: {marginTop: 22, borderRadius: 20, borderWidth: 1, borderColor: '#2E2348', backgroundColor: '#100826', padding: 16},
  includedTitle: {color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 15, marginBottom: 6},
  featureRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8},
  featureIcon: {width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(132,64,220,0.22)', alignItems: 'center', justifyContent: 'center'},
  featureText: {flex: 1, color: '#EDE5F8', fontFamily: 'Poppins-Regular', fontSize: 13},
  details: {color: '#AFA3C4', fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 18, marginTop: 14},
  footer: {paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#1E1438', backgroundColor: '#090021'},
  cta: {height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#C83FFF', shadowOpacity: 0.6, shadowRadius: 14, elevation: 8},
  ctaText: {color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 15},
  footnote: {color: '#9D91B3', fontFamily: 'Poppins-Regular', fontSize: 11, textAlign: 'center', marginTop: 7},
});
