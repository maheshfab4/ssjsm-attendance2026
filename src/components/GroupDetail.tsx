import { useState } from 'react';
import { Group, Member, Duty } from '../types';
import { getDutyAttendanceStats, getUnmarkedDuties } from '../store';
import MemberCard from './MemberCard';
import AddMemberForm from './AddMemberForm';
import AddDutyForm from './AddDutyForm';
import ImportMembersModal from './ImportMembersModal';
import MarkAttendance from './MarkAttendance';
import AttendanceSummary from './AttendanceSummary';
import {
  Users,
  CalendarCheck,
  BarChart3,
  Plus,
  AlertTriangle,
  Settings,
  Lock,
  Unlock,
  Trash2,
  ChevronRight,
  ClipboardCheck,
  UserCheck,
  UserX,
  X,
  Save,
} from 'lucide-react';

type Tab = 'members' | 'duties' | 'summary';

interface GroupDetailProps {
  group: Group;
  isAuthenticated: boolean;
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onImportMembers: (members: Omit<Member, 'id'>[]) => void;
  onEditMember: (memberId: string, updates: Partial<Member>) => void;
  onRemoveMember: (memberId: string) => void;
  onAddDuty: (duty: Omit<Duty, 'id'>) => void;
  onRemoveDuty: (dutyId: string) => void;
  onSubmitAttendance: (dutyId: string, presentMemberIds: string[]) => void;
  onUpdateGroup: (updates: Partial<Pick<Group, 'name' | 'leaderName' | 'pin'>>) => void;
  onAuthenticate: () => void;
  onLogout: () => void;
}

export default function GroupDetail({
  group,
  isAuthenticated,
  onAddMember,
  onImportMembers,
  onEditMember,
  onRemoveMember,
  onAddDuty,
  onRemoveDuty,
  onSubmitAttendance,
  onUpdateGroup,
  onAuthenticate,
  onLogout,
}: GroupDetailProps) {
  const [tab, setTab] = useState<Tab>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showImportMembers, setShowImportMembers] = useState(false);
  const [showAddDuty, setShowAddDuty] = useState(false);
  const [selectedDutyId, setSelectedDutyId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState(group.name);
  const [settingsLeader, setSettingsLeader] = useState(group.leaderName);
  const [settingsPin, setSettingsPin] = useState(group.pin);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const unmarkedDuties = getUnmarkedDuties(group);
  const selectedDuty = group.duties.find((d) => d.id === selectedDutyId);

  if (selectedDuty) {
    return (
      <MarkAttendance
        group={group}
        duty={selectedDuty}
        onSubmitAttendance={(presentMemberIds) => {
          onSubmitAttendance(selectedDuty.id, presentMemberIds);
        }}
        onBack={() => setSelectedDutyId(null)}
        readOnly={!isAuthenticated}
      />
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: 'members', label: 'Members', icon: Users, count: group.members.length },
    { key: 'duties', label: 'Duties', icon: CalendarCheck, count: group.duties.length },
    { key: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  const handleSaveSettings = () => {
    onUpdateGroup({
      name: settingsName.trim() || group.name,
      leaderName: settingsLeader.trim() || group.leaderName,
      pin: settingsPin || group.pin,
    });
    setShowSettings(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{group.name}</h1>
          <p className="text-slate-500 mt-0.5">Leader: {group.leaderName}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  setSettingsName(group.name);
                  setSettingsLeader(group.leaderName);
                  setSettingsPin(group.pin);
                  setShowSettings(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Lock
              </button>
            </>
          ) : (
            <button
              onClick={onAuthenticate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              <Unlock className="w-4 h-4" />
              Unlock to Edit
            </button>
          )}
        </div>
      </div>

      {/* Read-only banner */}
      {!isAuthenticated && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 text-amber-800 text-sm">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Read-only mode.</strong> Enter the group PIN to add members, manage duties, or mark attendance.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            {count !== undefined && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'members' && (
        <div className="space-y-4">
          {isAuthenticated && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setShowImportMembers(true)}
                className="flex items-center justify-center gap-2 p-4 border-2 border-indigo-200 bg-indigo-50/50 rounded-xl text-indigo-600 hover:border-indigo-400 hover:bg-indigo-100 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
                <div className="text-left">
                  <div className="font-semibold text-sm">Import from Sheet</div>
                  <div className="text-[11px] text-indigo-500 font-normal">Paste, CSV, or URL</div>
                </div>
              </button>
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
              >
                <Plus className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold text-sm">Add Member Manually</div>
                  <div className="text-[11px] text-slate-400 font-normal">One at a time</div>
                </div>
              </button>
            </div>
          )}

          {group.members.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-lg">No members yet</p>
              <p className="text-sm mt-1">
                {isAuthenticated
                  ? 'Click the button above to add team members'
                  : 'Unlock the group to add team members'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  canEdit={isAuthenticated}
                  onEdit={() => setEditingMember(member)}
                  onDelete={() => setConfirmDelete(member.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'duties' && (
        <div className="space-y-4">
          {/* Unmarked duties alert */}
          {unmarkedDuties.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">
                  {unmarkedDuties.length} duties with pending attendance
                </h3>
              </div>
              <div className="space-y-1.5">
                {unmarkedDuties.map((duty) => (
                  <button
                    key={duty.id}
                    onClick={() => setSelectedDutyId(duty.id)}
                    className="w-full flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm hover:bg-amber-100/50 transition-colors text-left"
                  >
                    <span className="text-amber-900 font-medium">
                      {duty.title} — {formatDate(duty.date)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={() => setShowAddDuty(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50/50 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Duty</span>
            </button>
          )}

          {group.duties.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CalendarCheck className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-lg">No duties assigned</p>
              <p className="text-sm mt-1">
                {isAuthenticated
                  ? 'Click the button above to add duties'
                  : 'Unlock the group to add duties'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {group.duties
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((duty) => {
                  const stats = getDutyAttendanceStats(group, duty.id);
                  const isComplete = stats.unmarked === 0 && stats.total > 0;
                  const rate =
                    stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

                  return (
                    <div
                      key={duty.id}
                      className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => setSelectedDutyId(duty.id)}
                        className="w-full p-4 text-left hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isComplete
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-indigo-100 text-indigo-600'
                              }`}
                            >
                              {isComplete ? (
                                <ClipboardCheck className="w-5 h-5" />
                              ) : (
                                <CalendarCheck className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{duty.title}</h4>
                              <p className="text-sm text-slate-500">{formatDate(duty.date)}</p>
                              {duty.description && (
                                <p className="text-xs text-slate-400 mt-1">{duty.description}</p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 mt-1" />
                        </div>

                        {group.members.length > 0 && (
                          <div className="mt-3 flex items-center gap-4 text-xs flex-wrap">
                            <span className="flex items-center gap-1 text-green-600">
                              <UserCheck className="w-3.5 h-3.5" /> {stats.present}
                            </span>
                            <span className="flex items-center gap-1 text-red-600">
                              <UserX className="w-3.5 h-3.5" /> {stats.absent}
                            </span>
                            {stats.unmarked > 0 && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="w-3.5 h-3.5" /> {stats.unmarked} unmarked
                              </span>
                            )}
                            {stats.total > 0 && (
                              <span
                                className={`ml-auto px-2 py-0.5 rounded-full font-semibold ${
                                  rate >= 80
                                    ? 'bg-green-100 text-green-700'
                                    : rate >= 50
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {rate}%
                              </span>
                            )}
                          </div>
                        )}
                      </button>

                      {isAuthenticated && (
                        <div className="px-4 pb-3 flex justify-end">
                          <button
                            onClick={() => onRemoveDuty(duty.id)}
                            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Duty
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {tab === 'summary' && <AttendanceSummary group={group} />}

      {/* Modals */}
      {(showAddMember || editingMember) && (
        <AddMemberForm
          onAdd={(member) => {
            onAddMember(member);
            setShowAddMember(false);
          }}
          onCancel={() => {
            setShowAddMember(false);
            setEditingMember(null);
          }}
          editMember={editingMember || undefined}
          onEdit={(memberId, updates) => {
            onEditMember(memberId, updates);
            setEditingMember(null);
          }}
        />
      )}

      {showImportMembers && (
        <ImportMembersModal
          groupName={group.name}
          onImport={(members) => {
            onImportMembers(members);
            setShowImportMembers(false);
          }}
          onCancel={() => setShowImportMembers(false)}
        />
      )}

      {showAddDuty && (
        <AddDutyForm
          onAdd={(duty) => {
            onAddDuty(duty);
            setShowAddDuty(false);
          }}
          onCancel={() => setShowAddDuty(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <h2 className="text-lg font-bold">Group Settings</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Leader Name</label>
                <input
                  type="text"
                  value={settingsLeader}
                  onChange={(e) => setSettingsLeader(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group PIN</label>
                <input
                  type="text"
                  value={settingsPin}
                  onChange={(e) => setSettingsPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono tracking-wider text-center text-lg"
                  maxLength={6}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Share this PIN with the group leader only
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Remove Member?</h3>
            <p className="text-sm text-slate-500 mt-2">
              This will also remove all attendance records for this member. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveMember(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
