import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export function Gradient({
  from = '#BD57FF',
  to = '#6327F1',
  radius = 16,
  glow = false,
}) {
  const id = useId();
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      width="100%"
      height="100%"
    >
      <Defs>
        <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
        <RadialGradient id={id + 'glow'} cx="98%" cy="0%" rx="80%" ry="100%">
          <Stop offset="0" stopColor="#FF69B8" stopOpacity="0.7" />
          <Stop offset="1" stopColor="#FF69B8" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
      {glow && (
        <Rect width="100%" height="100%" rx={radius} fill={`url(#${id}glow)`} />
      )}
    </Svg>
  );
}
export function Coin({ size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle
        cx="20"
        cy="20"
        r="18"
        fill="#F4A015"
        stroke="#FFE78C"
        strokeWidth="2"
      />
      <Circle
        cx="20"
        cy="20"
        r="14"
        fill="#FFCB39"
        stroke="#FFED94"
        strokeWidth="1.5"
      />
      <Path
        d="M15 10V30M20 9V31M25 10V30M11 16H29M11 23H29"
        stroke="#FFE893"
        strokeWidth="1.7"
        opacity="0.85"
      />
      <Path
        d="M10 12Q20 3 30 13"
        fill="none"
        stroke="#FFF6C0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
export function Gift() {
  return (
    <Svg width="86" height="78" viewBox="0 0 100 90">
      <Defs>
        <LinearGradient id="giftBox" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C471FF" />
          <Stop offset="1" stopColor="#7525E4" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="50" cy="80" rx="35" ry="7" fill="#210D49" opacity="0.45" />
      <Path d="M25 36L56 29L80 41V77L49 87L25 72Z" fill="url(#giftBox)" />
      <Path d="M49 48L80 39V77L49 87Z" fill="#6123CD" />
      <Path d="M20 29L55 20L86 33L49 45Z" fill="#D89FFF" />
      <Path d="M20 29V41L49 56V45Z" fill="#B457FF" />
      <Path d="M49 45L86 33V45L49 56Z" fill="#8534E9" />
      <Path d="M37 25L66 39V81L57 84V43L28 29Z" fill="#FFC75A" />
      <Path d="M69 26L36 39V78L44 83V44L77 30Z" fill="#FFE388" />
      <Path
        d="M51 24C22 27 29 3 41 10C48 14 50 20 51 24ZM51 24C47 4 65 1 67 11C69 20 57 24 51 24Z"
        fill="none"
        stroke="#FFD76C"
        strokeWidth="7"
      />
      <Circle
        cx="14"
        cy="71"
        r="10"
        fill="#FFBD29"
        stroke="#FFE89D"
        strokeWidth="2"
      />
      <Path d="M14 65V77" stroke="#FFE794" strokeWidth="3" />
      <Circle
        cx="89"
        cy="66"
        r="8"
        fill="#FFA51C"
        stroke="#FFE18A"
        strokeWidth="2"
      />
      <Path
        d="M13 25V35M8 30H18M85 12V20M81 16H89"
        stroke="#FFD568"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
