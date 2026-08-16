import { Member } from '../types';
import { Phone, Building2, Trash2, Edit2, CalendarClock } from 'lucide-react';
import { formatEffectiveFrom } from '../utils/attendance';
import Avatar from './Avatar';

interface MemberCardProps {
  member: Member;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}

export default function MemberCard({ member, onEdit, onDelete, canEdit }: MemberCardProps) {
  const since = formatEffectiveFrom(member.effectiveFrom);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-all group">
      <div className="flex items-start gap-4">
        {/* Photo / Avatar */}
        <div className="flex-shrink-0">
          <Avatar src={member.photoUrl} name={member.name} size="lg" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">{member.name}</h4>
          <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{member.phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-sm">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{member.firmName || 'No firm'}</span>
          </div>
          {since && (
            <div className="flex items-center gap-1.5 mt-1 text-indigo-600 text-xs">
              <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Counts from {since}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
