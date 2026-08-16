import { useState } from 'react';
import { Member } from '../types';
import { UserPlus, X, Camera, CalendarClock } from 'lucide-react';
import { todayISO, toISODate } from '../utils/attendance';

interface AddMemberFormProps {
  onAdd: (member: Omit<Member, 'id'>) => void;
  onCancel: () => void;
  editMember?: Member;
  onEdit?: (memberId: string, updates: Partial<Member>) => void;
}

export default function AddMemberForm({ onAdd, onCancel, editMember, onEdit }: AddMemberFormProps) {
  const [name, setName] = useState(editMember?.name || '');
  const [phone, setPhone] = useState(editMember?.phone || '');
  const [firmName, setFirmName] = useState(editMember?.firmName || '');
  const [photoUrl, setPhotoUrl] = useState(editMember?.photoUrl || '');
  // New members default to today. Editing an existing member with a blank
  // value keeps it blank unless the user picks a date (blank = all duties).
  const [effectiveFrom, setEffectiveFrom] = useState(
    editMember ? toISODate(editMember.effectiveFrom) : todayISO()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editMember && onEdit) {
      onEdit(editMember.id, {
        name: name.trim(),
        phone: phone.trim(),
        firmName: firmName.trim(),
        photoUrl: photoUrl.trim(),
        effectiveFrom: toISODate(effectiveFrom),
      });
    } else {
      onAdd({
        name: name.trim(),
        phone: phone.trim(),
        firmName: firmName.trim(),
        photoUrl: photoUrl.trim(),
        effectiveFrom: toISODate(effectiveFrom) || todayISO(),
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-bold">{editMember ? 'Edit Member' : 'Add New Member'}</h2>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo */}
          <div className="flex justify-center">
            <label className="cursor-pointer group">
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {photoUrl ? (
                <div className="relative">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200"
                  />
                  <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] mt-1">Photo</span>
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter member name"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter mobile number"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Firm Name</label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="Enter firm / company name"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1">
              <CalendarClock className="w-4 h-4 text-indigo-500" />
              Attendance counts from
            </label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Duties before this date won't ask for this member, so you don't have to
              resubmit attendance you've already saved.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL (optional)</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
            />
            <div className="text-xs text-slate-500 mt-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <strong className="text-amber-700">For Google Drive photos:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-0.5 text-amber-800">
                <li>Right-click image → Share</li>
                <li>Change to "Anyone with the link"</li>
                <li>Copy link and paste here</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              {editMember ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
