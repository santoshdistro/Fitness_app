import { Bell, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { useTodayLog } from '../hooks/useTodayLog';
import { useRecentDailyLogs } from '../hooks/useRecentDailyLogs';
import { SleepBarChart } from '../components/charts/SleepBarChart';
import { PhotoCard } from '../components/PhotoCard';

const HERO_PHOTO_URL =
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&q=80';

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
    <div className="min-h-full px-6 pt-4 pb-8">
      <div className="anim-drop-in mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            aria-label="Edit profile"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[var(--accent)]"
          >
            <span className="text-sm font-bold text-white">U</span>
          </button>
          <div className="glass flex items-center gap-1 rounded-full px-3 py-1.5">
            <span className="text-xs font-medium text-[var(--text)]">Today</span>
            <ChevronDown size={14} className="text-[var(--muted)]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="glass flex h-10 w-10 items-center justify-center rounded-full"
          >
            <RefreshCw
              size={15}
              className={`text-[var(--muted)] ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
          <div className="glass flex h-10 w-10 items-center justify-center rounded-full">
            <Bell size={16} className="text-[var(--muted)]" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="anim-fade-rise flex flex-col gap-5" style={{ animationDelay: '0.12s' }}>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[var(--text)]">
              {todayLog?.steps ?? '--'}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
              Steps
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[var(--text)]">{waterLiters}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
              Water (L)
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[var(--text)]">
              {todayLog?.active_calories_burned ?? '--'}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
              Cals
            </p>
          </div>
          <button
            onClick={onNavigateStats}
            className="mt-2 flex items-center gap-1 text-xs font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            See data
            <ChevronRight size={14} />
          </button>
        </div>

        <PhotoCard
          src={HERO_PHOTO_URL}
          alt="Today's workout"
          className="anim-fade-in h-[220px] w-[150px] shrink-0"
        >
          <div className="flex h-full flex-col justify-end p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              Today's Focus
            </p>
            <p className="text-base font-bold leading-tight text-white">Upper Body</p>
          </div>
        </PhotoCard>
      </div>

      <div
        className="glass-card anim-fade-rise mt-4 flex flex-col gap-4 p-5"
        style={{ animationDelay: '0.3s' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
              <span>🌙</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Sleep</p>
              <p className="text-[11px] text-[var(--muted)]">
                {latestSleepHours && latestSleepHours < 7
                  ? 'You slept too little last night'
                  : latestSleepHours
                    ? 'Nice, you hit your sleep window'
                    : 'No sleep data logged yet'}
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-[var(--text)]">
            {formatSleepDuration(latestSleepHours)}
          </p>
        </div>

        <SleepBarChart entries={sleepEntries} goalHours={8} maxScaleHours={10} />
      </div>
    </div>
  );
}
