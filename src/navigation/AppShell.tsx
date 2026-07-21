import { useState } from 'react';
import { BarChart3, Compass, Dumbbell, Home, Plus, Ruler, Users, UtensilsCrossed, Weight } from 'lucide-react';
import { HomeScreen } from '../screens/HomeScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { Sheet } from '../components/Sheet';
import { WeightForm } from '../components/forms/WeightForm';
import { MeasurementsForm } from '../components/forms/MeasurementsForm';
import { MealForm } from '../components/forms/MealForm';
import { ProfileForm } from '../components/forms/ProfileForm';

type Tab = 'home' | 'stats' | 'discover' | 'community' | 'workouts';
type ActiveSheet = 'quickAdd' | 'weight' | 'measurements' | 'meal' | 'profile' | null;

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
  { key: 'discover', label: 'Discover', icon: Compass },
  { key: 'community', label: 'Community', icon: Users },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell },
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function closeSheet() {
    setActiveSheet(null);
  }

  function onSaved() {
    setRefreshKey(key => key + 1);
    closeSheet();
  }

  return (
    <div className="app-bg flex h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <div className="hide-scrollbar relative flex-1 overflow-y-auto">
        {activeTab === 'home' && (
          <HomeScreen
            key={refreshKey}
            onNavigateStats={() => setActiveTab('stats')}
            onOpenProfile={() => setActiveSheet('profile')}
          />
        )}
        {activeTab === 'stats' && <StatsScreen key={refreshKey} />}
        {activeTab === 'discover' && <PlaceholderScreen title="Discover" />}
        {activeTab === 'community' && <PlaceholderScreen title="Community" />}
        {activeTab === 'workouts' && <PlaceholderScreen title="Workouts" />}

        <button
          type="button"
          onClick={() => setActiveSheet('quickAdd')}
          aria-label="Quick add"
          className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(224,138,62,0.45)]"
          style={{ background: 'linear-gradient(135deg, #e08a3e, #a84e0a)' }}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      <nav className="glass-card flex shrink-0 justify-between rounded-none border-x-0 border-b-0 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex flex-col items-center gap-1"
              style={{ color: isActive ? 'var(--text)' : 'var(--muted)' }}
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
            icon={UtensilsCrossed}
            label="Add meal"
            onClick={() => setActiveSheet('meal')}
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

      <Sheet open={activeSheet === 'profile'} onClose={closeSheet} title="Your profile">
        <ProfileForm onSaved={onSaved} />
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
