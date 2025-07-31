// ============================================================================
// TIPOS CENTRALIZADOS PARA STEBE CALENDAR APP
// ============================================================================

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: string;
  completedAt?: string;
}

export type TaskType = 'personal' | 'work' | 'meditation';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  status: TaskStatus;
  completed: boolean;
  subtasks?: SubTask[];
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  notes?: string;
  tags?: string[];
  estimatedDuration?: number; // en minutos
  actualDuration?: number; // en minutos
  createdAt: string;
  updatedAt: string;
  userId?: string; // Para funcionalidad futura de usuarios
  sharedWith?: string[]; // Para funcionalidad de compartir
  attachments?: TaskAttachment[];
  reminders?: TaskReminder[];
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link' | 'audio';
  url: string;
  size?: number;
  uploadedAt: string;
}

export interface TaskReminder {
  id: string;
  type: 'notification' | 'email' | 'sms';
  triggerTime: string;
  message?: string;
  sent: boolean;
}

export interface DailyTask {
  title: string;
  type: TaskType;
  subtasks?: string[];
  scheduledTime?: string;
  notes?: string;
  priority?: TaskPriority;
  estimatedDuration?: number;
}

// ============================================================================
// CALENDAR TYPES
// ============================================================================

export interface CalendarDay {
  day: number;
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
  completedTasks: number;
  totalTasks: number;
  completionPercentage: number;
}

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarSettings {
  defaultView: CalendarViewMode;
  startWeekOn: 'sunday' | 'monday';
  timeFormat: '12h' | '24h';
  firstHour: number;
  lastHour: number;
  showWeekNumbers: boolean;
  showCompletedTasks: boolean;
}

// ============================================================================
// APP SETTINGS TYPES
// ============================================================================

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  dailyReminder: boolean;
  taskReminders: boolean;
  deadlineAlerts: boolean;
  completionCelebration: boolean;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
}

export interface AppSettings {
  calendar: CalendarSettings;
  notifications: NotificationSettings;
  theme: ThemeSettings;
  language: string;
  timezone: string;
  backupEnabled: boolean;
  analyticsEnabled: boolean;
}

// ============================================================================
// STATISTICS & ANALYTICS TYPES
// ============================================================================

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  currentStreak: number;
  maxStreak: number;
  activeDays: number;
  averageTasksPerDay: number;
  averageCompletionTime: number;
  mostProductiveHour: number;
  mostProductiveDay: string;
}

export interface ProductivityMetrics {
  daily: TaskStats;
  weekly: TaskStats;
  monthly: TaskStats;
  yearly: TaskStats;
  byType: Record<TaskType, TaskStats>;
  byPriority: Record<TaskPriority, TaskStats>;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskFilters {
  type?: TaskType[];
  priority?: TaskPriority[];
  status?: TaskStatus[];
  completed?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  search?: string;
}

// ============================================================================
// SYNC & BACKUP TYPES
// ============================================================================

export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface BackupData {
  tasks: Task[];
  settings: AppSettings;
  timestamp: string;
  version: string;
  deviceId: string;
}

// ============================================================================
// CALENDAR INTEGRATION TYPES
// ============================================================================

export interface ExternalCalendar {
  id: string;
  name: string;
  provider: 'google' | 'outlook' | 'apple' | 'caldav';
  isConnected: boolean;
  syncEnabled: boolean;
  color: string;
  lastSync?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  attendees?: string[];
  calendarId: string;
  isTaskRelated: boolean;
  taskId?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface AppEvent {
  type: string;
  payload: any;
  timestamp: string;
  source: string;
}

export interface TaskEvent extends AppEvent {
  type: 'task.created' | 'task.updated' | 'task.completed' | 'task.deleted';
  payload: {
    task: Task;
    changes?: Partial<Task>;
  };
}