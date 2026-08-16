import { useState } from 'react';
import { normalizePhotoUrl } from '../utils/photoUrl';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-lg',
  lg: 'w-14 h-14 text-xl',
};

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  const normalizedSrc = normalizePhotoUrl(src);
  const initial = (name || '?').charAt(0).toUpperCase();
  const showImage = normalizedSrc !== '' && !failed;

  return showImage ? (
    <img
      src={normalizedSrc}
      alt={name}
      className={`${sizeClasses[size]} rounded-xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0 ${className}`}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  ) : (
    <div
      className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}
