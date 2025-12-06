export interface LocalUserProfile {
  name?: string;
  nickname?: string;
  availabilityNote?: string;
  busyLevel?: string;
  morningPlan?: string;
  afternoonPlan?: string;
  nightPlan?: string;
  transcriptText?: string;
  lastUpdated?: string;
}

const buildKey = (userId?: string) => (userId ? `steeb-profile-${userId}` : null);

export const getLocalUserProfile = (userId?: string): LocalUserProfile | null => {
  if (typeof window === 'undefined') return null;
  const key = buildKey(userId);
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as LocalUserProfile;
  } catch {
    return null;
  }
};

export const saveLocalUserProfile = (
  userId: string,
  updates: Partial<LocalUserProfile>
): LocalUserProfile | null => {
  if (typeof window === 'undefined') return null;
  const key = buildKey(userId);
  if (!key) return null;
  try {
    const existing = getLocalUserProfile(userId) || {};
    const next: LocalUserProfile = {
      ...existing,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    window.localStorage.setItem(key, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
};
