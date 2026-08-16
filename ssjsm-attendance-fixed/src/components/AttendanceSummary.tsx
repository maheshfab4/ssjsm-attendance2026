import { Group } from '../types';
import { getDutyAttendanceStats } from '../store';
import { dutiesForMember } from '../utils/attendance';
import {
  BarChart3,
  CalendarCheck,
  UserCheck,
  UserX,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';
import { exportGroupData } from '../store';

interface AttendanceSummaryProps {
  group: Group;
}

export default function AttendanceSummary({ group }: AttendanceSummaryProps) {
  // Compute per-member overall stats
  const memberStats = group.members.map((member) => {
    let totalDuties = 0;
    let present = 0;
    let absent = 0;
    let unmarked = 0;
    // Only duties on/after the member's effectiveFrom count towards their rate,
    // so someone who joined recently isn't penalised for earlier duties.
    dutiesForMember(group, member).forEach((duty) => {
      totalDuties++;
      const record = group.attendance.find(
        (a) => a.dutyId === duty.id && a.memberId === member.id
      );
      if (record) {
        if (record.present) present++;
        else absent++;
      } else {
        unmarked++;
      }
    });
    const rate = totalDuties > 0 ? Math.round((present / totalDuties) * 100) : 0;
    return { member, totalDuties, present, absent, unmarked, rate };
  });

  // Sort by attendance rate descending
  const sortedMemberStats = [...memberStats].sort((a, b) => b.rate - a.rate);

  // Overall stats
  let overallPresent = 0;
  let overallTotal = 0;
  group.duties.forEach((d) => {
    const stats = getDutyAttendanceStats(group, d.id);
    overallPresent += stats.present;
    overallTotal += stats.total;
  });
  const overallRate = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

  const handleExport = () => {
    const data = exportGroupData(group);
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group.name}-attendance-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Attendance Summary
          </h2>
          <p className="text-slate-500 text-sm mt-1">{group.name} · {group.leaderName}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <Users className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{group.members.length}</p>
          <p className="text-xs text-slate-500">Members</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <CalendarCheck className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{group.duties.length}</p>
          <p className="text-xs text-slate-500">Duties</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <TrendingUp className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{overallRate}%</p>
          <p className="text-xs text-slate-500">Attendance Rate</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-slate-900">
            {group.duties.filter((d) => {
              const stats = getDutyAttendanceStats(group, d.id);
              return stats.unmarked > 0;
            }).length}
          </p>
          <p className="text-xs text-slate-500">Pending Duties</p>
        </div>
      </div>

      {/* Per Duty Breakdown */}
      {group.duties.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">Duty-wise Breakdown</h3>
          <div className="space-y-3">
            {group.duties
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((duty) => {
                const stats = getDutyAttendanceStats(group, duty.id);
                const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

                return (
                  <div
                    key={duty.id}
                    className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{duty.title}</h4>
                        <p className="text-xs text-slate-500">
                          {new Date(duty.date + 'T00:00:00').toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          rate >= 80
                            ? 'text-green-600'
                            : rate >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {rate}%
                      </span>
                    </div>

                    <div className="bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rate >= 80
                            ? 'bg-green-500'
                            : rate >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="flex items-center gap-1 text-green-600">
                        <UserCheck className="w-3.5 h-3.5" /> {stats.present} Present
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <UserX className="w-3.5 h-3.5" /> {stats.absent} Absent
                      </span>
                      {stats.unmarked > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <AlertCircle className="w-3.5 h-3.5" /> {stats.unmarked} Unmarked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Member-wise Attendance */}
      {group.members.length > 0 && group.duties.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">Member-wise Attendance</h3>
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Member</th>
                    <th className="text-center px-3 py-3 text-slate-500 font-medium">Present</th>
                    <th className="text-center px-3 py-3 text-slate-500 font-medium">Absent</th>
                    <th className="text-center px-3 py-3 text-slate-500 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMemberStats.map(({ member, present, absent, rate }) => (
                    <tr
                      key={member.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 truncate max-w-[150px]">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {present}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XCircle className="w-3.5 h-3.5" />
                          {absent}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            rate >= 80
                              ? 'bg-green-100 text-green-700'
                              : rate >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {group.duties.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100">
          <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No duties assigned yet</p>
          <p className="text-sm mt-1">Add duties to start tracking attendance</p>
        </div>
      )}
    </div>
  );
}
