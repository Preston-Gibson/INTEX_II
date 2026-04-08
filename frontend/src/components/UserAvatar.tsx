import { useState, useEffect } from 'react';
import { getUser } from '../utils/auth';
import { authHeaders } from '../utils/auth';
import EditProfilePanel from './EditProfilePanel';

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5229'}/api/auth/me`;

interface Props {
  showLabel?: boolean;
}

interface RemoteProfile {
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
}

export default function UserAvatar({ showLabel = true }: Props) {
  const jwtUser = getUser();

  const [profile, setProfile] = useState<RemoteProfile>({
    firstName: jwtUser?.firstName ?? '',
    lastName:  jwtUser?.lastName  ?? '',
    profilePictureUrl: null,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  // Fetch fresh profile (including picture) from API
  useEffect(() => {
    fetch(API, { headers: authHeaders() })
      .then(r => r.json())
      .then((data: RemoteProfile) => setProfile(data))
      .catch(() => {});
  }, []);

  const nameParts  = [profile.firstName, profile.lastName].filter(Boolean);
  const fullName   = nameParts.length > 0
    ? nameParts.join(' ')
    : jwtUser?.email?.split('@')[0] ?? 'User';
  const initials   = nameParts.length > 0
    ? nameParts.map(p => p.charAt(0)).join('').toUpperCase()
    : fullName.charAt(0).toUpperCase();
  const roleLabel  = jwtUser?.role ?? 'Portal';

  function handleSaved(updated: RemoteProfile) {
    setProfile(updated);
  }

  return (
    <>
      <button
        onClick={() => setPanelOpen(true)}
        className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-surface-container-low transition-colors"
        title="Edit profile"
      >
        {/* Avatar circle or picture */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary">
          {profile.profilePictureUrl ? (
            <img src={profile.profilePictureUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {showLabel && (
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface leading-tight">{fullName}</p>
            <p className="text-[10px] text-secondary font-semibold">{roleLabel}</p>
          </div>
        )}
      </button>

      {panelOpen && (
        <EditProfilePanel
          onClose={() => setPanelOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
