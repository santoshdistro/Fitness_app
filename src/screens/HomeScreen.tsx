import { Bell, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
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

type Props = {
  onNavigateStats: () => void;
  onOpenProfile: () => void;
};

export function HomeScreen({ onNavigateStats, onOpenProfile }: Props) {
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
    <div className="min-h-full bg-[#EAECEF] px-6 pt-4 pb-8">
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            aria-label="Edit profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#E5BA73]"
          >
            <span className="text-sm font-bold text-white">U</span>
          </button>
          <div className="flex items-center gap-1 rounded-full border border-gray-100 bg-white px-3 py-1.5">
            <span className="text-xs font-medium text-gray-800">Today</span>
            <ChevronDown size={14} color="#6b7280" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white"
          >
            <RefreshCw size={15} color="#374151" className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white">
            <Bell size={16} color="#374151" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">
              {todayLog?.steps ?? '--'}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Steps
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{waterLiters}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Water (L)
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">
              {todayLog?.active_calories_burned ?? '--'}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Cals
            </p>
          </div>
          <button
            onClick={onNavigateStats}
            className="mt-2 flex items-center gap-1 text-xs font-semibold text-teal-600"
          >
            See data
            <ChevronRight size={14} color="#0d9488" />
          </button>
        </div>

        <div className="relative flex h-[220px] w-[160px] items-center justify-center">
          <div className="absolute h-40 w-40 rounded-full bg-teal-100/40" />
          <svg width={140} height={140} viewBox="0 0 100 100" className="relative">
            <circle cx={50} cy={30} r={10} stroke="#f43f5e" strokeWidth={1.5} fill="none" />
            <line x1={50} y1={40} x2={50} y2={70} stroke="#f43f5e" strokeWidth={2} />
            <line x1={50} y1={48} x2={32} y2={35} stroke="#f43f5e" strokeWidth={2} strokeLinecap="round" />
            <line x1={50} y1={48} x2={68} y2={35} stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
            <line x1={50} y1={70} x2={40} y2={90} stroke="#f43f5e" strokeWidth={2} strokeLinecap="round" />
            <line x1={50} y1={70} x2={60} y2={90} stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-[2rem] border border-gray-100/50 bg-white p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <span>🌙</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Sleep</p>
              <p className="text-[11px] text-gray-400">
                {latestSleepHours && latestSleepHours < 7
                  ? 'You slept too little last night'
                  : latestSleepHours
                    ? 'Nice, you hit your sleep window'
                    : 'No sleep data logged yet'}
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {formatSleepDuration(latestSleepHours)}
          </p>
        </div>

        <SleepBarChart entries={sleepEntries} goalHours={8} maxScaleHours={10} />
      </div>
    </div>
  );
}
