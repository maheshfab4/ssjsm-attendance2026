import { Group, Member, Duty, AttendanceRecord } from './types';
import { v4 as uuidv4 } from 'uuid';
import { rosterForDuty, rosterForDutyId } from './utils/attendance';

const STORAGE_KEY = 'org-attendance-data';

function getDefaultGroups(): Group[] {
  const groups: Group[] = [];
  for (let i = 1; i <= 12; i++) {
    groups.push({
      id: uuidv4(),
      name: `Group ${i}`,
      leaderName: `Leader ${i}`,
      pin: String(1000 + i),
      members: [],
      duties: [],
      attendance: [],
    });
  }
  return groups;
}

export function loadGroups(): Group[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load data', e);
  }
  const defaults = getDefaultGroups();
  saveGroups(defaults);
  return defaults;
}

export function saveGroups(groups: Group[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function addMember(groups: Group[], groupId: string, member: Omit<Member, 'id'>): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      return { ...g, members: [...g.members, { ...member, id: uuidv4() }] };
    }
    return g;
  });
}

export function removeMember(groups: Group[], groupId: string, memberId: string): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      return {
        ...g,
        members: g.members.filter(m => m.id !== memberId),
        attendance: g.attendance.filter(a => a.memberId !== memberId),
      };
    }
    return g;
  });
}

export function editMember(groups: Group[], groupId: string, memberId: string, updates: Partial<Member>): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      return {
        ...g,
        members: g.members.map(m => m.id === memberId ? { ...m, ...updates } : m),
      };
    }
    return g;
  });
}

export function addDuty(groups: Group[], groupId: string, duty: Omit<Duty, 'id'>): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      return { ...g, duties: [...g.duties, { ...duty, id: uuidv4() }] };
    }
    return g;
  });
}

export function removeDuty(groups: Group[], groupId: string, dutyId: string): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      return {
        ...g,
        duties: g.duties.filter(d => d.id !== dutyId),
        attendance: g.attendance.filter(a => a.dutyId !== dutyId),
      };
    }
    return g;
  });
}

export function toggleAttendance(groups: Group[], groupId: string, dutyId: string, memberId: string): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      const existing = g.attendance.find(a => a.dutyId === dutyId && a.memberId === memberId);
      if (existing) {
        return {
          ...g,
          attendance: g.attendance.map(a =>
            a.dutyId === dutyId && a.memberId === memberId
              ? { ...a, present: !a.present, markedAt: new Date().toISOString() }
              : a
          ),
        };
      } else {
        const record: AttendanceRecord = {
          dutyId,
          memberId,
          present: true,
          markedAt: new Date().toISOString(),
        };
        return { ...g, attendance: [...g.attendance, record] };
      }
    }
    return g;
  });
}

export function markAllAttendance(groups: Group[], groupId: string, dutyId: string, present: boolean): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      const now = new Date().toISOString();
      const newAttendance = rosterForDutyId(g, dutyId).map(m => {
        const existing = g.attendance.find(a => a.dutyId === dutyId && a.memberId === m.id);
        if (existing) {
          return { ...existing, present, markedAt: now };
        }
        return { dutyId, memberId: m.id, present, markedAt: now };
      });
      const otherAttendance = g.attendance.filter(a => a.dutyId !== dutyId);
      return { ...g, attendance: [...otherAttendance, ...newAttendance] };
    }
    return g;
  });
}

export function submitAttendance(groups: Group[], groupId: string, dutyId: string, presentMemberIds: string[]): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      const now = new Date().toISOString();
      const presentSet = new Set(presentMemberIds);
      const roster = rosterForDutyId(g, dutyId);
      const newAttendance = roster.map(m => ({
        dutyId,
        memberId: m.id,
        present: presentSet.has(m.id),
        markedAt: now,
      }));
      const otherAttendance = g.attendance.filter(a => a.dutyId !== dutyId);
      return { ...g, attendance: [...otherAttendance, ...newAttendance] };
    }
    return g;
  });
}

export function updateGroupInfo(groups: Group[], groupId: string, updates: Partial<Pick<Group, 'name' | 'leaderName' | 'pin'>>): Group[] {
  return groups.map(g => {
    if (g.id === groupId) {
      return { ...g, ...updates };
    }
    return g;
  });
}

export function getUnmarkedDuties(group: Group): Duty[] {
  // Get today's date string (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  return group.duties.filter(duty => {
    // Only consider duties on or before today (not future duties)
    if (duty.date > todayStr) return false;

    // Only members active on the duty's date are expected to be marked.
    const expected = rosterForDuty(group, duty).length;
    const markedMembers = group.attendance.filter(a => a.dutyId === duty.id);
    return markedMembers.length < expected;
  });
}

export function getDutyAttendanceStats(group: Group, dutyId: string) {
  // Total = members who were active on this duty's date, not everyone.
  const total = rosterForDutyId(group, dutyId).length;
  const records = group.attendance.filter(a => a.dutyId === dutyId);
  const present = records.filter(a => a.present).length;
  const absent = records.filter(a => !a.present).length;
  const unmarked = Math.max(0, total - records.length);
  return { total, present, absent, unmarked };
}

export function exportGroupData(group: Group): string {
  const lines: string[] = [];
  lines.push(`Group: ${group.name}`);
  lines.push(`Leader: ${group.leaderName}`);
  lines.push('');
  lines.push('--- Members ---');
  group.members.forEach(m => {
    lines.push(`${m.name} | ${m.phone} | ${m.firmName}`);
  });
  lines.push('');
  lines.push('--- Attendance Summary ---');
  group.duties.forEach(duty => {
    const stats = getDutyAttendanceStats(group, duty.id);
    lines.push(`${duty.title} (${duty.date}): Present: ${stats.present}/${stats.total}, Absent: ${stats.absent}, Unmarked: ${stats.unmarked}`);
    rosterForDuty(group, duty).forEach(m => {
      const record = group.attendance.find(a => a.dutyId === duty.id && a.memberId === m.id);
      const status = record ? (record.present ? '✓ Present' : '✗ Absent') : '— Not Marked';
      lines.push(`  ${m.name}: ${status}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}
