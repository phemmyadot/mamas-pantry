import * as React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface IconProps {
  color?: string;
  size?: number;
}

export default function DeliveryIcon({ color = '#1B4332', size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="12" height="10" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M14 11h4l2 2v3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm16 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" fill={color} />
      <Path d="M4 16v-7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 9V6H21V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
