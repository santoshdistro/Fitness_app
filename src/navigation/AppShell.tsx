import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Activity, BarChart3, Barcode, BookOpen, Camera, Cookie, Droplets, Dumbbell, Footprints, Home, Images, Loader2, NotebookPen, Plus, Ruler, ScanLine, Sparkles, Timer, UtensilsCrossed, Weight, Zap } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { usePersistentState } from '../hooks/usePersistentState';
import { CoachChat } from '../components/CoachChat';
import { HomeScreen } from '../screens/HomeScreen';
// Non-Home screens are code-split: their chunks (and heavy deps like the
// exercise how-to DB) load the first time you open that tab, keeping the
// initial app load small.
const StatsScreen = lazy(() => import('../screens/StatsScreen').then(m => ({ default: m.StatsScreen })));
const WorkoutsScreen = lazy(() => import('../screens/WorkoutsScreen').then(m => ({ default: m.WorkoutsScreen })));
const DiscoverScreen = lazy(() => import('../screens/DiscoverScreen').then(m => ({ default: m.DiscoverScreen })));
const HandbookScreen = lazy(() => import('../screens/HandbookScreen').then(m => ({ default: m.HandbookScreen })));
import { OnboardingFlow } from '../screens/OnboardingFlow';
import { useProfile } from '../hooks/useProfile';
import { Sheet } from '../components/Sheet';
import { WeightForm } from '../components/forms/WeightForm';
import { MeasurementsForm } from '../components/forms/MeasurementsForm';
import { MealForm } from '../components/forms/MealForm';
import { ProfileForm } from '../components/forms/ProfileForm';
import { ActivityForm } from '../components/forms/ActivityForm';
// Lazy — WorkoutForm pulls the exercise how-to DB (~200KB) for its autocomplete;
// keep that out of the initial load until the log-workout sheet is opened.
const WorkoutForm = lazy(() => import('../components/forms/WorkoutForm').then(m => ({ default: m.WorkoutForm })));
import { GoalsForm } from '../components/forms/GoalsForm';
import { QuickAddCaloriesForm } from '../components/forms/QuickAddCaloriesForm';
import { FoodScanForm } from '../components/forms/FoodScanForm';
// Lazy — the ZXing decoder behind the scanner is ~480KB, half the entire
// initial bundle, for a sheet most sessions never open. It now loads on the
// first barcode scan, alongside the camera permission prompt.
const BarcodeScanForm = lazy(() => import('../components/forms/BarcodeScanForm').then(m => ({ default: m.BarcodeScanForm })));
import { BodyScanForm } from '../components/forms/BodyScanForm';
import { WorkoutPlanForm } from '../components/forms/WorkoutPlanForm';
import { SettingsForm } from '../components/forms/SettingsForm';
import { SpendPanel } from '../components/SpendPanel';
import { ProgressPhotosPanel } from '../components/ProgressPhotosPanel';
import { Calculators } from '../components/Calculators';
import { AchievementsPanel } from '../components/AchievementsPanel';
import { FastingPanel } from '../components/FastingPanel';
import { HealthSyncPanel } from '../components/HealthSyncPanel';
import { CardioForm } from '../components/forms/CardioForm';
import { ElectrolyteForm } from '../components/forms/ElectrolyteForm';
import { CravingsCorner } from '../components/CravingsCorner';
import { useAiWorkoutPlan } from '../hooks/useAiWorkoutPlan';

type Tab = 'home' | 'stats' | 'discover' | 'handbook' | 'workouts';
type ActiveSheet =
  | 'quickAdd'
  | 'weight'
  | 'measurements'
  | 'meal'
  | 'quickAddCalories'
  | 'foodScan'
  | 'barcodeScan'
  | 'bodyScan'
  | 'progressPhotos'
  | 'achievements'
  | 'fasting'
  | 'cardio'
  | 'electrolytes'
  | 'cravings'
  | 'healthSync'
  | 'workoutPlan'
  | 'profile'
  | 'activity'
  | 'workout'
  | 'goals'
  | 'spend'
  | 'calculators'
  | 'settings'
  | null;

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
  { key: 'discover', label: 'Diary', icon: NotebookPen },
  { key: 'handbook', label: 'Handbook', icon: BookOpen },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell },
];

export function AppShell() {
  const [activeTab, setActiveTab] = usePersistentState<Tab>('ui:tab', 'home');
  // Which tabs have been opened at least once — a lazy screen only mounts after
  // its first visit, then stays mounted (so scroll/input survive tab switches).
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set<Tab>(['home', activeTab]));
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { savePlan } = useAiWorkoutPlan();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();

  // Pull-to-refresh: dragging down from the top remounts the screens (each is
  // keyed by refreshKey), which re-runs their data hooks.
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pull, refreshing } = usePullToRefresh(scrollRef, () => {
    refreshProfile();
    setRefreshKey(key => key + 1);
  });

  // Screens share one scroll container, so reset to the top when the tab changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setVisited(prev => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
    // Drives the per-section ambient hue (see --section in index.css).
    document.documentElement.dataset.section = activeTab ?? 'home';
  }, [activeTab]);

  function closeSheet() {
    setActiveSheet(null);
  }

  // Slide a finger across the nav (or tap) to move to the tab under it.
  function handleNavTouch(e: React.TouchEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.touches[0].clientX - rect.left) / rect.width;
    const index = Math.max(0, Math.min(TABS.length - 1, Math.floor(ratio * TABS.length)));
    const key = TABS[index].key;
    if (key !== activeTab) setActiveTab(key);
  }

  function onSaved() {
    setRefreshKey(key => key + 1);
    closeSheet();
  }

  if (profileLoading) {
    return (
      <div className="app-bg flex min-h-dvh items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]" />
      </div>
    );
  }

  const needsOnboarding =
    !profile || !profile.gender || !profile.height || !profile.birth_date || !profile.goal_type;

  if (needsOnboarding) {
    return <OnboardingFlow onComplete={() => refreshProfile()} />;
  }

  return (
    // fixed inset-0 rather than a height: on iOS both 100dvh and 100% left the
    // shell short of the bottom, so the page background showed through as a
    // strip under the nav. A fixed element with inset-0 is sized to the layout
    // viewport by the browser — there is no length to compute and get wrong —
    // so the nav, as the last flex child, always lands on the bottom edge.
    <div className="app-bg fixed inset-0 flex flex-col pt-[env(safe-area-inset-top)]">
      {/* Faint film grain over the whole app, so flat fills read as material. */}
      <div className="grain" aria-hidden="true" />
      {/* No z-index here on purpose: any positive value makes this a stacking
          context, which would trap full-screen overlays mounted inside a screen
          (the guided workout) beneath the nav and FAB. */}
      <div ref={scrollRef} className="hide-scrollbar relative flex-1 overflow-y-auto overflow-x-hidden">
        {/* Pull-to-refresh indicator */}
        {pull > 0 || refreshing ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center"
            style={{ transform: `translateY(${(refreshing ? 40 : pull) - 34}px)`, opacity: refreshing ? 1 : Math.min(1, pull / 68) }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card)] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35)]"
              style={{ border: '1px solid var(--card-border)' }}
            >
              <Loader2
                size={18}
                className={refreshing ? 'animate-spin text-[var(--accent)]' : 'text-[var(--muted)]'}
                style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
              />
            </span>
          </div>
        ) : null}
        {/* All tabs stay mounted (hidden when inactive) so switching tabs never
            unmounts a screen — in-progress input and scroll position survive.
            Pull-to-refresh still remounts them all via refreshKey. */}
        <div key={refreshKey} className="contents">
          <div className={activeTab === 'home' ? 'contents' : 'hidden'}>
            <HomeScreen
              onNavigateStats={() => setActiveTab('stats')}
              onOpenProfile={() => setActiveSheet('profile')}
              onOpenSettings={() => setActiveSheet('settings')}
            />
          </div>
          {visited.has('stats') ? (
            <div className={activeTab === 'stats' ? 'contents' : 'hidden'}>
              <Suspense fallback={<ScreenLoader />}>
                <StatsScreen
                  onOpenProgressPhotos={() => setActiveSheet('progressPhotos')}
                  onLogElectrolytes={() => setActiveSheet('electrolytes')}
                />
              </Suspense>
            </div>
          ) : null}
          {visited.has('discover') ? (
            <div className={activeTab === 'discover' ? 'contents' : 'hidden'}>
              <Suspense fallback={<ScreenLoader />}>
                <DiscoverScreen onQuickAddCalories={() => setActiveSheet('quickAddCalories')} />
              </Suspense>
            </div>
          ) : null}
          {visited.has('handbook') ? (
            <div className={activeTab === 'handbook' ? 'contents' : 'hidden'}>
              <Suspense fallback={<ScreenLoader />}>
                <HandbookScreen />
              </Suspense>
            </div>
          ) : null}
          {visited.has('workouts') ? (
            <div className={activeTab === 'workouts' ? 'contents' : 'hidden'}>
              <Suspense fallback={<ScreenLoader />}>
                <WorkoutsScreen
                  onLogWorkout={() => setActiveSheet('workout')}
                  onGeneratePlan={() => setActiveSheet('workoutPlan')}
                />
              </Suspense>
            </div>
          ) : null}
        </div>

      </div>

      <button
        type="button"
        onClick={() => setCoachOpen(true)}
        aria-label="Ask AI coach"
        className="fixed right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-[var(--accent)] shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          bottom: 'calc(env(safe-area-inset-bottom) + 9.75rem)',
        }}
      >
        <Sparkles size={24} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={() => {
          // Warm the scanner chunk while the menu is being read, so tapping
          // "Scan barcode" opens on a camera rather than on a spinner.
          void import('../components/forms/BarcodeScanForm');
          setActiveSheet('quickAdd');
        }}
        aria-label="Quick add"
        className="fixed right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(108,99,255,0.4)] transition-transform active:scale-90"
        style={{
          background: 'var(--accent-gradient)',
          bottom: 'calc(env(safe-area-inset-bottom) + 5rem)',
        }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {coachOpen ? <CoachChat onClose={() => setCoachOpen(false)} /> : null}

      {/* The full home-indicator inset below the labels left more empty bar than
          bar — 38px of nothing under a 45px row. The indicator itself only
          occupies the bottom ~13px, so the inset is trimmed by 12px and the top
          padding by 4px: still clear of the indicator, 20px less dead space. */}
      <nav className="glass-card shrink-0 rounded-none border-x-0 border-b-0 px-3 pt-2 pb-[max(0.5rem,calc(env(safe-area-inset-bottom)-0.75rem))]">
        <div
          className="relative flex"
          onTouchStart={handleNavTouch}
          onTouchMove={handleNavTouch}
        >
          {/* Sliding glass highlight */}
          <div
            className="pointer-events-none absolute inset-y-0 rounded-2xl"
            style={{
              left: `${(TABS.findIndex(t => t.key === activeTab) * 100) / TABS.length}%`,
              width: `${100 / TABS.length}%`,
              background: 'color-mix(in srgb, var(--section) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--section) 22%, transparent)',
              transition: 'left 300ms ease-out, background 450ms ease, border-color 450ms ease',
            }}
          />
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="relative z-10 flex flex-1 flex-col items-center gap-1 py-1"
                style={{
                  color: isActive ? 'var(--section)' : 'var(--muted)',
                  transition: 'color 450ms ease',
                }}
              >
                <Icon size={21} strokeWidth={isActive ? 2 : 1.75} />
                <span className="text-[10px] font-bold tracking-wider">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <Sheet open={activeSheet === 'quickAdd'} onClose={closeSheet} title="Quick add">
        <div className="flex flex-col gap-3">
          <QuickAddOption
            icon={Weight}
            label="Log weight"
            onClick={() => setActiveSheet('weight')}
          />
          <QuickAddOption
            icon={Ruler}
            label="Log measurements"
            onClick={() => setActiveSheet('measurements')}
          />
          <QuickAddOption
            icon={Barcode}
            label="Scan barcode"
            onClick={() => setActiveSheet('barcodeScan')}
          />
          <QuickAddOption
            icon={Camera}
            label="Scan food photo (AI)"
            onClick={() => setActiveSheet('foodScan')}
          />
          <QuickAddOption
            icon={UtensilsCrossed}
            label="Add meal"
            onClick={() => setActiveSheet('meal')}
          />
          <QuickAddOption
            icon={Zap}
            label="Quick add calories"
            onClick={() => setActiveSheet('quickAddCalories')}
          />
          <QuickAddOption
            icon={Cookie}
            label="Craving something? Get a swap"
            onClick={() => setActiveSheet('cravings')}
          />
          <QuickAddOption
            icon={ScanLine}
            label="Scan my physique (AI)"
            onClick={() => setActiveSheet('bodyScan')}
          />
          <QuickAddOption
            icon={Images}
            label="Add progress photo"
            onClick={() => setActiveSheet('progressPhotos')}
          />
          <QuickAddOption
            icon={Activity}
            label="Log steps, water & sleep"
            onClick={() => setActiveSheet('activity')}
          />
          <QuickAddOption
            icon={Droplets}
            label="Log electrolytes"
            onClick={() => setActiveSheet('electrolytes')}
          />
          <QuickAddOption
            icon={Timer}
            label="Fasting timer"
            onClick={() => setActiveSheet('fasting')}
          />
          <QuickAddOption
            icon={Dumbbell}
            label="Log workout"
            onClick={() => setActiveSheet('workout')}
          />
          <QuickAddOption
            icon={Footprints}
            label="Log cardio (run/walk/ride)"
            onClick={() => setActiveSheet('cardio')}
          />
        </div>
      </Sheet>

      <Sheet open={activeSheet === 'weight'} onClose={closeSheet} title="Log weight">
        <WeightForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'measurements'} onClose={closeSheet} title="Log measurements">
        <MeasurementsForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'meal'} onClose={closeSheet} title="Add meal">
        <MealForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'quickAddCalories'} onClose={closeSheet} title="Quick add calories">
        <QuickAddCaloriesForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'barcodeScan'} onClose={closeSheet} title="Scan barcode">
        <Suspense fallback={<ScreenLoader />}><BarcodeScanForm onSaved={onSaved} /></Suspense>
      </Sheet>

      <Sheet open={activeSheet === 'foodScan'} onClose={closeSheet} title="Scan food photo">
        <FoodScanForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'bodyScan'} onClose={closeSheet} title="Physique scan">
        <BodyScanForm />
      </Sheet>

      <Sheet open={activeSheet === 'progressPhotos'} onClose={closeSheet} title="Progress photos">
        <ProgressPhotosPanel />
      </Sheet>

      <Sheet open={activeSheet === 'workoutPlan'} onClose={closeSheet} title="Generate AI workout plan">
        <WorkoutPlanForm
          onGenerated={plan => {
            savePlan(plan);
            onSaved();
          }}
        />
      </Sheet>

      <Sheet open={activeSheet === 'activity'} onClose={closeSheet} title="Log activity">
        <ActivityForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'cravings'} onClose={closeSheet} title="Cravings corner">
        <CravingsCorner />
      </Sheet>

      <Sheet open={activeSheet === 'electrolytes'} onClose={closeSheet} title="Log electrolytes">
        <ElectrolyteForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'workout'} onClose={closeSheet} title="Log workout">
        <Suspense fallback={<ScreenLoader />}>
          <WorkoutForm onSaved={onSaved} />
        </Suspense>
      </Sheet>

      <Sheet open={activeSheet === 'profile'} onClose={closeSheet} title="Your profile">
        <ProfileForm
          onSaved={onSaved}
          onOpenGoals={() => setActiveSheet('goals')}
          onOpenSpend={() => setActiveSheet('spend')}
          onOpenCalculators={() => setActiveSheet('calculators')}
          onOpenAchievements={() => setActiveSheet('achievements')}
          onOpenHealthSync={() => setActiveSheet('healthSync')}
        />
      </Sheet>

      <Sheet open={activeSheet === 'goals'} onClose={closeSheet} title="Calorie & macro goals">
        <GoalsForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'spend'} onClose={closeSheet} title="AI usage & spending">
        <SpendPanel />
      </Sheet>

      <Sheet open={activeSheet === 'calculators'} onClose={closeSheet} title="Calculators">
        <Calculators />
      </Sheet>

      <Sheet open={activeSheet === 'achievements'} onClose={closeSheet} title="Achievements">
        <AchievementsPanel />
      </Sheet>

      <Sheet open={activeSheet === 'fasting'} onClose={closeSheet} title="Fasting timer">
        <FastingPanel />
      </Sheet>

      <Sheet open={activeSheet === 'cardio'} onClose={closeSheet} title="Log cardio">
        <CardioForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'healthSync'} onClose={closeSheet} title="Apple Health sync">
        <HealthSyncPanel />
      </Sheet>

      <Sheet open={activeSheet === 'settings'} onClose={closeSheet} title="Settings">
        <SettingsForm onSaved={closeSheet} />
      </Sheet>
    </div>
  );
}

// Shown briefly the first time a code-split tab is opened, while its chunk loads.
function ScreenLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--card-border)] border-t-[var(--accent)]" />
    </div>
  );
}

function QuickAddOption({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Weight;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card flex items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold"
      style={{ color: 'var(--text)' }}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
