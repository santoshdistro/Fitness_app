import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, ChevronDown, ChevronRight } from 'lucide-react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTodayLog } from '../hooks/useTodayLog';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { SleepBarChart } from '../components/charts/SleepBarChart';

function formatSleepDuration(hours: number | null): string {
  if (!hours) return '--';
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${String(wholeHours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

function shortDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: '2-digit' });
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { log: todayLog, loading: todayLoading, refresh: refreshToday } = useTodayLog();
  const { logs: recentLogs, loading: recentLoading, refresh: refreshRecent } =
    useRecentDailyLogs(6);

  const refreshing = todayLoading || recentLoading;
  const onRefresh = () => {
    refreshToday();
    refreshRecent();
  };

  const waterLiters = todayLog?.water_ml ? (todayLog.water_ml / 1000).toFixed(2) : '--';
  const sleepEntries = recentLogs.map(entry => ({
    label: shortDayLabel(entry.log_date),
    hours: entry.sleep_hours,
  }));
  const latestSleepHours = recentLogs[recentLogs.length - 1]?.sleep_hours ?? null;

  return (
    <ScrollView
      className="flex-1 bg-[#EAECEF]"
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="flex-row items-center justify-between mt-2">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-full bg-[#E5BA73] items-center justify-center border-2 border-white">
            <Text className="font-bold text-white text-sm">U</Text>
          </View>
          <View className="flex-row items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-gray-100">
            <Text className="text-xs font-medium text-gray-800">Today</Text>
            <ChevronDown size={14} color="#6b7280" />
          </View>
        </View>
        <View className="w-10 h-10 rounded-full bg-white border border-gray-100 items-center justify-center">
          <Bell size={16} color="#374151" />
        </View>
      </View>

      <View className="mt-6 flex-row justify-between items-center">
        <View className="gap-5">
          <View>
            <Text className="text-2xl font-bold tracking-tight text-gray-900">
              {todayLog?.steps ?? '--'}
            </Text>
            <Text className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
              Steps
            </Text>
          </View>
          <View>
            <Text className="text-2xl font-bold tracking-tight text-gray-900">
              {waterLiters}
            </Text>
            <Text className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
              Water (L)
            </Text>
          </View>
          <View>
            <Text className="text-2xl font-bold tracking-tight text-gray-900">
              {todayLog?.active_calories_burned ?? '--'}
            </Text>
            <Text className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mt-0.5">
              Cals
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Stats')}
            className="flex-row items-center gap-1 mt-2"
          >
            <Text className="text-xs font-semibold text-teal-600">See data</Text>
            <ChevronRight size={14} color="#0d9488" />
          </Pressable>
        </View>

        <View className="w-[160px] h-[220px] items-center justify-center">
          <View className="absolute w-40 h-40 bg-teal-100/40 rounded-full" />
          <Svg width={140} height={140} viewBox="0 0 100 100">
            <Circle cx={50} cy={30} r={10} stroke="#f43f5e" strokeWidth={1.5} fill="none" />
            <Line x1={50} y1={40} x2={50} y2={70} stroke="#f43f5e" strokeWidth={2} />
            <Line x1={50} y1={48} x2={32} y2={35} stroke="#f43f5e" strokeWidth={2} strokeLinecap="round" />
            <Line x1={50} y1={48} x2={68} y2={35} stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
            <Line x1={50} y1={70} x2={40} y2={90} stroke="#f43f5e" strokeWidth={2} strokeLinecap="round" />
            <Line x1={50} y1={70} x2={60} y2={90} stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
      </View>

      <View className="mt-4 bg-white rounded-[2rem] p-5 border border-gray-100/50 gap-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
              <Text>🌙</Text>
            </View>
            <View>
              <Text className="text-sm font-semibold text-gray-800">Sleep</Text>
              <Text className="text-[11px] text-gray-400">
                {latestSleepHours && latestSleepHours < 7
                  ? 'You slept too little last night'
                  : latestSleepHours
                  ? 'Nice, you hit your sleep window'
                  : 'No sleep data logged yet'}
              </Text>
            </View>
          </View>
          <Text className="text-sm font-bold text-gray-900">
            {formatSleepDuration(latestSleepHours)}
          </Text>
        </View>

        <SleepBarChart entries={sleepEntries} goalHours={8} maxScaleHours={10} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
});
