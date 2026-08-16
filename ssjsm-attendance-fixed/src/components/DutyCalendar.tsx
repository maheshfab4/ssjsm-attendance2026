import { useState, useMemo } from 'react';
import { Group } from '../types';
import { rosterForDuty } from '../utils/attendance';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface DutyCalendarProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
}

interface DutyEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  groupId: string;
  groupName: string;
  leaderName: string;
  memberCount: number;
  isCompleted: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const GROUP_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-teal-500', 'bg-orange-500', 'bg-fuchsia-500', 'bg-lime-600',
];

const GROUP_COLORS_LIGHT = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-violet-50 border-violet-200 text-violet-800',
  'bg-rose-50 border-rose-200 text-rose-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800',
  'bg-teal-50 border-teal-200 text-teal-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800',
  'bg-lime-50 border-lime-200 text-lime-800',
];

export default function DutyCalendar({ groups, onSelectGroup }: DutyCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a color map for groups (consistent colors)
  const groupColorMap = useMemo(() => {
    const map = new Map<string, number>();
    groups.forEach((g, i) => map.set(g.id, i % GROUP_COLORS.length));
    return map;
  }, [groups]);

  // Build duty entries from all groups
  const allDuties: DutyEntry[] = useMemo(() => {
    return groups.flatMap((g) =>
      g.duties.map((d) => {
        const attendanceForDuty = g.attendance.filter((a) => a.dutyId === d.id);
        const expected = rosterForDuty(g, d).length;
        const isCompleted = expected > 0 && attendanceForDuty.length >= expected;
        return {
          id: d.id,
          date: d.date,
          title: d.title,
          description: d.description || '',
          groupId: g.id,
          groupName: g.name,
          leaderName: g.leaderName,
          memberCount: expected,
          isCompleted,
        };
      })
    );
  }, [groups]);

  // Map duties by date string
  const dutiesByDate = useMemo(() => {
    const map = new Map<string, DutyEntry[]>();
    allDuties.forEach((d) => {
      const existing = map.get(d.date) || [];
      existing.push(d);
      map.set(d.date, existing);
    });
    return map;
  }, [allDuties]);

  // Calendar grid for the current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const days: { date: Date | null; dateStr: string }[] = [];

    // Padding from previous month
    for (let i = 0; i < startPad; i++) {
      days.push({ date: null, dateStr: '' });
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      days.push({ date, dateStr: `${yyyy}-${mm}-${dd}` });
    }

    return days;
  }, [currentMonth, currentYear]);

  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayStr);
  };

  // Duties for the selected date
  const selectedDuties = selectedDate ? dutiesByDate.get(selectedDate) || [] : [];

  // All duties this month, for the list view below
  const monthDuties = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return allDuties
      .filter((d) => d.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allDuties, currentMonth, currentYear]);

  const formatDateFull = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          Duty Calendar
        </h1>
        <p className="text-slate-500 mt-2">
          View all upcoming and past duties across all groups
        </p>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToToday}
              className="text-xs font-medium px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            if (!day.date) {
              return <div key={`pad-${idx}`} className="min-h-[70px] sm:min-h-[90px] bg-slate-50/50 border-b border-r border-slate-100" />;
            }

            const duties = dutiesByDate.get(day.dateStr) || [];
            const isToday = day.dateStr === todayStr;
            const isSelected = day.dateStr === selectedDate;
            const isPast = day.dateStr < todayStr;
            const dayNum = day.date.getDate();

            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(isSelected ? null : day.dateStr)}
                className={`min-h-[70px] sm:min-h-[90px] p-1 sm:p-1.5 border-b border-r border-slate-100 text-left transition-all relative ${
                  isSelected
                    ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-400'
                    : isToday
                    ? 'bg-blue-50/60'
                    : isPast
                    ? 'bg-white hover:bg-slate-50'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {/* Day number */}
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-semibold ${
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : isPast
                      ? 'text-slate-400'
                      : 'text-slate-700'
                  }`}
                >
                  {dayNum}
                </span>

                {/* Duty dots / pills */}
                {duties.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {duties.slice(0, 3).map((d) => {
                      const colorIdx = groupColorMap.get(d.groupId) ?? 0;
                      return (
                        <div
                          key={d.id}
                          className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${GROUP_COLORS_LIGHT[colorIdx]} border`}
                          title={`${d.groupName} — ${d.title}`}
                        >
                          <span className="truncate">{d.groupName}</span>
                        </div>
                      );
                    })}
                    {/* Mobile: show group name chips */}
                    <div className="sm:hidden flex flex-col gap-0.5 mt-0.5">
                      {duties.slice(0, 2).map((d) => {
                        const colorIdx = groupColorMap.get(d.groupId) ?? 0;
                        return (
                          <div
                            key={d.id}
                            className={`flex items-center gap-0.5 text-[8px] font-semibold leading-tight truncate`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${GROUP_COLORS[colorIdx]}`} />
                            <span className="truncate">{d.groupName}</span>
                          </div>
                        );
                      })}
                      {duties.length > 2 && (
                        <span className="text-[8px] text-slate-400 font-medium">
                          +{duties.length - 2}
                        </span>
                      )}
                    </div>
                    {/* Desktop overflow */}
                    {duties.length > 3 && (
                      <p className="hidden sm:block text-[10px] text-slate-400 px-1">
                        +{duties.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h3 className="font-bold text-slate-900">
              {formatDateFull(selectedDate)}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {selectedDuties.length === 0
                ? 'No duties on this date'
                : `${selectedDuties.length} dut${selectedDuties.length === 1 ? 'y' : 'ies'}`}
            </p>
          </div>

          {selectedDuties.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {selectedDuties.map((duty) => {
                const colorIdx = groupColorMap.get(duty.groupId) ?? 0;
                return (
                  <button
                    key={duty.id}
                    onClick={() => onSelectGroup(duty.groupId)}
                    className="w-full p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    {/* Color bar */}
                    <div
                      className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${GROUP_COLORS[colorIdx]}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-slate-900">{duty.title}</h4>
                        {duty.isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                          </span>
                        ) : selectedDate <= todayStr ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Upcoming
                          </span>
                        )}
                      </div>
                      {duty.description && (
                        <p className="text-sm text-slate-500 mt-1">{duty.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                        <span className="font-medium">{duty.groupName}</span>
                        <span className="text-slate-400">·</span>
                        <span>{duty.leaderName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {duty.memberCount}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No duties scheduled for this date</p>
            </div>
          )}
        </div>
      )}

      {/* Month overview list */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {MONTH_NAMES[currentMonth]} Duties ({monthDuties.length})
        </h2>

        {monthDuties.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No duties this month</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthDuties.map((duty) => {
              const colorIdx = groupColorMap.get(duty.groupId) ?? 0;
              return (
                <button
                  key={duty.id}
                  onClick={() => onSelectGroup(duty.groupId)}
                  className="w-full bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md hover:border-indigo-200 transition-all text-left flex items-center gap-4 group"
                >
                  {/* Date */}
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      {new Date(duty.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-slate-900 -mt-0.5">
                      {new Date(duty.date + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  {/* Color bar */}
                  <div className={`w-1 self-stretch rounded-full ${GROUP_COLORS[colorIdx]}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900">{duty.title}</span>
                      {duty.isCompleted ? (
                        <span className="text-[11px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Done
                        </span>
                      ) : duty.date <= todayStr ? (
                        <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : null}
                    </div>
                    {duty.description && (
                      <p className="text-sm text-slate-500 mt-0.5 truncate">{duty.description}</p>
                    )}
                    <p className="text-sm text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">{duty.groupName}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {duty.leaderName}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      {groups.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Group Colors</h3>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const colorIdx = groupColorMap.get(g.id) ?? 0;
              return (
                <div key={g.id} className="flex items-center gap-2 text-sm text-slate-600">
                  <div className={`w-3 h-3 rounded-full ${GROUP_COLORS[colorIdx]}`} />
                  <span>{g.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
