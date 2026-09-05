import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, Easing, Image, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, Defs, RadialGradient, Stop} from 'react-native-svg';

const profiles = [
  {left: '2%', top: 207, size: 44, id: 47, initials: 'AK'},
  {left: '13%', top: 128, size: 65, id: 44, initials: 'RS'},
  {left: '42%', top: 62, size: 72, id: 49, initials: 'PM'},
  {left: '73%', top: 97, size: 65, id: 45, initials: 'SJ'},
];
export default function ProfileBubbles() {
  const values = useRef(profiles.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    let disposed = false;
    let animation;
    const configureMotion = reduced => {
      if (disposed) { return; }
      animation?.stop();
      values.forEach(value => value.setValue(reduced ? 1 : 0));
      if (reduced) { return; }
      animation = Animated.loop(Animated.stagger(600, values.map(value => Animated.sequence([
        Animated.timing(value, {toValue: 1, duration: 1900, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.delay(1900),
        Animated.timing(value, {toValue: 2, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]))));
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(configureMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', configureMotion);
    return () => { disposed = true; animation?.stop(); subscription.remove(); };
  }, [values]);
  return <View style={styles.scene} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width="100%" height="100%" viewBox="0 0 350 320" preserveAspectRatio="none">
      <Defs><RadialGradient id="planet" cx="48%" cy="0%" rx="75%" ry="85%"><Stop offset="0" stopColor="#7752F8" /><Stop offset="0.28" stopColor="#322070" /><Stop offset="0.65" stopColor="#19122D" /><Stop offset="1" stopColor="#171021" /></RadialGradient></Defs>
      <Circle cx="175" cy="191" r="184" fill="url(#planet)" />
      <Circle cx="48" cy="2" r="2" fill="#7B55DE" opacity="0.5" /><Circle cx="287" cy="19" r="1.5" fill="#7B55DE" opacity="0.45" />
    </Svg>
    {profiles.map((profile, index) => <Animated.View key={profile.id} style={[styles.bubble, {
      left: profile.left, top: profile.top, width: profile.size, height: profile.size, borderRadius: profile.size / 2,
      opacity: values[index].interpolate({inputRange: [0, 0.25, 1, 1.7, 2], outputRange: [0, 1, 1, 1, 0]}),
      transform: [{translateY: values[index].interpolate({inputRange: [0, 1, 2], outputRange: [170, 0, -65]})}, {scale: values[index].interpolate({inputRange: [0, 1, 2], outputRange: [0.65, 1, 0.95]})}],
    }]}>
      <Text style={styles.initials}>{profile.initials}</Text>
      <Image source={{uri: 'https://i.pravatar.cc/160?img=' + profile.id}} style={styles.portrait} />
    </Animated.View>)}
    <View style={styles.caption}><Text style={styles.captionText}>Join a fun community{'\n'}across India</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  scene: {height: 300, width: '100%', maxWidth: 420, alignSelf: 'center'},
  bubble: {position: 'absolute', backgroundColor: '#6B477A', borderWidth: 2, borderColor: '#BC9ADD', alignItems: 'center', justifyContent: 'center', shadowColor: '#B77BFF', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: {width: 0, height: 0}, elevation: 8},
  portrait: {position: 'absolute', width: '100%', height: '100%', borderRadius: 100},
  initials: {color: '#FFFFFF', fontFamily: 'Poppins-Medium'},
  caption: {position: 'absolute', top: 208, left: '29%', right: '6%', borderWidth: 1, borderColor: '#8051D1', borderRadius: 24, backgroundColor: '#281B43', paddingHorizontal: 18, paddingVertical: 12},
  captionText: {color: '#EEE5FF', fontFamily: 'Poppins-Regular', fontSize: 13, lineHeight: 19},
});

