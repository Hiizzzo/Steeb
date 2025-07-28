// ============================================================================
// SETTINGS HOOK - ADVANCED APP CONFIGURATION
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { AppSettings, CalendarSettings, NotificationSettings, ThemeSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  calendar: {
    defaultView: 'month',
    startWeekOn: 'monday',
    timeFormat: '24h',
    firstHour: 6,
    lastHour: 22,
    showWeekNumbers: false,
    showCompletedTasks: true,
  },
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
    dailyReminder: true,
    taskReminders: true,
    deadlineAlerts: true,
    completionCelebration: true,
  },
  theme: {
    mode: 'auto',
    accentColor: '#3b82f6',
    fontSize: 'medium',
    reduceMotion: false,
  },
  language: 'es',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  backupEnabled: true,
  analyticsEnabled: true,
};

const SETTINGS_STORAGE_KEY = 'stebe-app-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure all properties exist
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          calendar: { ...DEFAULT_SETTINGS.calendar, ...parsed.calendar },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
          theme: { ...DEFAULT_SETTINGS.theme, ...parsed.theme },
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Save settings to localStorage
  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setIsLoading(true);
    
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      
      // Also save to IndexedDB for backup
      if ('indexedDB' in window) {
        const dbRequest = indexedDB.open('StebeSettingsDB', 1);
        
        dbRequest.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
        };
        
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const transaction = db.transaction(['settings'], 'readwrite');
          const store = transaction.objectStore('settings');
          
          store.put({
            id: 'app-settings',
            settings: newSettings,
            timestamp: new Date().toISOString(),
          });
        };
      }
      
      setSettings(newSettings);
      setHasUnsavedChanges(false);
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update specific setting section
  const updateCalendarSettings = useCallback(async (updates: Partial<CalendarSettings>) => {
    const newSettings = {
      ...settings,
      calendar: { ...settings.calendar, ...updates },
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const updateNotificationSettings = useCallback(async (updates: Partial<NotificationSettings>) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, ...updates },
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const updateThemeSettings = useCallback(async (updates: Partial<ThemeSettings>) => {
    const newSettings = {
      ...settings,
      theme: { ...settings.theme, ...updates },
    };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  const updateGeneralSettings = useCallback(async (updates: {
    language?: string;
    timezone?: string;
    backupEnabled?: boolean;
    analyticsEnabled?: boolean;
  }) => {
    const newSettings = { ...settings, ...updates };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  // Reset specific section
  const resetCalendarSettings = useCallback(async () => {
    await updateCalendarSettings(DEFAULT_SETTINGS.calendar);
  }, [updateCalendarSettings]);

  const resetNotificationSettings = useCallback(async () => {
    await updateNotificationSettings(DEFAULT_SETTINGS.notifications);
  }, [updateNotificationSettings]);

  const resetThemeSettings = useCallback(async () => {
    await updateThemeSettings(DEFAULT_SETTINGS.theme);
  }, [updateThemeSettings]);

  // Export settings
  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stebe-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [settings]);

  // Import settings
  const importSettings = useCallback(async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate imported settings structure
      if (typeof importedSettings !== 'object' || !importedSettings.calendar || !importedSettings.notifications || !importedSettings.theme) {
        throw new Error('Invalid settings file format');
      }
      
      // Merge with defaults to ensure all properties exist
      const validatedSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...importedSettings,
        calendar: { ...DEFAULT_SETTINGS.calendar, ...importedSettings.calendar },
        notifications: { ...DEFAULT_SETTINGS.notifications, ...importedSettings.notifications },
        theme: { ...DEFAULT_SETTINGS.theme, ...importedSettings.theme },
      };
      
      await saveSettings(validatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }, [saveSettings]);

  // Sync settings across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY && event.newValue) {
        try {
          const newSettings = JSON.parse(event.newValue);
          setSettings(newSettings);
          console.log('🔄 Settings synced from another tab');
        } catch (error) {
          console.warn('Failed to sync settings from another tab:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Apply theme settings to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      // Apply theme mode
      if (settings.theme.mode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', settings.theme.mode === 'dark');
      }
      
      // Apply accent color
      root.style.setProperty('--accent-color', settings.theme.accentColor);
      
      // Apply font size
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px',
      };
      root.style.setProperty('--base-font-size', fontSizeMap[settings.theme.fontSize]);
      
      // Apply motion preferences
      if (settings.theme.reduceMotion) {
        root.style.setProperty('--animation-duration', '0s');
        root.style.setProperty('--transition-duration', '0s');
      } else {
        root.style.removeProperty('--animation-duration');
        root.style.removeProperty('--transition-duration');
      }
    };

    applyTheme();

    // Listen for system theme changes when mode is auto
    if (settings.theme.mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // Apply timezone settings
  useEffect(() => {
    // Store timezone for date/time operations
    window.__STEBE_TIMEZONE__ = settings.timezone;
  }, [settings.timezone]);

  // Mark as having unsaved changes when settings are updated locally
  const updateSettingsLocally = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Auto-save after delay when there are unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveSettings(settings);
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, settings, saveSettings]);

  // Get current effective theme (resolving 'auto' mode)
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (settings.theme.mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme.mode;
  }, [settings.theme.mode]);

  // Validate settings
  const validateSettings = useCallback((settingsToValidate: Partial<AppSettings>): string[] => {
    const errors: string[] = [];
    
    if (settingsToValidate.calendar) {
      const { firstHour, lastHour } = settingsToValidate.calendar;
      if (firstHour !== undefined && (firstHour < 0 || firstHour > 23)) {
        errors.push('First hour must be between 0 and 23');
      }
      if (lastHour !== undefined && (lastHour < 0 || lastHour > 23)) {
        errors.push('Last hour must be between 0 and 23');
      }
      if (firstHour !== undefined && lastHour !== undefined && firstHour >= lastHour) {
        errors.push('First hour must be before last hour');
      }
    }
    
    if (settingsToValidate.theme?.accentColor) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(settingsToValidate.theme.accentColor)) {
        errors.push('Accent color must be a valid hex color');
      }
    }
    
    return errors;
  }, []);

  // Get settings summary for display
  const getSettingsSummary = useCallback(() => {
    return {
      theme: `${getEffectiveTheme()} mode`,
      notifications: settings.notifications.enabled ? 'Enabled' : 'Disabled',
      calendar: `${settings.calendar.defaultView} view, ${settings.calendar.timeFormat} time`,
      language: settings.language.toUpperCase(),
      timezone: settings.timezone,
      backup: settings.backupEnabled ? 'Enabled' : 'Disabled',
      analytics: settings.analyticsEnabled ? 'Enabled' : 'Disabled',
    };
  }, [settings, getEffectiveTheme]);

  // Check if settings are at defaults
  const isAtDefaults = useCallback(() => {
    return JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS);
  }, [settings]);

  // Get setting by path (e.g., 'theme.mode', 'calendar.defaultView')
  const getSetting = useCallback((path: string) => {
    return path.split('.').reduce((obj: any, key) => obj?.[key], settings);
  }, [settings]);

  // Set setting by path
  const setSetting = useCallback(async (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    
    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  return {
    // Current settings
    settings,
    isLoading,
    hasUnsavedChanges,

    // Update methods
    saveSettings,
    updateCalendarSettings,
    updateNotificationSettings,
    updateThemeSettings,
    updateGeneralSettings,
    updateSettingsLocally,

    // Reset methods
    resetSettings,
    resetCalendarSettings,
    resetNotificationSettings,
    resetThemeSettings,

    // Import/Export
    exportSettings,
    importSettings,

    // Utilities
    getEffectiveTheme,
    validateSettings,
    getSettingsSummary,
    isAtDefaults,
    getSetting,
    setSetting,

    // Constants
    defaultSettings: DEFAULT_SETTINGS,
  };
};

// ============================================================================
// SETTINGS PRESETS
// ============================================================================

export const SETTINGS_PRESETS = {
  // Productivity-focused preset
  productivity: {
    ...DEFAULT_SETTINGS,
    calendar: {
      ...DEFAULT_SETTINGS.calendar,
      defaultView: 'day' as const,
      timeFormat: '24h' as const,
      firstHour: 7,
      lastHour: 20,
      showWeekNumbers: true,
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      taskReminders: true,
      deadlineAlerts: true,
      completionCelebration: false,
    },
    theme: {
      ...DEFAULT_SETTINGS.theme,
      mode: 'light' as const,
      reduceMotion: true,
    },
  },

  // Minimal preset
  minimal: {
    ...DEFAULT_SETTINGS,
    calendar: {
      ...DEFAULT_SETTINGS.calendar,
      defaultView: 'month' as const,
      showWeekNumbers: false,
      showCompletedTasks: false,
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      sound: false,
      vibration: false,
      completionCelebration: false,
    },
    theme: {
      ...DEFAULT_SETTINGS.theme,
      mode: 'light' as const,
      accentColor: '#6b7280',
      reduceMotion: true,
    },
  },

  // Dark mode enthusiast
  darkMode: {
    ...DEFAULT_SETTINGS,
    calendar: {
      ...DEFAULT_SETTINGS.calendar,
      defaultView: 'week' as const,
    },
    theme: {
      ...DEFAULT_SETTINGS.theme,
      mode: 'dark' as const,
      accentColor: '#8b5cf6',
    },
  },

  // Accessibility-focused
  accessibility: {
    ...DEFAULT_SETTINGS,
    theme: {
      ...DEFAULT_SETTINGS.theme,
      fontSize: 'large' as const,
      reduceMotion: true,
      accentColor: '#059669', // High contrast green
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      sound: false,
      vibration: true,
    },
  },
} as const;

// Hook to apply presets
export const useSettingsPresets = () => {
  const { saveSettings } = useSettings();

  const applyPreset = useCallback(async (presetName: keyof typeof SETTINGS_PRESETS) => {
    const preset = SETTINGS_PRESETS[presetName];
    await saveSettings(preset);
  }, [saveSettings]);

  return {
    presets: SETTINGS_PRESETS,
    applyPreset,
  };
};