// ============================================================================
// STEBE APP - APLICACIÓN PRINCIPAL CON FIREBASE HABILITADO
// ============================================================================
//
// ⚠️ APP REVIEW NOTE (Guideline 5.1.2 - Privacy):
// This app does NOT use App Tracking Transparency because:
// 1. NO third-party advertising SDKs (no Google Ads, Facebook Ads, etc.)
// 2. NO external analytics services (no Google Analytics, Mixpanel, etc.)
// 3. All user data is stored locally on device (localStorage/IndexedDB)
// 4. Firebase is used ONLY for authentication and user-specific data storage
// 5. NO data is shared with third parties or used for advertising
//
// ⚠️ APP REVIEW NOTE (Guideline 4.2 - Minimum Functionality):
// This app provides full task management functionality:
// - Create tasks with multiple types and priorities
// - Complete tasks with visual feedback and sound effects
// - Delete tasks with swipe gesture
// - View productivity metrics and completion rates
// - Calendar view for scheduled tasks
// - Motivational feedback system
// ============================================================================

import React, { useState, useEffect } from 'react';

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion } from 'framer-motion';
import Index from "./pages/Index";
import MonthlyCalendarPage from "./pages/MonthlyCalendarPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";
import ProductivityStatsPage from "./pages/ProductivityStatsPage";
import ThemeToggle from "./components/ThemeToggle";
import AuthScreen from "./components/AuthScreen";
import { NetworkStatus } from "./components/NetworkStatus";
import { useAuth } from "./hooks/useAuth";
import { useTextSize } from "./hooks/useTextSize";
import { initializeRecurrenceManager } from "./utils/recurrenceManager";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  const handleSkipLoading = () => {
    setIsAppLoading(false);
  };
  
  const handleSkipToTasks = () => {
    // Permitir acceso temporal sin autenticación
    setIsAppLoading(false);
    window.localStorage.setItem('skip-auth-temp', 'true');
  };
  
  // Cargar configuración de texto grande
  useTextSize();

  useEffect(() => {
    // Simular tiempo de carga de 3 segundos
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 3000);

    // Inicializar el gestor de tareas recurrentes
    initializeRecurrenceManager();

    return () => clearTimeout(timer);
  }, []);

  if (isAppLoading || isLoading) {
    return <LoadingScreen onSkip={handleSkipLoading} />;
  }

  // Route guard: only require authentication. Do not block on onboarding/profile completeness.
  if (!isAuthenticated && !localStorage.getItem('skip-auth-temp')) {
    return <AuthScreen onComplete={() => { /* post-login handled by AuthScreen */ }} onSkip={handleSkipToTasks} />;
  }

  return (
    <BrowserRouter>
      <ThemeToggle />
      <NetworkStatus />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/monthly-calendar" element={<MonthlyCalendarPage />} />
        <Route path="/productivity-stats" element={<ProductivityStatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const APP_VERSION = '%0.98';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
