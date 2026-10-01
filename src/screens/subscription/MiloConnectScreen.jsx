import React from 'react';
import {Image, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronRight, MapPin, ShieldCheck, Video} from 'lucide-react-native';

const features = [
  {label: 'Video Calls\n& Audio Calls', Icon: Video},
  {label: 'Verified\nProfiles', Icon: ShieldCheck},
  {label: 'Real People\nNearby', Icon: MapPin},
];

export default function MiloConnectScreen({navigation}) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#090021" />
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.skip}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.unlock}>Unlock</Text>
        <Text style={styles.title}>MILO <Text style={styles.titleAccent}>Connect</Text></Text>
        <Text style={styles.subtitle}>Meet real people, build genuine{`\n`}connections, All in your city.</Text>
        <Image source={require('../../../assets/images/miloconnect.png')} resizeMode="contain" style={styles.heroImage} />
        <View style={styles.featureRow}>
          {features.map(({label, Icon}) => (
            <View key={label} style={styles.feature}>
              <View style={styles.featureIcon}><Icon size={19} color="#C981FF" /></View>
              <Text style={styles.featureText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.startButton}>
        <Text style={styles.startText}>Get Started</Text>
        <ChevronRight size={20} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#090021', paddingHorizontal: 18},
  skip: {alignSelf: 'flex-end', paddingVertical: 9, paddingHorizontal: 5},
  skipText: {fontFamily: 'Poppins-Regular', color: '#D8C9F2', fontSize: 11},
  content: {flex: 1, alignItems: 'center', paddingTop: 5},
  unlock: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 18, lineHeight: 20},
  title: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 25, lineHeight: 28},
  titleAccent: {color: '#C84DFF'},
  subtitle: {fontFamily: 'Poppins-Regular', color: '#E4D8F4', fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 6},
  heroImage: {width: '112%', height: 330, marginTop: 1},
  featureRow: {width: '100%', flexDirection: 'row', justifyContent: 'space-around', marginTop: -18},
  feature: {width: '31%', alignItems: 'center'},
  featureIcon: {width: 39, height: 39, borderRadius: 20, borderWidth: 1, borderColor: '#9D4CDE', backgroundColor: 'rgba(87,27,150,0.25)', alignItems: 'center', justifyContent: 'center'},
  featureText: {fontFamily: 'Poppins-Medium', color: '#F3ECFF', fontSize: 9, lineHeight: 12, textAlign: 'center', marginTop: 7},
  startButton: {height: 51, marginBottom: 9, borderRadius: 26, backgroundColor: '#B547FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, shadowColor: '#C83FFF', shadowOpacity: 0.6, shadowRadius: 14, elevation: 8},
  startText: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14},
});