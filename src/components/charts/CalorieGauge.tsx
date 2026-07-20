import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { gaugeArcPath } from '../../utils/svgPath';

type Props = {
  percent: number;
  valueLabel: string;
  unitLabel?: string;
};

export function CalorieGauge({ percent, valueLabel, unitLabel = 'kcal' }: Props) {
  return (
    <View className="items-center justify-center mt-2 pt-2">
      <Svg width={176} height={96} viewBox="0 0 100 50">
        <Path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#F1F3F5"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <Path
          d={gaugeArcPath(percent)}
          fill="none"
          stroke="#1E293B"
          strokeWidth={8}
          strokeLinecap="round"
        />
      </Svg>
      <View className="absolute bottom-1 items-center">
        <Text className="text-base font-extrabold text-gray-900">
          {valueLabel} <Text className="text-xs text-gray-500 font-semibold">{unitLabel}</Text>
        </Text>
      </View>
    </View>
  );
}
