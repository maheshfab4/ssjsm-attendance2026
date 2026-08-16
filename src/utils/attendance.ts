import { Group, Member, Duty } from '../types';

/** Today as 'YYYY-MM-DD' in the user's local timezone. */
export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Normalises anything (Date, text, blank) into 'YYYY-MM-DD'.
 * Returns '' when there is no usable date.
 */
export function toISODate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const str = String(value).trim();
  if (!str) return '';

  // Already correct — don't round-trip through Date (timezone shifts).
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return '';
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Was this member active on the given date?
 *
 * A blank effectiveFrom means "always active", so every member that existed
 * before this feature keeps behaving exactly as before. A blank duty date
 * also returns true — we never hide someone because of a malformed date.
 */
export function isMemberActiveOn(member: Member, date: string): boolean {
  const from = toISODate(member.effectiveFrom);
  if (!from) return true;
  const on = toISODate(date);
  if (!on) return true;
  return on >= from; // string compare is safe for YYYY-MM-DD
}

/** The members who should appear on the attendance sheet for this duty. */
export function rosterForDuty(group: Group, duty: Duty | undefined): Member[] {
  if (!duty) return group.members;
  return group.members.filter((m) => isMemberActiveOn(m, duty.date));
}

/** Same as above, but looked up by duty id. */
export function rosterForDutyId(group: Group, dutyId: string): Member[] {
  return rosterForDuty(group, group.duties.find((d) => d.id === dutyId));
}

/** The duties a given member is actually expected to attend. */
export function dutiesForMember(group: Group, member: Member): Duty[] {
  return group.duties.filter((d) => isMemberActiveOn(member, d.date));
}

/** For display: 'Jan 2026' style label, or null when blank. */
export function formatEffectiveFrom(value: string | undefined): string | null {
  const iso = toISODate(value);
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
