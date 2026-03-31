import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  color?: string;
  size?: number;
}

export default function ProfileIcon({ color = '#1B4332', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M5 20c0-4 3.5-7 7-7s7 3 7 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M11 11l2 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
