import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
export default function ProfileAvatar({
  background,
  hair = '#302024',
  shirt = '#D4B9EC',
  glasses,
}) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="48" fill={background} />
      <Path
        d="M17 91Q11 71 21 41Q22 8 50 9Q81 7 81 44Q94 77 85 96Z"
        fill={hair}
      />
      <Path d="M17 100Q18 77 40 75H60Q83 79 84 100" fill={shirt} />
      <Path d="M41 66H59V80Q50 90 41 80Z" fill="#F4BE99" />
      <Ellipse cx="50" cy="48" rx="25" ry="31" fill="#F4BE99" />
      <Path
        d="M23 46Q18 12 50 13Q83 11 77 49Q65 32 61 24Q43 44 23 46Z"
        fill={hair}
      />
      <Ellipse cx="40" cy="49" rx="2.2" ry="2.8" fill="#302024" />
      <Ellipse cx="60" cy="49" rx="2.2" ry="2.8" fill="#302024" />
      <Path
        d="M35 43Q40 40 44 43M56 43Q61 40 65 43"
        stroke={hair}
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M49 52L47 59H51"
        stroke="#CD9179"
        strokeWidth="1.4"
        fill="none"
      />
      <Path
        d="M43 65Q50 71 57 65"
        stroke="#A94F5E"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {glasses && (
        <>
          <Rect
            x="29"
            y="43"
            width="18"
            height="14"
            rx="6"
            fill="none"
            stroke="#382E40"
            strokeWidth="2.5"
          />
          <Rect
            x="53"
            y="43"
            width="18"
            height="14"
            rx="6"
            fill="none"
            stroke="#382E40"
            strokeWidth="2.5"
          />
          <Path d="M47 48H53" stroke="#382E40" strokeWidth="2" />
        </>
      )}
    </Svg>
  );
}
