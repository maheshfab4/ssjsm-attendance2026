import { useState } from 'react';
import { Group } from '../types';
import {
  CalendarPlus,
  Users,
  Check,
  CalendarDays,
  FileText,
  Loader2,
} from 'lucide-react';

interface AllotDutiesProps {
  groups: Group[];
  onAllotDuty: (groupIds: string[], duty: { date: string; title: string; description?: string }) => Promise<void>;
}

export default function AllotDuties({ groups, onAllotDuty }: AllotDutiesProps) {
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allSelected = selectedGroupIds.size === groups.length && groups.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(groups.map((g) => g.id)));
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title.trim() || selectedGroupIds.size === 0) return;

    setSubmitting(true);
    try {
      await onAllotDuty(Array.from(selectedGroupIds), {
        date,
        title: title.trim(),
        description: description.trim() || undefined,
      });

      const count = selectedGroupIds.size;
      setSuccess(
        count === groups.length
          ? `Duty allotted to all ${count} groups!`
          : `Duty allotted to ${count} group${count === 1 ? '' : 's'}!`
      );
      setDate('');
      setTitle('');
      setDescription('');
      setSelectedGroupIds(new Set());
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      // error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <CalendarPlus className="w-5 h-5 text-white" />
          </div>
          Allot Duties
        </h1>
        <p className="text-slate-500 mt-2">
          Assign duties to one, multiple, or all groups at once.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">{success}</p>
            <p className="text-sm text-green-600">
              Group leaders can now mark attendance for this duty.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">New Duty Assignment</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              Duty Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-lg"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Duty Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Puraskaari Duty, Event Management, Security"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional details about this duty..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
              rows={3}
            />
          </div>

          {/* Group Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
              <Users className="w-4 h-4 text-slate-400" />
              Assign to Group(s) *
            </label>

            {/* Select All */}
            <button
              type="button"
              onClick={toggleAll}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 transition-all ${
                allSelected
                  ? 'bg-green-50 border-green-400 text-green-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-green-300 hover:bg-green-50/30'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  allSelected
                    ? 'bg-green-500 border-green-500'
                    : 'border-slate-300'
                }`}
              >
                {allSelected && <Check className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">All Groups</p>
                <p className={`text-xs ${allSelected ? 'text-green-600' : 'text-slate-500'}`}>
                  Assign to all {groups.length} groups in one click
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  allSelected
                    ? 'bg-green-200 text-green-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {groups.length} groups
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or select individually</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Individual Groups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 max-h-72 overflow-y-auto pr-1">
              {groups.map((group) => {
                const isSelected = selectedGroupIds.has(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-green-50 border-green-400'
                        : 'bg-white border-slate-200 hover:border-green-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {group.leaderName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {group.name} · {group.members.length} members
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selection counter */}
            {selectedGroupIds.size > 0 && (
              <p className="text-sm text-green-700 font-medium mt-2 bg-green-50 rounded-lg px-3 py-1.5 text-center">
                {selectedGroupIds.size === groups.length
                  ? `All ${groups.length} groups selected`
                  : `${selectedGroupIds.size} group${selectedGroupIds.size === 1 ? '' : 's'} selected`}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!date || !title.trim() || selectedGroupIds.size === 0 || submitting}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Allotting{selectedGroupIds.size > 1 ? ` to ${selectedGroupIds.size} groups...` : '...'}
              </>
            ) : (
              <>
                <CalendarPlus className="w-5 h-5" />
                {selectedGroupIds.size === groups.length
                  ? 'Allot Duty to All Groups'
                  : selectedGroupIds.size > 1
                  ? `Allot Duty to ${selectedGroupIds.size} Groups`
                  : 'Allot Duty to Group'}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recent duties */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Recently Allotted Duties</h2>
        {(() => {
          const allDuties = groups
            .flatMap((g) =>
              g.duties.map((d) => ({
                ...d,
                groupName: g.name,
                leaderName: g.leaderName,
              }))
            )
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 15);

          if (allDuties.length === 0) {
            return (
              <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No duties allotted yet</p>
                <p className="text-sm mt-1">Use the form above to assign duties to groups</p>
              </div>
            );
          }

          return (
            <div className="space-y-2">
              {allDuties.map((duty) => (
                <div
                  key={duty.id}
                  className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs text-slate-500 uppercase font-medium">
                      {new Date(duty.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                      })}
                    </span>
                    <span className="text-lg font-bold text-slate-900 -mt-0.5">
                      {new Date(duty.date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{duty.title}</p>
                    <p className="text-sm text-slate-500">
                      {duty.groupName} · {duty.leaderName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
