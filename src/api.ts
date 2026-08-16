import { Group, Member, Duty } from './types';
import { normalizePhotoUrl } from './utils/photoUrl';
import { toISODate } from './utils/attendance';

const API_URL_KEY = 'attendance-api-url';

export function getApiUrl(): string | null {
  return localStorage.getItem(API_URL_KEY);
}

export function setApiUrl(url: string): void {
  localStorage.setItem(API_URL_KEY, url.trim());
}

export function clearApiUrl(): void {
  localStorage.removeItem(API_URL_KEY);
}

async function apiCall<T>(method: 'GET' | 'POST', action: string, data?: any): Promise<T> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new Error('API URL not configured');
  }

  let url = apiUrl;

  if (method === 'GET') {
    url = `${apiUrl}?action=${action}`;
  }

  // Google Apps Script redirects from /macros/s/.../exec to a different URL.
  // We must use `redirect: 'follow'` (the default) and avoid `no-cors` mode.
  const options: RequestInit = {
    method: method === 'GET' ? 'GET' : 'POST',
    redirect: 'follow',
  };

  if (method === 'POST') {
    // Using text/plain avoids a CORS preflight OPTIONS request
    options.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    options.body = JSON.stringify({ action, ...data });
  }

  try {
    const response = await fetch(url, options);

    // Read the text first, then parse – helps debug bad responses
    const text = await response.text();

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('Non-JSON response:', text.substring(0, 500));
      throw new Error('Server returned non-JSON response. Check your Apps Script deployment.');
    }

    if (result.error) {
      throw new Error(result.error);
    }

    return result as T;
  } catch (error: any) {
    console.error(`API [${action}] failed:`, error);
    throw error;
  }
}

// ==================== API Functions ====================

export async function testConnection(): Promise<boolean> {
  try {
    const result = await apiCall<{ success: boolean }>('GET', 'ping');
    return result.success === true;
  } catch {
    return false;
  }
}

export async function fetchAllData(): Promise<Group[]> {
  const result = await apiCall<{ success: boolean; groups: any[] }>('GET', 'getAllData');

  // Normalize all data – ensure PINs are clean strings, etc.
  const groups: Group[] = (result.groups || []).map((g: any) => {
    let pin = String(g.pin ?? '').trim();
    // Remove trailing .0 from numeric PINs (Google Sheets quirk)
    if (pin.endsWith('.0')) pin = pin.slice(0, -2);
    if (pin === 'undefined' || pin === 'null') pin = '';

    return {
      ...g,
      pin,
      members: (g.members || []).map((m: any) => ({
        id: String(m.id || ''),
        name: String(m.name || ''),
        phone: String(m.phone || ''),
        firmName: String(m.firmName || ''),
        photoUrl: normalizePhotoUrl(m.photoUrl),
        // Blank = active for all duties (legacy members).
        effectiveFrom: toISODate(m.effectiveFrom),
      })),
      duties: (g.duties || []).map((d: any) => ({
        id: String(d.id || ''),
        date: String(d.date || ''),
        title: String(d.title || ''),
        description: String(d.description || ''),
      })),
      attendance: (g.attendance || []).map((a: any) => ({
        ...a,
        present: a.present === true || a.present === 'true' || a.present === 'TRUE',
      })),
    };
  });

  console.log('Loaded groups:', groups.map(g => ({ id: g.id, name: g.name, pin: g.pin, members: g.members.length })));

  return groups;
}

export async function addMemberApi(groupId: string, member: Omit<Member, 'id'>): Promise<string> {
  const result = await apiCall<{ success: boolean; memberId: string }>('POST', 'addMember', {
    groupId,
    member,
  });
  return result.memberId;
}

export async function updateMemberApi(memberId: string, updates: Partial<Member>): Promise<void> {
  await apiCall<{ success: boolean }>('POST', 'updateMember', {
    memberId,
    updates,
  });
}

export async function deleteMemberApi(memberId: string): Promise<void> {
  await apiCall<{ success: boolean }>('POST', 'deleteMember', {
    memberId,
  });
}

export async function importMembersApi(groupId: string, members: Omit<Member, 'id'>[]): Promise<number> {
  const result = await apiCall<{ success: boolean; count: number }>('POST', 'importMembers', {
    groupId,
    members,
  });
  return result.count;
}

export async function addDutyApi(groupId: string, duty: Omit<Duty, 'id'>): Promise<string> {
  const result = await apiCall<{ success: boolean; dutyId: string }>('POST', 'addDuty', {
    groupId,
    duty,
  });
  return result.dutyId;
}

export async function deleteDutyApi(dutyId: string): Promise<void> {
  await apiCall<{ success: boolean }>('POST', 'deleteDuty', {
    dutyId,
  });
}

export async function submitAttendanceApi(
  dutyId: string,
  groupId: string,
  presentMemberIds: string[],
  markedBy?: string
): Promise<void> {
  await apiCall<{ success: boolean }>('POST', 'submitAttendance', {
    dutyId,
    groupId,
    presentMemberIds,
    markedBy,
  });
}

export async function updateGroupApi(
  groupId: string,
  updates: Partial<Pick<Group, 'name' | 'leaderName' | 'pin'>>
): Promise<void> {
  await apiCall<{ success: boolean }>('POST', 'updateGroup', {
    groupId,
    updates,
  });
}

export async function initializeGroupsApi(groups: { id: string; name: string; leaderName: string; pin: string }[]): Promise<void> {
  await apiCall<{ success: boolean }>('POST', 'initializeGroups', {
    groups,
  });
}
