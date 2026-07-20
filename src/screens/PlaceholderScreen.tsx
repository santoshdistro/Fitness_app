import React from 'react';
import { Text, View } from 'react-native';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View className="flex-1 bg-[#EAECEF] items-center justify-center px-8">
      <Text className="text-lg font-bold text-gray-900 mb-2">{title}</Text>
      <Text className="text-sm text-gray-400 text-center">Coming soon.</Text>
    </View>
  );
}
