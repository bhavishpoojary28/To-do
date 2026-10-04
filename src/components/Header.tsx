import { useState, useEffect, type ReactNode } from 'react';
import { Search, X, CheckSquare, FileText, Mic, Layers, Bell, BellRing, BellOff } from 'lucide-react';
import type { FilterType } from '../types/app';
import type { NotificationPermissionState } from '../utils/notifications';

interface HeaderProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    tasks: number;
    notes: number;
    voice: number;
  };
  notificationPermission?: NotificationPermissionState;
  onRequestPermission?: () => void;
  onTestNotification?: () => void;
}

export const Header = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
  notificationPermission = 'default',
  onRequestPermission,
  onTestNotification,
}: HeaderProps) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search input to parent
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch);
    }, 180);
    return () => clearTimeout(handler);
  }, [localSearch, onSearchChange]);

  const filterTabs: { id: FilterType; label: string; icon: ReactNode; count: number }[] = [
    { id: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" />, count: counts.all },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" />, count: counts.tasks },
    { id: 'notes', label: 'Notes', icon: <FileText className="w-3.5 h-3.5" />, count: counts.notes },
    { id: 'voice', label: 'Voice', icon: <Mic className="w-3.5 h-3.5" />, count: counts.voice },
  ];

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-2xl bg-zinc-950/70 border-b border-white/10 transition-all pt-safe shadow-lg shadow-black/40">
      <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
        {/* Top Branding & Action Controls */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/25 border border-white/20">
              <span className="text-xs font-black tracking-tight text-white">FC</span>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-zinc-100 flex items-center gap-1.5">
                FastCapture
                <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-lg backdrop-blur-md bg-white/[0.06] border border-white/10 text-zinc-300">
                  Suite
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end max-w-xs sm:max-w-sm">
            {/* Glassy Real-time search bar */}
            <div className="relative flex-1">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full backdrop-blur-md bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-400/50 focus:bg-white/[0.07] transition-all"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => setLocalSearch('')}
                    className="absolute right-2 p-0.5 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Screen Notification Permission & Test Button */}
            {notificationPermission === 'granted' ? (
              <button
                type="button"
                onClick={onTestNotification}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold shrink-0 transition-all active:scale-95 shadow-sm"
                title="Mobile screen notifications active! Tap to send test lock-screen alert"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Test Alert</span>
              </button>
            ) : notificationPermission === 'denied' ? (
              <button
                type="button"
                onClick={onRequestPermission}
                className="p-1.5 rounded-xl backdrop-blur-md bg-rose-950/40 border border-rose-800/60 text-rose-400 hover:bg-rose-900/50 transition-colors shrink-0"
                title="Notifications blocked in browser. Tap to retry permission"
                aria-label="Notifications blocked"
              >
                <BellOff className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequestPermission}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold shrink-0 transition-all active:scale-95 shadow-sm"
                title="Enable mobile lock-screen alerts on this device"
              >
                <Bell className="w-3.5 h-3.5 animate-bounce" />
                <span className="hidden sm:inline">Enable Alerts</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick-filter segmented control with Glass Sheen */}
        <div className="flex items-center p-1 backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl gap-1">
          {filterTabs.map((tab) => {
            const isActive = currentFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all select-none ${
                  isActive
                    ? 'backdrop-blur-md bg-gradient-to-r from-zinc-800 to-zinc-700 text-white shadow-md border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span className={isActive ? 'text-rose-400' : 'text-zinc-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                    isActive ? 'bg-zinc-600/80 text-white' : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
