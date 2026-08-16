import { useState, useMemo } from 'react';
import { Group, Duty } from '../types';
import { getDutyAttendanceStats } from '../store';
import { rosterForDuty, formatEffectiveFrom } from '../utils/attendance';
import Avatar from './Avatar';
import {
  CheckCircle2,
  XCircle,
  Circle,
  Phone,
  Building2,
  UserCheck,
  UserX,
  Users,
  ArrowLeft,
  Send,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';

interface MarkAttendanceProps {
  group: Group;
  duty: Duty;
  onSubmitAttendance: (presentMemberIds: string[]) => void;
  onBack: () => void;
  readOnly?: boolean;
}

export default function MarkAttendance({
  group,
  duty,
  onSubmitAttendance,
  onBack,
  readOnly,
}: MarkAttendanceProps) {
  // Only members who had joined by this duty's date appear on the sheet.
  // Members added later simply don't exist for this duty — nothing to resubmit.
  const roster = useMemo(() => rosterForDuty(group, duty), [group, duty]);
  const excludedCount = group.members.length - roster.length;

  // Check if attendance has already been submitted for this duty
  const existingRecords = group.attendance.filter((a) => a.dutyId === duty.id);
  const hasSubmitted = existingRecords.length > 0;

  // Get previously marked present members
  const previouslyPresent = useMemo(
    () => existingRecords.filter((r) => r.present).map((r) => r.memberId),
    [existingRecords]
  );

  // Track selected (present) members - initialize with previously present if editing
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(hasSubmitted ? previouslyPresent : [])
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const stats = getDutyAttendanceStats(group, duty.id);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toggleMember = (memberId: string) => {
    if (readOnly) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(roster.map((m) => m.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const handleSubmit = () => {
    onSubmitAttendance(Array.from(selectedIds));
    setShowConfirm(false);
    onBack();
  };

  const presentCount = selectedIds.size;
  const absentCount = roster.length - presentCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-3 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to duties
        </button>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold">{duty.title}</h2>
              <p className="text-white/80 mt-1">{formatDate(duty.date)}</p>
              {duty.description && (
                <p className="text-white/60 text-sm mt-2">{duty.description}</p>
              )}
            </div>
            {hasSubmitted && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                ✓ Submitted
              </span>
            )}
          </div>

          {/* Stats bar - show live counts during marking, or saved stats if viewing */}
          {readOnly || hasSubmitted ? (
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/70" />
                <span className="text-sm">Total: {stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-300" />
                <span className="text-sm">Present: {stats.present}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-300" />
                <span className="text-sm">Absent: {stats.absent}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/70" />
                <span className="text-sm">Total: {roster.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-300" />
                <span className="text-sm">Selected Present: {presentCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-300" />
                <span className="text-sm">Will be Absent: {absentCount}</span>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-green-400 h-full rounded-full transition-all duration-300"
              style={{
                width:
                  roster.length > 0
                    ? `${((readOnly || hasSubmitted ? stats.present : presentCount) / roster.length) * 100}%`
                    : '0%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions - only show when marking */}
      {!readOnly && roster.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors border border-green-200"
          >
            <CheckCheck className="w-4 h-4" />
            Select All Present
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Selection
          </button>
        </div>
      )}

      {/* Instruction */}
      {!readOnly && roster.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <strong>How to mark:</strong> Tap members who are <strong>PRESENT</strong>. 
          Everyone not selected will be marked as <strong>ABSENT</strong> when you submit.
        </div>
      )}

      {/* Why some members aren't listed */}
      {excludedCount > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600">
          <strong className="text-slate-700">
            {excludedCount} member{excludedCount === 1 ? '' : 's'} not shown
          </strong>{' '}
          — they joined after {formatEffectiveFrom(duty.date)}, so this duty doesn't apply to
          them.
        </div>
      )}

      {/* Members List */}
      {roster.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">
            {group.members.length === 0
              ? 'No members in this group yet'
              : 'No members had joined by this date'}
          </p>
          <p className="text-sm mt-1">
            {group.members.length === 0
              ? 'Add members to start marking attendance'
              : 'Every member joined after this duty, so there is nothing to mark.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {roster.map((member) => {
            // When read-only or already submitted, show actual attendance status
            const record = group.attendance.find(
              (a) => a.dutyId === duty.id && a.memberId === member.id
            );

            // When marking, show selection state
            const isSelected = selectedIds.has(member.id);

            // Determine display state
            let bgClass = '';
            let statusBadge = null;
            let statusIcon = null;

            if (readOnly && hasSubmitted) {
              // View mode - show saved attendance
              const isPresent = record?.present === true;
              const isAbsent = record?.present === false;
              bgClass = isPresent
                ? 'bg-green-50 border-green-300'
                : isAbsent
                ? 'bg-red-50 border-red-300'
                : 'bg-white border-slate-200';
              statusIcon = isPresent ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : isAbsent ? (
                <XCircle className="w-8 h-8 text-red-500" />
              ) : (
                <Circle className="w-8 h-8 text-slate-300" />
              );
              statusBadge = (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isPresent
                      ? 'bg-green-100 text-green-700'
                      : isAbsent
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isPresent ? 'Present' : isAbsent ? 'Absent' : 'Not Marked'}
                </span>
              );
            } else {
              // Marking mode - show selection state
              bgClass = isSelected
                ? 'bg-green-50 border-green-400 shadow-sm shadow-green-100'
                : 'bg-white border-slate-200 hover:border-slate-300';
              statusIcon = isSelected ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <Circle className="w-8 h-8 text-slate-300" />
              );
              statusBadge = (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isSelected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isSelected ? 'Present' : 'Absent'}
                </span>
              );
            }

            return (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                disabled={readOnly}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${bgClass} ${
                  readOnly ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
                }`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">{statusIcon}</div>

                {/* Photo */}
                <div className="flex-shrink-0">
                  <Avatar src={member.photoUrl} name={member.name} size="md" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 truncate">{member.name}</h4>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {member.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="w-3 h-3" />
                        {member.phone}
                      </span>
                    )}
                    {member.firmName && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Building2 className="w-3 h-3" />
                        {member.firmName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0">{statusBadge}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Submit Button - Fixed at bottom */}
      {!readOnly && roster.length > 0 && (
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Submit Attendance
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            {presentCount} Present · {absentCount} Absent
          </p>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white text-center">
              <Send className="w-10 h-10 mx-auto mb-2 opacity-80" />
              <h2 className="text-xl font-bold">Confirm Attendance</h2>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5">
                <p className="font-semibold text-slate-900 mb-3">{duty.title}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                    <p className="text-xs text-green-700 font-medium">Present</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                    <p className="text-xs text-red-700 font-medium">Absent</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 text-center mb-5">
                {hasSubmitted
                  ? 'This will update the previously submitted attendance.'
                  : 'Once submitted, you can still edit the attendance if needed.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
