import { useState, useCallback, useEffect } from 'react';
import { Group, Member, Duty } from './types';
import {
  getApiUrl,
  clearApiUrl,
  fetchAllData,
  addMemberApi,
  updateMemberApi,
  deleteMemberApi,
  importMembersApi,
  addDutyApi,
  deleteDutyApi,
  submitAttendanceApi,
  updateGroupApi,
} from './api';
import { todayISO } from './utils/attendance';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupDetail from './components/GroupDetail';
import AllotDuties from './components/AllotDuties';
import DutyCalendar from './components/DutyCalendar';
import PinModal from './components/PinModal';
import SetupScreen from './components/SetupScreen';
import LoadingScreen from './components/LoadingScreen';
import { Menu, Shield, RefreshCw, LogOut } from 'lucide-react';

type AppView = 'dashboard' | 'allot-duties' | 'calendar' | 'group';
type AppState = 'setup' | 'loading' | 'ready' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [groups, setGroups] = useState<Group[]>([]);
  const [view, setView] = useState<AppView>('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [authenticatedGroupId, setAuthenticatedGroupId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pendingAuthGroupId, setPendingAuthGroupId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  // Load data from Google Sheets
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await fetchAllData();
      setGroups(data);
      setAppState('ready');
    } catch (error: any) {
      console.error('Failed to load data:', error);
      showToast('Failed to load data: ' + error.message, 'error');
      setAppState('error');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  // Check if API is configured on mount
  useEffect(() => {
    const apiUrl = getApiUrl();
    if (apiUrl) {
      loadData();
    } else {
      setAppState('setup');
    }
  }, [loadData]);

  const handleConnected = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleDisconnect = useCallback(() => {
    clearApiUrl();
    setAppState('setup');
    setGroups([]);
  }, []);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const handleSelectGroup = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    setView('group');
    setSidebarOpen(false);
  }, []);

  const handleDashboard = useCallback(() => {
    setSelectedGroupId(null);
    setView('dashboard');
    setSidebarOpen(false);
  }, []);

  const handleAllotDuties = useCallback(() => {
    setSelectedGroupId(null);
    setView('allot-duties');
    setSidebarOpen(false);
  }, []);

  const handleCalendar = useCallback(() => {
    setSelectedGroupId(null);
    setView('calendar');
    setSidebarOpen(false);
  }, []);

  // Authentication
  const handleRequestAuth = useCallback((groupId: string) => {
    setPendingAuthGroupId(groupId);
    setShowPinModal(true);
    setPinError('');
  }, []);

  const handlePinSubmit = useCallback(
    (pin: string) => {
      if (!pendingAuthGroupId) return;
      const group = groups.find((g) => g.id === pendingAuthGroupId);

      if (!group) {
        setPinError('Group not found. Try refreshing the page.');
        return;
      }

      // Normalize both: trim, remove .0 suffix, convert to string
      let enteredPin = String(pin).trim();
      let groupPin = String(group.pin || '').trim();
      if (groupPin.endsWith('.0')) groupPin = groupPin.slice(0, -2);
      if (enteredPin.endsWith('.0')) enteredPin = enteredPin.slice(0, -2);

      console.log('PIN Debug:', {
        entered: enteredPin,
        stored: groupPin,
        groupId: group.id,
        match: groupPin === enteredPin,
      });

      if (groupPin && groupPin === enteredPin) {
        setAuthenticatedGroupId(pendingAuthGroupId);
        setShowPinModal(false);
        setPendingAuthGroupId(null);
        setPinError('');
      } else {
        setPinError(
          groupPin
            ? 'Incorrect PIN. Please try again.'
            : 'No PIN found for this group. Check the Groups sheet in Google Sheets.'
        );
      }
    },
    [groups, pendingAuthGroupId]
  );

  const handleLogout = useCallback(() => {
    setAuthenticatedGroupId(null);
  }, []);

  // ==================== API Operations ====================

  const handleAddMember = useCallback(
    async (member: Omit<Member, 'id'>) => {
      if (!selectedGroupId) return;
      try {
        await addMemberApi(selectedGroupId, {
          ...member,
          effectiveFrom: member.effectiveFrom || todayISO(),
        });
        await loadData(); // Refresh data
        showToast('✓ Member added', 'success');
      } catch (error: any) {
        showToast('Failed to add member: ' + error.message, 'error');
      }
    },
    [selectedGroupId, loadData, showToast]
  );

  const handleImportMembers = useCallback(
    async (members: Omit<Member, 'id'>[]) => {
      if (!selectedGroupId || members.length === 0) return;
      try {
        const fallback = todayISO();
        const count = await importMembersApi(
          selectedGroupId,
          members.map((m) => ({ ...m, effectiveFrom: m.effectiveFrom || fallback }))
        );
        await loadData();
        showToast(`✓ Imported ${count} member${count === 1 ? '' : 's'}`, 'success');
      } catch (error: any) {
        showToast('Failed to import: ' + error.message, 'error');
      }
    },
    [selectedGroupId, loadData, showToast]
  );

  const handleEditMember = useCallback(
    async (memberId: string, updates: Partial<Member>) => {
      try {
        await updateMemberApi(memberId, updates);
        await loadData();
        showToast('✓ Member updated', 'success');
      } catch (error: any) {
        showToast('Failed to update: ' + error.message, 'error');
      }
    },
    [loadData, showToast]
  );

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      try {
        await deleteMemberApi(memberId);
        await loadData();
        showToast('✓ Member removed', 'success');
      } catch (error: any) {
        showToast('Failed to remove: ' + error.message, 'error');
      }
    },
    [loadData, showToast]
  );

  const handleAddDuty = useCallback(
    async (duty: Omit<Duty, 'id'>) => {
      if (!selectedGroupId) return;
      try {
        await addDutyApi(selectedGroupId, duty);
        await loadData();
        showToast('✓ Duty added', 'success');
      } catch (error: any) {
        showToast('Failed to add duty: ' + error.message, 'error');
      }
    },
    [selectedGroupId, loadData, showToast]
  );

  const handleAllotDutyToGroup = useCallback(
    async (groupIds: string[], duty: Omit<Duty, 'id'>) => {
      try {
        for (const groupId of groupIds) {
          await addDutyApi(groupId, duty);
        }
        await loadData();
        if (groupIds.length > 1) {
          showToast(`✓ Duty allotted to ${groupIds.length} groups`, 'success');
        } else {
          showToast('✓ Duty allotted', 'success');
        }
      } catch (error: any) {
        showToast('Failed to allot duty: ' + error.message, 'error');
      }
    },
    [loadData, showToast]
  );

  const handleRemoveDuty = useCallback(
    async (dutyId: string) => {
      try {
        await deleteDutyApi(dutyId);
        await loadData();
        showToast('✓ Duty removed', 'success');
      } catch (error: any) {
        showToast('Failed to remove duty: ' + error.message, 'error');
      }
    },
    [loadData, showToast]
  );

  const handleSubmitAttendance = useCallback(
    async (dutyId: string, presentMemberIds: string[]) => {
      if (!selectedGroupId) return;
      const group = groups.find((g) => g.id === selectedGroupId);
      try {
        await submitAttendanceApi(dutyId, selectedGroupId, presentMemberIds, group?.leaderName);
        await loadData();
        showToast('✓ Attendance submitted', 'success');
      } catch (error: any) {
        showToast('Failed to submit: ' + error.message, 'error');
      }
    },
    [selectedGroupId, groups, loadData, showToast]
  );

  const handleUpdateGroup = useCallback(
    async (updates: Partial<Pick<Group, 'name' | 'leaderName' | 'pin'>>) => {
      if (!selectedGroupId) return;
      try {
        await updateGroupApi(selectedGroupId, updates);
        await loadData();
        showToast('✓ Group updated', 'success');
      } catch (error: any) {
        showToast('Failed to update: ' + error.message, 'error');
      }
    },
    [selectedGroupId, loadData, showToast]
  );

  // ==================== Render ====================

  const pendingGroup = groups.find((g) => g.id === pendingAuthGroupId);

  // Setup screen
  if (appState === 'setup') {
    return <SetupScreen onConnected={handleConnected} />;
  }

  // Loading screen
  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  // Error screen
  if (appState === 'error') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
          <p className="text-slate-600 mb-6">
            Could not connect to Google Sheets. Please check your internet connection and try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={loadData}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Change API URL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        groups={groups}
        selectedGroupId={view === 'group' ? selectedGroupId : null}
        authenticatedGroupId={authenticatedGroupId}
        onSelectGroup={handleSelectGroup}
        onDashboard={handleDashboard}
        onAllotDuties={handleAllotDuties}
        onCalendar={handleCalendar}
        currentView={view}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center lg:hidden">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">
                {view === 'group' && selectedGroup
                  ? selectedGroup.leaderName
                  : view === 'allot-duties'
                  ? 'Allot Duties'
                  : view === 'calendar'
                  ? 'Duty Calendar'
                  : 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-700 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Disconnect button */}
            <button
              onClick={handleDisconnect}
              className="p-2 hover:bg-red-50 rounded-xl transition-colors text-slate-400 hover:text-red-600"
              title="Disconnect from Google Sheets"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            {view === 'group' && selectedGroup ? (
              <GroupDetail
                group={selectedGroup}
                isAuthenticated={authenticatedGroupId === selectedGroupId}
                onAddMember={handleAddMember}
                onImportMembers={handleImportMembers}
                onEditMember={handleEditMember}
                onRemoveMember={handleRemoveMember}
                onAddDuty={handleAddDuty}
                onRemoveDuty={handleRemoveDuty}
                onSubmitAttendance={handleSubmitAttendance}
                onUpdateGroup={handleUpdateGroup}
                onAuthenticate={() => handleRequestAuth(selectedGroupId!)}
                onLogout={handleLogout}
              />
            ) : view === 'allot-duties' ? (
              <AllotDuties groups={groups} onAllotDuty={handleAllotDutyToGroup} />
            ) : view === 'calendar' ? (
              <DutyCalendar groups={groups} onSelectGroup={handleSelectGroup} />
            ) : (
              <Dashboard
                groups={groups}
                onSelectGroup={handleSelectGroup}
              />
            )}
          </div>
        </div>
      </main>

      {/* PIN Modal */}
      {showPinModal && pendingGroup && (
        <PinModal
          groupName={pendingGroup.name}
          onSubmit={handlePinSubmit}
          onCancel={() => {
            setShowPinModal(false);
            setPendingAuthGroupId(null);
            setPinError('');
          }}
          error={pinError}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
          <div
            className={`px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                : toast.type === 'error'
                ? 'bg-gradient-to-r from-red-600 to-rose-600'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
