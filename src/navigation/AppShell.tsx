import { useState } from 'react';
import { BarChart3, Compass, Dumbbell, Home, Users } from 'lucide-react';
import { HomeScreen } from '../screens/HomeScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

type Tab = 'home' | 'stats' | 'discover' | 'community' | 'workouts';

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
  { key: 'discover', label: 'Discover', icon: Compass },
  { key: 'community', label: 'Community', icon: Users },
  { key: 'workouts', label: 'Workouts', icon: Dumbbell },
];

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="flex h-screen flex-col bg-[#EAECEF] pt-[env(safe-area-inset-top)]">
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <HomeScreen onNavigateStats={() => setActiveTab('stats')} />}
        {activeTab === 'stats' && <StatsScreen />}
        {activeTab === 'discover' && <PlaceholderScreen title="Discover" />}
        {activeTab === 'community' && <PlaceholderScreen title="Community" />}
        {activeTab === 'workouts' && <PlaceholderScreen title="Workouts" />}
      </div>

      <nav className="flex shrink-0 justify-between border-t border-gray-100 bg-white/80 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-black' : 'text-gray-400'}`}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span className="text-[9px] font-bold tracking-wider">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
