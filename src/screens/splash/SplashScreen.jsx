import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, StatusBar, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const SplashScreen = ({onFinish}) => {
  const insets = useSafeAreaInsets();
  const heartbeat = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let disposed = false;
    let animations = [];
    const setMotion = reduced => {
      animations.forEach(animation => animation.stop());
      heartbeat.setValue(0);
      drift.setValue(0);
      if (reduced || disposed) { return; }
      animations = [
        Animated.loop(Animated.sequence([
          Animated.timing(heartbeat, {toValue: 1, duration: 320, useNativeDriver: true}),
          Animated.timing(heartbeat, {toValue: 0, duration: 420, useNativeDriver: true}),
          Animated.delay(650),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(drift, {toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
          Animated.timing(drift, {toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        ])),
      ];
      animations.forEach(animation => animation.start());
    };
    AccessibilityInfo.isReduceMotionEnabled().then(setMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setMotion);
    const timer = setTimeout(onFinish, 3400);
    return () => {
      disposed = true;
      clearTimeout(timer);
      subscription.remove();
      animations.forEach(animation => animation.stop());
    };
  }, [drift, heartbeat, onFinish]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="glow" cx="95%" cy="27%" rx="85%" ry="45%">
              <Stop offset="0" stopColor="#391345" stopOpacity="0.75" />
              <Stop offset="1" stopColor="#080810" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="lowerGlow" cx="12%" cy="74%" rx="90%" ry="30%">
              <Stop offset="0" stopColor="#372593" stopOpacity="0.42" />
              <Stop offset="1" stopColor="#080810" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="backWave" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#685EFF" /><Stop offset="0.48" stopColor="#412995" /><Stop offset="1" stopColor="#4A155F" />
            </LinearGradient>
            <LinearGradient id="frontWave" x1="0" y1="1" x2="0.85" y2="0">
              <Stop offset="0" stopColor="#815FFF" /><Stop offset="0.35" stopColor="#754CF3" /><Stop offset="0.7" stopColor="#6326CB" /><Stop offset="1" stopColor="#39144C" />
            </LinearGradient>
            <LinearGradient id="edge" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#B7A2FF" /><Stop offset="0.6" stopColor="#9461FF" /><Stop offset="1" stopColor="#6C2C95" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect width="390" height="844" fill="#080810" />
          <Rect width="390" height="844" fill="url(#glow)" />
          <Rect width="390" height="844" fill="url(#lowerGlow)" />
          <Path d="M0 546 C76 594 135 615 227 558 C302 510 327 477 390 452 L390 500 C300 526 256 596 171 621 C94 645 39 607 0 607Z" fill="url(#backWave)" />
          <Path d="M0 607 C112 625 208 569 298 587 C336 593 364 607 390 618 L390 590 C300 568 238 603 161 614 C87 624 33 602 0 594Z" fill="#302369" opacity="0.85" />
          <Path d="M0 601 C90 623 177 584 243 538 C305 494 338 493 390 486 L390 508 C321 502 274 552 216 588 C137 637 63 657 0 635Z" fill="url(#frontWave)" />
          <Path d="M0 601 C90 623 177 584 243 538 C305 494 338 493 390 486" fill="none" stroke="url(#edge)" strokeWidth="1.5" />
        </Svg>
        <Animated.View style={[styles.bubbles, {transform: [{translateY: drift.interpolate({inputRange: [0, 1], outputRange: [0, -18]})}]}]}>
          <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none">
            <Defs>
              <RadialGradient id="bubble"><Stop offset="0" stopColor="#8542BB" stopOpacity="0.55" /><Stop offset="0.7" stopColor="#7634B0" stopOpacity="0.4" /><Stop offset="1" stopColor="#7634B0" stopOpacity="0" /></RadialGradient>
              <LinearGradient id="largeBubble" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#39305C" stopOpacity="0.6" /><Stop offset="1" stopColor="#211336" stopOpacity="0.1" /></LinearGradient>
            </Defs>
            <Circle cx="196" cy="210" r="39" fill="url(#bubble)" />
            <Circle cx="83" cy="300" r="79" fill="url(#largeBubble)" />
            <Circle cx="12" cy="180" r="49" fill="url(#largeBubble)" opacity="0.18" />
          </Svg>
        </Animated.View>
      </View>
      <View style={styles.brand} accessible accessibilityLabel="Milo. Meet. Talk. Connect.">
        <View style={styles.wordmark}>
          <Svg width="260" height="88" viewBox="0 0 260 88">
            <Defs><LinearGradient id="logo" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFF7FF" /><Stop offset="0.46" stopColor="#F5D9FF" /><Stop offset="1" stopColor="#BF78F1" /></LinearGradient></Defs>
            <Path d="M15 70 V18 L43 49 L71 18 V70 M103 37 V70 M139 18 V70 H174 M218 17 C181 17 181 71 218 71 C255 71 255 17 218 17" fill="none" stroke="url(#logo)" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Animated.View style={[styles.heart, {transform: [{scale: heartbeat.interpolate({inputRange: [0, 1], outputRange: [1, 1.16]})}]}]}>
            <Svg width="36" height="36" viewBox="0 0 32 32"><Path d="M16 28 C13 25 3 18 3 10 C3 2 13 1 16 8 C19 1 29 2 29 10 C29 18 19 25 16 28Z" fill="#FF3980" /></Svg>
          </Animated.View>
        </View>
        <Text style={styles.tagline}>Meet. Talk. Connect.</Text>
      </View>
      <View style={[styles.footer, {bottom: Math.max(insets.bottom, 20) + 28}]}>
        <Text style={styles.footerText}>Real People</Text>
        <Text style={styles.footerText}>Real Conversations</Text>
        <View style={styles.indicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#080810'},
  bubbles: {...StyleSheet.absoluteFillObject},
  brand: {position: 'absolute', top: '38%', alignItems: 'center', width: '100%'},
  wordmark: {width: 260, height: 88},
  heart: {position: 'absolute', left: 85, top: -24},
  tagline: {fontFamily: 'Poppins-Regular', fontSize: 15, color: '#E0D7E8', marginTop: 9},
  footer: {position: 'absolute', alignItems: 'center', width: '100%'},
  footerText: {fontFamily: 'Poppins-Regular', fontSize: 15, lineHeight: 24, color: '#EBE2F8'},
  indicator: {width: 66, height: 4, borderRadius: 2, backgroundColor: '#9962FF', marginTop: 23},
});

export default SplashScreen;
