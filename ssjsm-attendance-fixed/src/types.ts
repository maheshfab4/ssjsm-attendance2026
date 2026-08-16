export interface Member {
  id: string;
  name: string;
  phone: string;
  firmName: string;
  photoUrl: string;
  /**
   * ISO date (YYYY-MM-DD) from which this member's attendance counts.
   * Blank means "always active" — used by members created before this
   * field existed, so their historical attendance is unaffected.
   */
  effectiveFrom: string;
}

export interface Duty {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  title: string;
  description?: string;
}

export interface AttendanceRecord {
  dutyId: string;
  memberId: string;
  present: boolean;
  markedAt: string; // ISO timestamp
}

export interface Group {
  id: string;
  name: string;
  leaderName: string;
  pin: string; // 4-digit PIN for authentication
  members: Member[];
  duties: Duty[];
  attendance: AttendanceRecord[];
}

export type AppView = 'dashboard' | 'group-detail' | 'mark-attendance' | 'attendance-summary' | 'manage-members' | 'manage-duties';
