// ============================================================================
// ANALYTICS HOOK - PRODUCTIVITY METRICS & TRACKING
// ============================================================================
// 
// ⚠️ APP REVIEW NOTE: This analytics system stores ALL data locally in the 
// device's localStorage. NO data is sent to external servers or third parties.
// NO user tracking, NO advertising, NO external analytics services.
// All metrics are calculated client-side for user productivity insights only.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, ProductivityMetrics, TaskStats, TaskType } from '@/types';

interface AnalyticsEvent {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_deleted' | 'session_start' | 'session_end' | 'focus_time';
  timestamp: string;
  data: Record<string, any>;
  sessionId: string;
}

interface FocusSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  taskId?: string;
  interruptions: number;
  productivityScore: number; // 1-10
}

interface ProductivityInsight {
  type: 'peak_hour' | 'productive_day' | 'task_pattern' | 'completion_streak' | 'focus_trend';
  title: string;
  description: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  confidence: number; // 0-1
}

const ANALYTICS_STORAGE_KEY = 'stebe-analytics-events';
const FOCUS_SESSIONS_KEY = 'stebe-focus-sessions';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const useAnalytics = (tasks: Task[] = []) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>(() => {
    try {
      const saved = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    try {
      const saved = localStorage.getItem(FOCUS_SESSIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId] = useState(() => `session-${Date.now()}`);
  const [isTracking, setIsTracking] = useState(false);
  const [currentFocusSession, setCurrentFocusSession] = useState<FocusSession | null>(null);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  // Save focus sessions to localStorage
  useEffect(() => {
    localStorage.setItem(FOCUS_SESSIONS_KEY, JSON.stringify(focusSessions));
  }, [focusSessions]);

  // Track event
  const trackEvent = useCallback((
    type: AnalyticsEvent['type'],
    data: Record<string, any> = {}
  ) => {
    const event: AnalyticsEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      data,
      sessionId: currentSessionId,
    };

    setEvents(prev => [...prev, event]);
    console.log('📊 Analytics event tracked:', type, data);
  }, [currentSessionId]);

  // Track task completion
  const trackTaskCompletion = useCallback((task: Task) => {
    const completionTime = task.completedDate ? new Date(task.completedDate) : new Date();
    const createdTime = new Date(task.createdAt);
    const timeToComplete = Math.round((completionTime.getTime() - createdTime.getTime()) / (1000 * 60)); // minutes

    trackEvent('task_completed', {
      taskId: task.id,
      taskType: task.type,
      priority: task.priority,
      timeToComplete,
      hasSubtasks: !!(task.subtasks && task.subtasks.length > 0),
      subtaskCount: task.subtasks?.length || 0,
      estimatedDuration: task.estimatedDuration,
      actualDuration: task.actualDuration,
      scheduledDate: task.scheduledDate,
      scheduledTime: task.scheduledTime,
      tags: task.tags,
      completionHour: completionTime.getHours(),
      completionDay: completionTime.toLocaleDateString('en-US', { weekday: 'long' }),
    });
  }, [trackEvent]);

  // Track task creation
  const trackTaskCreation = useCallback((task: Task) => {
    trackEvent('task_created', {
      taskId: task.id,
      taskType: task.type,
      priority: task.priority,
      hasSubtasks: !!(task.subtasks && task.subtasks.length > 0),
      subtaskCount: task.subtasks?.length || 0,
      estimatedDuration: task.estimatedDuration,
      scheduledDate: task.scheduledDate,
      scheduledTime: task.scheduledTime,
      tags: task.tags,
      creationHour: new Date().getHours(),
      creationDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    });
  }, [trackEvent]);

  // Start focus session
  const startFocusSession = useCallback((taskId?: string) => {
    const session: FocusSession = {
      id: `focus-${Date.now()}`,
      startTime: new Date().toISOString(),
      taskId,
      interruptions: 0,
      productivityScore: 5, // Initial neutral score
    };

    setCurrentFocusSession(session);
    setIsTracking(true);
    
    trackEvent('session_start', {
      focusSessionId: session.id,
      taskId,
    });
  }, [trackEvent]);

  // End focus session
  const endFocusSession = useCallback((productivityScore: number = 5) => {
    if (!currentFocusSession) return;

    const endTime = new Date().toISOString();
    const duration = Math.round(
      (new Date(endTime).getTime() - new Date(currentFocusSession.startTime).getTime()) / (1000 * 60)
    );

    const completedSession: FocusSession = {
      ...currentFocusSession,
      endTime,
      duration,
      productivityScore,
    };

    setFocusSessions(prev => [...prev, completedSession]);
    setCurrentFocusSession(null);
    setIsTracking(false);

    trackEvent('session_end', {
      focusSessionId: completedSession.id,
      duration,
      productivityScore,
      interruptions: completedSession.interruptions,
      taskId: completedSession.taskId,
    });
  }, [currentFocusSession, trackEvent]);

  // Track interruption
  const trackInterruption = useCallback(() => {
    if (currentFocusSession) {
      setCurrentFocusSession(prev => prev ? {
        ...prev,
        interruptions: prev.interruptions + 1
      } : null);
    }
  }, [currentFocusSession]);

  // Calculate productivity metrics
  const metrics = useMemo((): ProductivityMetrics => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const calculateStats = (taskSubset: Task[]): TaskStats => {
      const totalTasks = taskSubset.length;
      const completedTasks = taskSubset.filter(task => task.completed).length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate streaks
      const completedDates = taskSubset
        .filter(task => task.completed && task.completedDate)
        .map(task => task.completedDate!.split('T')[0])
        .sort();

      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;

      // Current streak
      let checkDate = new Date();
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (completedDates.includes(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Max streak
      for (let i = 0; i < completedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(completedDates[i - 1]);
          const currentDate = new Date(completedDates[i]);
          const diffDays = Math.ceil((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            maxStreak = Math.max(maxStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak);

      const activeDays = new Set(completedDates).size;
      const averageTasksPerDay = activeDays > 0 ? totalTasks / activeDays : 0;

      // Calculate average completion time
      const tasksWithDuration = taskSubset.filter(task => task.actualDuration && task.actualDuration > 0);
      const averageCompletionTime = tasksWithDuration.length > 0
        ? tasksWithDuration.reduce((sum, task) => sum + (task.actualDuration || 0), 0) / tasksWithDuration.length
        : 0;

      // Find most productive hour
      const completionHours = events
        .filter(event => event.type === 'task_completed')
        .map(event => new Date(event.timestamp).getHours());
      
      const hourCounts = completionHours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const mostProductiveHour = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] 
        ? parseInt(Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0][0]) 
        : 9;

      // Find most productive day
      const completionDays = events
        .filter(event => event.type === 'task_completed')
        .map(event => new Date(event.timestamp).toLocaleDateString('en-US', { weekday: 'long' }));
      
      const dayCounts = completionDays.reduce((acc, day) => {
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostProductiveDay = Object.entries(dayCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday';

      return {
        totalTasks,
        completedTasks,
        completionRate,
        currentStreak,
        maxStreak,
        activeDays,
        averageTasksPerDay,
        averageCompletionTime,
        mostProductiveHour,
        mostProductiveDay,
      };
    };

    // Filter tasks by time periods
    const dailyTasks = tasks.filter(task => 
      task.createdAt.split('T')[0] === today
    );

    const weeklyTasks = tasks.filter(task => 
      new Date(task.createdAt) >= thisWeekStart
    );

    const monthlyTasks = tasks.filter(task => 
      new Date(task.createdAt) >= thisMonthStart
    );

    const yearlyTasks = tasks.filter(task => 
      new Date(task.createdAt) >= thisYearStart
    );

    // Calculate stats by type
    const byType = {
      productividad: calculateStats(tasks.filter(task => task.type === 'productividad')),
      creatividad: calculateStats(tasks.filter(task => task.type === 'creatividad')),
      aprendizaje: calculateStats(tasks.filter(task => task.type === 'aprendizaje')),
      organizacion: calculateStats(tasks.filter(task => task.type === 'organizacion')),
      salud: calculateStats(tasks.filter(task => task.type === 'salud')),
      social: calculateStats(tasks.filter(task => task.type === 'social')),
      entretenimiento: calculateStats(tasks.filter(task => task.type === 'entretenimiento')),
      extra: calculateStats(tasks.filter(task => task.type === 'extra')),
    };

    // Calculate stats by priority
    const byPriority = {
      low: calculateStats(tasks.filter(task => task.priority === 'low')),
      medium: calculateStats(tasks.filter(task => task.priority === 'medium')),
      high: calculateStats(tasks.filter(task => task.priority === 'high')),
      urgent: calculateStats(tasks.filter(task => task.priority === 'urgent')),
    };

    return {
      daily: calculateStats(dailyTasks),
      weekly: calculateStats(weeklyTasks),
      monthly: calculateStats(monthlyTasks),
      yearly: calculateStats(yearlyTasks),
      byType,
      byPriority,
    };
  }, [tasks, events]);

  // Generate productivity insights
  const insights = useMemo((): ProductivityInsight[] => {
    const insights: ProductivityInsight[] = [];

    // Peak hour insight
    const mostProductiveHour = metrics.weekly.mostProductiveHour;
    insights.push({
      type: 'peak_hour',
      title: 'Peak Performance Hour',
      description: `You're most productive at ${mostProductiveHour}:00`,
      value: `${mostProductiveHour}:00`,
      trend: 'stable',
      confidence: 0.8,
    });

    // Completion rate trend
    const weeklyRate = metrics.weekly.completionRate;
    const monthlyRate = metrics.monthly.completionRate;
    const rateTrend = weeklyRate > monthlyRate ? 'up' : weeklyRate < monthlyRate ? 'down' : 'stable';
    
    insights.push({
      type: 'task_pattern',
      title: 'Completion Rate',
      description: `${weeklyRate.toFixed(1)}% completion rate this week`,
      value: `${weeklyRate.toFixed(1)}%`,
      trend: rateTrend,
      confidence: 0.7,
    });

    // Focus sessions insight
    const recentSessions = focusSessions.filter(session => 
      new Date(session.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentSessions.length > 0) {
      const avgFocusTime = recentSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / recentSessions.length;
      const avgProductivity = recentSessions.reduce((sum, session) => sum + session.productivityScore, 0) / recentSessions.length;
      
      insights.push({
        type: 'focus_trend',
        title: 'Focus Sessions',
        description: `Average ${avgFocusTime.toFixed(0)} minutes with ${avgProductivity.toFixed(1)}/10 productivity`,
        value: `${avgFocusTime.toFixed(0)}min`,
        trend: avgProductivity > 6 ? 'up' : avgProductivity < 4 ? 'down' : 'stable',
        confidence: 0.6,
      });
    }

    // Streak insight
    const currentStreak = metrics.weekly.currentStreak;
    if (currentStreak > 0) {
      insights.push({
        type: 'completion_streak',
        title: 'Current Streak',
        description: `${currentStreak} day${currentStreak > 1 ? 's' : ''} of completing tasks`,
        value: currentStreak,
        trend: 'up',
        confidence: 0.9,
      });
    }

    return insights;
  }, [metrics, focusSessions]);

  // Get productivity score (0-100)
  const getProductivityScore = useCallback((): number => {
    const weights = {
      completionRate: 0.3,
      consistency: 0.2,
      focusQuality: 0.2,
      streakBonus: 0.15,
      efficiency: 0.15,
    };

    const completionRate = metrics.weekly.completionRate;
    const consistency = metrics.weekly.activeDays / 7 * 100;
    
    const recentSessions = focusSessions.filter(session => 
      new Date(session.startTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const focusQuality = recentSessions.length > 0 
      ? recentSessions.reduce((sum, session) => sum + session.productivityScore, 0) / recentSessions.length * 10
      : 50;

    const streakBonus = Math.min(metrics.weekly.currentStreak * 10, 30);
    
    const efficiency = metrics.weekly.averageCompletionTime > 0 
      ? Math.max(0, 100 - metrics.weekly.averageCompletionTime / 60) 
      : 50;

    const score = 
      completionRate * weights.completionRate +
      consistency * weights.consistency +
      focusQuality * weights.focusQuality +
      streakBonus * weights.streakBonus +
      efficiency * weights.efficiency;

    return Math.round(Math.min(100, Math.max(0, score)));
  }, [metrics, focusSessions]);

  // Export analytics data
  const exportAnalytics = useCallback(() => {
    const exportData = {
      events,
      focusSessions,
      metrics,
      insights,
      productivityScore: getProductivityScore(),
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stebe-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [events, focusSessions, metrics, insights, getProductivityScore]);

  // Clear analytics data
  const clearAnalytics = useCallback((olderThan?: Date) => {
    if (olderThan) {
      setEvents(prev => prev.filter(event => new Date(event.timestamp) > olderThan));
      setFocusSessions(prev => prev.filter(session => new Date(session.startTime) > olderThan));
    } else {
      setEvents([]);
      setFocusSessions([]);
    }
  }, []);

  // Auto-track focus based on user activity
  useEffect(() => {
    let activityTimer: NodeJS.Timeout;
    let lastActivity = Date.now();

    const handleActivity = () => {
      lastActivity = Date.now();
      
      if (isTracking && currentFocusSession) {
        // Check for inactivity (more than 5 minutes = interruption)
        clearTimeout(activityTimer);
        activityTimer = setTimeout(() => {
          const inactiveTime = Date.now() - lastActivity;
          if (inactiveTime > 5 * 60 * 1000) { // 5 minutes
            trackInterruption();
          }
        }, 5 * 60 * 1000);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimeout(activityTimer);
    };
  }, [isTracking, currentFocusSession, trackInterruption]);

  return {
    // Analytics data
    events,
    focusSessions,
    metrics,
    insights,

    // Focus session tracking
    currentFocusSession,
    isTracking,
    startFocusSession,
    endFocusSession,
    trackInterruption,

    // Event tracking
    trackEvent,
    trackTaskCreation,
    trackTaskCompletion,

    // Utilities
    getProductivityScore,
    exportAnalytics,
    clearAnalytics,
  };
};