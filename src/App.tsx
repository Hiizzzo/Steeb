// ============================================================================
// STEBE APP - MODO OFFLINE TEMPORAL PARA VERSIÓN SHINY
// Firebase/Firestore deshabilitado temporalmente para desarrollo offline
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
    // Simular usuario autenticado temporal para modo offline
    setIsAppLoading(false);
    // En modo offline, el usuario ya está configurado como null en useAuth
    // pero necesitamos forzar que la aplicación se muestre
    window.localStorage.setItem('skip-auth-temp', 'true');
    window.location.reload();
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
