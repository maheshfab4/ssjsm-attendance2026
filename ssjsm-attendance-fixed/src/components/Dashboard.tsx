import { Group } from '../types';
import { getUnmarkedDuties } from '../store';
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface DashboardProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
}

export default function Dashboard({ groups, onSelectGroup }: DashboardProps) {
  const totalMembers = groups.reduce((sum, g) => sum + g.members.length, 0);
  const totalDuties = groups.reduce((sum, g) => sum + g.duties.length, 0);
  const totalUnmarked = groups.reduce(
    (sum, g) => sum + getUnmarkedDuties(g).length,
    0
  );

  // Get upcoming duties (today and future) sorted by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const upcomingDuties = groups
    .flatMap((g) =>
      g.duties.map((d) => ({
        ...d,
        groupId: g.id,
        groupName: g.name,
        leaderName: g.leaderName,
        memberCount: g.members.length,
        isUnmarked: getUnmarkedDuties(g).some((ud) => ud.id === d.id),
      }))
    )
    .filter((d) => d.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get pending duties (past or current with unmarked attendance)
  const pendingDuties = groups
    .flatMap((g) =>
      getUnmarkedDuties(g).map((d) => ({
        ...d,
        groupId: g.id,
        groupName: g.name,
        leaderName: g.leaderName,
      }))
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDateColor = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'bg-red-100 text-red-700';
    if (diffDays === 0) return 'bg-green-100 text-green-700';
    if (diffDays <= 3) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">SSJSM Attendance Overview</p>
      </div>

      {/* Connection Status */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-green-900">Connected to Google Sheets</p>
          <p className="text-green-700 mt-0.5">
            All data is automatically synced. Group leaders can mark attendance from any device.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Members</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalMembers}</p>
          <p className="text-xs text-slate-400 mt-1">Across {groups.length} groups</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Duties</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalDuties}</p>
          <p className="text-xs text-slate-400 mt-1">Assigned across groups</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">Pending Attendance</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalUnmarked}</p>
          <p className="text-xs text-slate-400 mt-1">Duties with unmarked attendance</p>
        </div>
      </div>

      {/* Upcoming Duties */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Upcoming Duties</h2>
        </div>

        {upcomingDuties.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-500">No upcoming duties</p>
            <p className="text-sm text-slate-400 mt-1">
              Use "Allot Duties" to assign duties to groups
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingDuties.slice(0, 10).map((duty) => (
              <button
                key={duty.id}
                onClick={() => onSelectGroup(duty.groupId)}
                className="w-full bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md hover:border-indigo-200 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  {/* Date badge */}
                  <div
                    className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${getDateColor(
                      duty.date
                    )}`}
                  >
                    <span className="text-[10px] uppercase font-semibold">
                      {new Date(duty.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                      })}
                    </span>
                    <span className="text-xl font-bold -mt-0.5">
                      {new Date(duty.date + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{duty.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                        {formatDate(duty.date)}
                      </span>
                      {duty.isUnmarked && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    {duty.description && (
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{duty.description}</p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="font-medium">{duty.groupName}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span>{duty.leaderName}</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span>{duty.memberCount} members</span>
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pending Attendance */}
      {pendingDuties.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-900">Attendance Not Submitted</h2>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-amber-200">
              {pendingDuties.map((duty) => (
                <button
                  key={duty.id}
                  onClick={() => onSelectGroup(duty.groupId)}
                  className="w-full p-4 hover:bg-amber-100/50 transition-colors text-left flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-900">{duty.title}</p>
                    <p className="text-sm text-amber-700">
                      {formatDate(duty.date)} · {duty.groupName} · {duty.leaderName}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
