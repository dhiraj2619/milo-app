import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, StyleSheet, View} from 'react-native';

export default function BeatLoader({color = '#FFFFFF'}) {
  const beats = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let disposed = false;
    let animation;
    const configure = reduced => {
      if (disposed) { return; }
      animation?.stop();
      beats.forEach(beat => beat.setValue(0));
      if (reduced) { return; }
      animation = Animated.loop(Animated.stagger(140, beats.map(beat =>
        Animated.sequence([
          Animated.timing(beat, {toValue: 1, duration: 300, useNativeDriver: true}),
          Animated.timing(beat, {toValue: 0, duration: 300, useNativeDriver: true}),
        ]),
      )));
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(configure).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', configure);
    return () => { disposed = true; animation?.stop(); subscription.remove(); };
  }, [beats]);

  return (
    <View style={styles.row} accessible accessibilityRole="progressbar" accessibilityLabel="Loading">
      {beats.map((beat, index) => (
        <Animated.View key={index} style={[styles.dot, {
          backgroundColor: color,
          opacity: beat.interpolate({inputRange: [0, 1], outputRange: [0.5, 1]}),
          transform: [{scale: beat.interpolate({inputRange: [0, 1], outputRange: [0.75, 1.2]})}],
        }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 24},
  dot: {width: 10, height: 10, borderRadius: 5, marginHorizontal: 4},
});
