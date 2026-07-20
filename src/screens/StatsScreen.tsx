import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Activity } from 'lucide-react-native';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { useLatestMeasurement } from '../hooks/useLatestMeasurement';
import { CalorieGauge } from '../components/charts/CalorieGauge';
import { WeightSparkline } from '../components/charts/WeightSparkline';

const REFERENCE_CALORIE_TARGET = 2000;

export function StatsScreen() {
  const { totals, loading: nutritionLoading, refresh: refreshNutrition } =
    useTodayNutrition();
  const { logs: weightLogs, loading: weightLoading, refresh: refreshWeight } =
    useRecentDailyLogs(14);
  const {
    measurement,
    loading: measurementLoading,
    refresh: refreshMeasurement,
  } = useLatestMeasurement();

  const refreshing = nutritionLoading || weightLoading || measurementLoading;
  const onRefresh = () => {
    refreshNutrition();
    refreshWeight();
    refreshMeasurement();
  };

  const weightValues = weightLogs
    .map(l => l.weight)
    .filter((w): w is number => w != null);
  const latestWeight = weightValues[weightValues.length - 1];

  return (
    <ScrollView
      className="flex-1 bg-[#EAECEF]"
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="items-center mt-2">
        <Text className="text-sm font-bold text-gray-800 tracking-wide">Statistics</Text>
      </View>

      {/* Calories */}
      <View className="mt-4 bg-white rounded-[2rem] p-5 border border-gray-100/50 gap-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-indigo-50 items-center justify-center">
              <Activity size={16} color="#4f46e5" />
            </View>
            <View>
              <Text className="text-sm font-semibold text-gray-800">Calories</Text>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Logged today
              </Text>
            </View>
          </View>
          <Text className="text-sm font-bold text-gray-900">
            {Math.round(totals.calories)} <Text className="text-xs text-gray-400 font-semibold">kcal</Text>
          </Text>
        </View>

        <View className="flex-row gap-2">
          <MacroTile label="Carbs" value={`${Math.round(totals.carbs_g)}g`} />
          <MacroTile label="Protein" value={`${Math.round(totals.protein_g)}g`} />
          <MacroTile label="Fats" value={`${Math.round(totals.fat_g)}g`} />
        </View>

        <CalorieGauge
          percent={totals.calories / REFERENCE_CALORIE_TARGET}
          valueLabel={String(Math.max(0, REFERENCE_CALORIE_TARGET - Math.round(totals.calories)))}
        />
        <Text className="text-center text-[10px] text-gray-400 -mt-2">
          vs {REFERENCE_CALORIE_TARGET} kcal reference &middot; personalized target coming soon
        </Text>
      </View>

      {/* Weight */}
      <View className="mt-4 bg-[#FFE8E2] rounded-[2rem] p-5 gap-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
            <Activity size={16} color="#ea580c" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-orange-950">Weight</Text>
            <Text className="text-[10px] text-orange-700 font-medium">
              {weightValues.length >= 2
                ? `${weightValues[0]}kg -> ${latestWeight}kg over last ${weightValues.length} entries`
                : 'Log your weight to start a trend'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-end mt-4 justify-between h-16">
          <Text className="text-5xl font-black text-orange-950 tracking-tighter">
            {latestWeight ?? '--'}
          </Text>
          {weightValues.length >= 2 ? (
            <WeightSparkline values={weightValues} />
          ) : null}
        </View>
      </View>

      {/* Body fat */}
      <View className="mt-4 bg-[#F2EBFC] rounded-[2rem] p-4 flex-row items-center gap-3">
        <View className="w-8 h-8 rounded-full bg-white items-center justify-center">
          <Activity size={16} color="#9333ea" />
        </View>
        <View>
          <Text className="text-xs font-semibold text-purple-950">Body Fat</Text>
          <Text className="text-[10px] text-purple-700">
            {measurement?.calculated_body_fat != null
              ? `${measurement.calculated_body_fat.toFixed(1)}% - U.S. Navy method`
              : 'No measurements logged yet'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function MacroTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-gray-50/60 p-2.5 rounded-2xl items-center border border-gray-50">
      <Text className="text-xs font-bold text-gray-900">{value}</Text>
      <Text className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
