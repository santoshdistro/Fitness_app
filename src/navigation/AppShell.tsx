import { useState } from 'react';
import { Activity, BarChart3, Barcode, BookOpen, Camera, Compass, Dumbbell, Home, Images, Plus, Ruler, ScanLine, UtensilsCrossed, Weight, Zap } from 'lucide-react';
import { HomeScreen } from '../screens/HomeScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { HandbookScreen } from '../screens/HandbookScreen';
import { OnboardingFlow } from '../screens/OnboardingFlow';
import { useProfile } from '../hooks/useProfile';
import { Sheet } from '../components/Sheet';
import { WeightForm } from '../components/forms/WeightForm';
import { MeasurementsForm } from '../components/forms/MeasurementsForm';
import { MealForm } from '../components/forms/MealForm';
import { ProfileForm } from '../components/forms/ProfileForm';
import { ActivityForm } from '../components/forms/ActivityForm';
import { WorkoutForm } from '../components/forms/WorkoutForm';
import { GoalsForm } from '../components/forms/GoalsForm';
import { QuickAddCaloriesForm } from '../components/forms/QuickAddCaloriesForm';
import { FoodScanForm } from '../components/forms/FoodScanForm';
import { BarcodeScanForm } from '../components/forms/BarcodeScanForm';
import { BodyScanForm } from '../components/forms/BodyScanForm';
import { WorkoutPlanForm } from '../components/forms/WorkoutPlanForm';
import { SettingsForm } from '../components/forms/SettingsForm';
import { SpendPanel } from '../components/SpendPanel';
import { ProgressPhotosPanel } from '../components/ProgressPhotosPanel';
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
  | 'workoutPlan'
  | 'profile'
  | 'activity'
  | 'workout'
  | 'goals'
  | 'spend'
  | 'settings'
  | null;

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
  { key: 'discover', label: 'Discover', icon: Compass },
  { key: 'handbook', label: 'Handbook', icon: BookOpen },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell },
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { savePlan } = useAiWorkoutPlan();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProfile();

  function closeSheet() {
    setActiveSheet(null);
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
    <div className="app-bg flex h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <div className="hide-scrollbar relative flex-1 overflow-y-auto">
        {activeTab === 'home' && (
          <HomeScreen
            key={refreshKey}
            onNavigateStats={() => setActiveTab('stats')}
            onOpenProfile={() => setActiveSheet('profile')}
            onOpenSettings={() => setActiveSheet('settings')}
          />
        )}
        {activeTab === 'stats' && (
          <StatsScreen
            key={refreshKey}
            onQuickAddCalories={() => setActiveSheet('quickAddCalories')}
            onOpenProgressPhotos={() => setActiveSheet('progressPhotos')}
          />
        )}
        {activeTab === 'discover' && <DiscoverScreen key={refreshKey} />}
        {activeTab === 'handbook' && <HandbookScreen key={refreshKey} />}
        {activeTab === 'workouts' && (
          <WorkoutsScreen
            key={refreshKey}
            onLogWorkout={() => setActiveSheet('workout')}
            onGeneratePlan={() => setActiveSheet('workoutPlan')}
          />
        )}

      </div>

      <button
        type="button"
        onClick={() => setActiveSheet('quickAdd')}
        aria-label="Quick add"
        className="fixed right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(108,99,255,0.4)]"
        style={{
          background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)',
          bottom: 'calc(env(safe-area-inset-bottom) + 5rem)',
        }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <nav className="glass-card flex shrink-0 justify-between rounded-none border-x-0 border-b-0 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex flex-col items-center gap-1"
              style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-bold tracking-wider">{label}</span>
            </button>
          );
        })}
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
            icon={Dumbbell}
            label="Log workout"
            onClick={() => setActiveSheet('workout')}
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
        <BarcodeScanForm onSaved={onSaved} />
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

      <Sheet open={activeSheet === 'workout'} onClose={closeSheet} title="Log workout">
        <WorkoutForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'profile'} onClose={closeSheet} title="Your profile">
        <ProfileForm
          onSaved={onSaved}
          onOpenGoals={() => setActiveSheet('goals')}
          onOpenSpend={() => setActiveSheet('spend')}
        />
      </Sheet>

      <Sheet open={activeSheet === 'goals'} onClose={closeSheet} title="Calorie & macro goals">
        <GoalsForm onSaved={onSaved} />
      </Sheet>

      <Sheet open={activeSheet === 'spend'} onClose={closeSheet} title="AI usage & spending">
        <SpendPanel />
      </Sheet>

      <Sheet open={activeSheet === 'settings'} onClose={closeSheet} title="Settings">
        <SettingsForm onSaved={closeSheet} />
      </Sheet>
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
