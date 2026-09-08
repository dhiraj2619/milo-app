import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, BackHandler, Easing, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Defs, LinearGradient, Path, RadialGradient, Stop} from 'react-native-svg';
import AppButton from '../../components/ui/AppButton';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function ProfileSuccessScreen({navigation}) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const stroke = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    let disposed = false;
    let animation;
    const animate = reduced => {
      if (disposed) {return;}
      animation?.stop();
      scale.setValue(reduced ? 1 : 0.7);
      stroke.setValue(reduced ? 0 : 100);
      if (reduced) {return;}
      animation = Animated.parallel([
        Animated.spring(scale, {toValue: 1, friction: 5, tension: 65, useNativeDriver: true}),
        Animated.sequence([
          Animated.delay(250),
          Animated.timing(stroke, {toValue: 0, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false}),
        ]),
      ]);
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(animate).catch(() => animate(true));
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', animate);
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.getParent()?.reset({index: 0, routes: [{name: 'Main'}]});
      return true;
    });
    return () => {disposed = true; animation?.stop(); motion.remove(); back.remove();};
  }, [navigation, scale, stroke]);

  const continueToHome = () => navigation.getParent()?.reset({index: 0, routes: [{name: 'Main'}]});

  return <SafeAreaView style={styles.screen}>
    <StatusBar barStyle="light-content" />
    <View style={styles.body}>
      <View style={styles.center}>
        <Animated.View style={[styles.artwork, {transform: [{scale}]}]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Svg width="260" height="260" viewBox="0 0 260 260">
            <Defs>
              <RadialGradient id="successGlow"><Stop offset="0" stopColor="#9042F7" stopOpacity="0.4" /><Stop offset="1" stopColor="#9042F7" stopOpacity="0" /></RadialGradient>
              <LinearGradient id="successCircle" x1="0%" y1="100%" x2="100%" y2="0%"><Stop offset="0" stopColor="#7025DF" /><Stop offset="1" stopColor="#B571FF" /></LinearGradient>
            </Defs>
            <Circle cx="130" cy="130" r="130" fill="url(#successGlow)" />
            <Circle cx="130" cy="130" r="96" fill="none" stroke="#633B92" strokeOpacity="0.45" />
            <Circle cx="130" cy="130" r="75" fill="url(#successCircle)" />
            <Circle cx="48" cy="62" r="4" fill="#BB8FFF" /><Circle cx="219" cy="153" r="4" fill="#9854EA" /><Circle cx="74" cy="221" r="3" fill="#BA8DFF" />
            <Path d="M207 62V76M200 69H214" stroke="#B47AFF" strokeWidth="3" strokeLinecap="round" />
            <AnimatedPath d="M96 130L119 153L164 108" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100 100" strokeDashoffset={stroke} />
          </Svg>
        </Animated.View>
        <Text accessibilityRole="header" style={styles.heading}>Profile created{'\n'}successfully!</Text>
        <Text style={styles.description}>You’re all set! Meet new people,{'\n'}make friends, and start connecting.</Text>
      </View>
      <AppButton title="Let’s get started" onPress={continueToHome} style={styles.button} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#09080F'},
  body: {flex: 1, paddingHorizontal: 24, width: '100%', maxWidth: 480, alignSelf: 'center'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  artwork: {width: 260, height: 260, marginBottom: 12},
  heading: {fontFamily: 'Poppins-SemiBold', color: '#FAF7FF', fontSize: 29, lineHeight: 39, textAlign: 'center'},
  description: {fontFamily: 'Poppins-Regular', color: '#BEB5CD', fontSize: 14, lineHeight: 23, textAlign: 'center', marginTop: 18},
  button: {marginTop: 24, marginBottom: 22},
});
