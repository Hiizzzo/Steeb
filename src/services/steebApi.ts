const BASE_URL = import.meta.env.VITE_API_URL || 'https://v0-steeb-api-backend-production.up.railway.app/api';

const API_ENDPOINT = `${BASE_URL}/steeb`;
const SHINY_GAME_ENDPOINT = `${BASE_URL}/shiny-game`;
const SHINY_STATUS_ENDPOINT = `${BASE_URL}/users/shiny-status`;
const SHINY_STATS_ENDPOINT = `${BASE_URL}/shiny-stats`;
const USER_PROFILE_ENDPOINT = `${BASE_URL}/users/profile`;
const USER_ID_STORAGE_KEY = 'steeb-user-id';

const ACTION_TYPES: SteebActionType[] = [
  'OPEN_CALENDAR',
  'OPEN_TASKS',
  'OPEN_PROGRESS',
  'CREATE_TASK',
  'BUY_DARK_MODE',
  'BUY_SHINY_ROLLS',
  'PLAY_SHINY_GAME',
  'SHOW_MOTIVATION',
  'GET_SHINY_STATS',
  'UPDATE_USER_PROFILE',
  'SEND_NOTIFICATION',
  'SCHEDULE_REMINDER'
];

const normalizeActions = (raw: any): SteebAction[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((action) => {
      if (!action || typeof action !== 'object') return null;
      const typeValue = typeof action.type === 'string' ? action.type.toUpperCase() : '';
      const matched = ACTION_TYPES.find((allowed) => allowed === typeValue);
      if (!matched) return null;
      const payload = action.payload && typeof action.payload === 'object' ? action.payload : {};
      return { type: matched, payload };
    })
    .filter(Boolean) as SteebAction[];
};

export type SteebActionType =
  | 'OPEN_CALENDAR'
  | 'OPEN_TASKS'
  | 'OPEN_PROGRESS'
  | 'CREATE_TASK'
  | 'BUY_DARK_MODE'
  | 'BUY_SHINY_ROLLS'
  | 'PLAY_SHINY_GAME'
  | 'SHOW_MOTIVATION'
  | 'GET_SHINY_STATS'
  | 'UPDATE_USER_PROFILE'
  | 'UPDATE_USER_PROFILE_REMOTE'
  | 'SEND_NOTIFICATION'
  | 'SCHEDULE_REMINDER';

export interface SteebAction {
  type: SteebActionType;
  payload?: Record<string, any>;
}

export async function fetchUserProfileRemote(userId: string) {
  const res = await fetch(`${USER_PROFILE_ENDPOINT}?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  const data = await res.json();
  return data.profile || {};
}

export async function saveUserProfileRemote(userId: string, profile: any) {
  const res = await fetch(USER_PROFILE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...profile })
  });
  if (!res.ok) throw new Error('Failed to save user profile');
  const data = await res.json();
  return data.profile || {};
}
