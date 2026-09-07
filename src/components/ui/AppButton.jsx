import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export default function AppButton({
  title,
  onPress,
  disabled,
  loading,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: !!disabled || !!loading,
        busy: !!loading,
      }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        (pressed || disabled || loading) && styles.dim,
      ]}
    >
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="button" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0" stopColor="#7635F5" />
            <Stop offset="1" stopColor="#A04CFF" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx="28" fill="url(#button)" />
      </Svg>
      <View pointerEvents="none" style={styles.content}>
      {loading ? (
        <ActivityIndicator animating color="#FFFFFF" size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    borderRadius: 28,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',

  },
  content: { width: '100%', paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: 'Poppins-Medium', fontSize: 16, color: '#FFFFFF' },
  dim: { opacity: 0.6 },
});


