import { Group } from '../types';
import {
  Users,
  LayoutDashboard,
  Shield,
  ChevronRight,
  X,
  Lock,
  Unlock,
  CalendarPlus,
  CalendarDays,
} from 'lucide-react';

interface SidebarProps {
  groups: Group[];
  selectedGroupId: string | null;
  authenticatedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onDashboard: () => void;
  onAllotDuties: () => void;
  onCalendar: () => void;
  currentView: 'dashboard' | 'allot-duties' | 'calendar' | 'group';
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  groups,
  selectedGroupId,
  authenticatedGroupId,
  onSelectGroup,
  onDashboard,
  onAllotDuties,
  onCalendar,
  currentView,
  isOpen,
  onToggle,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">SSJSM</h1>
                <p className="text-xs text-slate-400">Attendance Tracker</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="px-3 pt-4 pb-2 space-y-1">
          <button
            onClick={onDashboard}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentView === 'dashboard'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={onAllotDuties}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentView === 'allot-duties'
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <CalendarPlus className="w-5 h-5" />
            <span>Allot Duties</span>
          </button>

          <button
            onClick={onCalendar}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentView === 'calendar'
                ? 'bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-lg shadow-orange-500/25'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span>Duty Calendar</span>
          </button>
        </div>

        {/* Groups list */}
        <div className="px-3 pb-2">
          <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Groups
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin">
          {groups.map((group) => {
            const isSelected = currentView === 'group' && selectedGroupId === group.id;
            const isAuthenticated = authenticatedGroupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isSelected
                      ? 'bg-white/20'
                      : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate">{group.leaderName}</p>
                  <p
                    className={`text-[11px] truncate ${
                      isSelected ? 'text-white/70' : 'text-slate-500'
                    }`}
                  >
                    {group.name} · {group.members.length} members
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isAuthenticated ? (
                    <Unlock className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-white/70' : 'text-slate-600'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <p className="text-[10px] text-slate-500 text-center">
            Data stored locally in your browser
          </p>
        </div>
      </aside>
    </>
  );
}
