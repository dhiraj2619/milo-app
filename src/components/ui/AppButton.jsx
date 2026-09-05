import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

export default function AppButton({title, onPress, disabled, loading, style}) {
  return <Pressable accessibilityRole="button" accessibilityState={{disabled: !!disabled || !!loading, busy: !!loading}} disabled={disabled || loading} onPress={onPress} style={({pressed}) => [styles.button, style, (pressed || disabled || loading) && styles.dim]}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%"><Defs><LinearGradient id="button" x1="0%" y1="100%" x2="100%" y2="0%"><Stop offset="0" stopColor="#7635F5" /><Stop offset="1" stopColor="#A04CFF" /></LinearGradient></Defs><Rect width="100%" height="100%" rx="28" fill="url(#button)" /></Svg>
    {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.text}>{title}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({button: {minHeight: 60, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24}, text: {fontFamily: 'Poppins-Medium', fontSize: 16, color: '#FFFFFF'}, dim: {opacity: 0.6}});
