import React from 'react';
import {Image, Modal, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {ChevronRight, MapPin, ShieldCheck, Video, X} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const features = [
  {label: 'Video Calls\n& Audio Calls', Icon: Video},
  {label: 'Verified\nProfiles', Icon: ShieldCheck},
  {label: 'Real People\nNearby', Icon: MapPin},
];

export default function MiloConnectModal({visible, onClose}) {
  return (
    <Modal transparent animationType="slide" visible={visible} statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.65)" />
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <SafeAreaView style={styles.card} edges={['top', 'bottom', 'left', 'right']}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
            <X size={20} color="#E9DDF8" />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <View style={styles.content}>
            <Text style={styles.unlock}>Unlock</Text>
            <Text style={styles.title}>MILO <Text style={styles.titleAccent}>Connect</Text></Text>
            <Text style={styles.subtitle}>Meet real people, build genuine{`\n`}connections, all in your city.</Text>
            <Image source={require('../../../assets/images/miloconnect.png')} resizeMode="contain" style={styles.heroImage} />
            <View style={styles.featureRow}>
              {features.map(({label, Icon}) => <View key={label} style={styles.feature}><View style={styles.featureIcon}><Icon size={18} color="#C981FF" /></View><Text style={styles.featureText}>{label}</Text></View>)}
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.startButton}>
            <Text style={styles.startText}>Get Started</Text><ChevronRight size={20} color="#FFFFFF" />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', padding: 16},
  backdrop: {...StyleSheet.absoluteFillObject},
  card: {width: '92%', maxWidth: 360, height: '70%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#090021', paddingHorizontal: 16, borderWidth: 1, borderColor: '#7541BE'},
  close: {position: 'absolute', zIndex: 2, top: 14, left: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(99,57,148,0.36)', alignItems: 'center', justifyContent: 'center'},
  skip: {alignSelf: 'flex-end', paddingVertical: 7, paddingHorizontal: 5},
  skipText: {fontFamily: 'Poppins-Regular', color: '#D8C9F2', fontSize: 11},
  content: {alignItems: 'center', paddingTop: 0},
  unlock: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 15, lineHeight: 17},
  title: {fontFamily: 'Poppins-Bold', color: '#FFFFFF', fontSize: 22, lineHeight: 25},
  titleAccent: {color: '#C84DFF'},
  subtitle: {fontFamily: 'Poppins-Regular', color: '#E4D8F4', fontSize: 9, lineHeight: 12, textAlign: 'center', marginTop: 4},
  heroImage: {width: '104%', height: 205, marginTop: 2},
  featureRow: {width: '100%', flexDirection: 'row', justifyContent: 'space-around', marginTop: -3},
  feature: {width: '31%', alignItems: 'center'},
  featureIcon: {width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#9D4CDE', backgroundColor: 'rgba(87,27,150,0.25)', alignItems: 'center', justifyContent: 'center'},
  featureText: {fontFamily: 'Poppins-Medium', color: '#F3ECFF', fontSize: 8, lineHeight: 10, textAlign: 'center', marginTop: 5},
  startButton: {height: 45, marginTop: 18, marginBottom: 16, borderRadius: 23, backgroundColor: '#B547FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, shadowColor: '#C83FFF', shadowOpacity: 0.6, shadowRadius: 14, elevation: 8},
  startText: {fontFamily: 'Poppins-SemiBold', color: '#FFFFFF', fontSize: 14},
});