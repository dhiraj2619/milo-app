import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, PhoneCall } from 'lucide-react-native';
import RecentCallRow from '../../components/calls/RecentCallRow';
import { useToast } from '../../components/ui/ToastProvider';
import { getMyCalls } from '../../services/userService';

// Full call history with call back, loaded a page at a time.
export default function RecentCallsScreen({ navigation }) {
  const toast = useToast();
  const [calls, setCalls] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFirst = useCallback(async () => {
    try {
      const data = await getMyCalls();
      setCalls(data.calls);
      setNextBefore(data.nextBefore);
    } catch {
      toast('Could not load your calls.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { loadFirst(); }, [loadFirst]));

  const refresh = async () => { setRefreshing(true); await loadFirst(); setRefreshing(false); };
  const loadMore = async () => {
    if (!nextBefore || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await getMyCalls({ before: nextBefore });
      setCalls(current => [...current, ...data.calls.filter(call => !current.some(item => item._id === call._id))]);
      setNextBefore(data.nextBefore);
    } catch {
      toast('Could not load older calls.');
    } finally {
      setLoadingMore(false);
    }
  };
  const call = (person, type) => navigation.navigate(type === 'video' ? 'VideoRoom' : 'AudioRoom', { person, callType: type });
  const open = person => navigation.navigate('UserProfile', { userId: person._id, person });

  return <SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" backgroundColor="#080910" />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft color="#FFF" /></Pressable>
      <Text style={styles.title}>Recent calls</Text>
      <View style={styles.back} />
    </View>
    <FlatList
      data={calls}
      keyExtractor={item => String(item._id)}
      renderItem={({ item }) => <RecentCallRow call={item} onCall={call} onOpen={open} />}
      contentContainerStyle={styles.list}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#B254FF" colors={['#B254FF']} progressBackgroundColor="#1A1433" />}
      ListEmptyComponent={loading ? <ActivityIndicator style={styles.loader} size="large" color="#B254FF" /> : <View style={styles.empty}>
        <View style={styles.emptyIcon}><PhoneCall size={28} color="#B776FF" /></View>
        <Text style={styles.emptyTitle}>No calls yet</Text>
        <Text style={styles.emptyText}>Your calls will show up here, so you can call people back.</Text>
      </View>}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color="#B254FF" /> : null}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080910' },
  header: { height: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFF', fontFamily: 'Poppins-SemiBold', fontSize: 18 },
  list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 30 },
  loader: { marginTop: 80 },
  footer: { marginVertical: 16 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 30 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1D1438', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#F3ECFB', fontFamily: 'Poppins-SemiBold', fontSize: 16, marginTop: 14 },
  emptyText: { color: '#AAA4B9', fontFamily: 'Poppins-Regular', fontSize: 13, textAlign: 'center', marginTop: 6 },
});
