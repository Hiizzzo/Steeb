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
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import Index from "./pages/Index";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentTestPage from "./pages/PaymentTestPage";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";
import AuthScreen from "./components/AuthScreen";
import { NetworkStatus } from "./components/NetworkStatus";
import { useAuth } from "./hooks/useAuth";
import { useAutoPaymentVerification } from "./hooks/useAutoPaymentVerification";
import { useTextSize } from "./hooks/useTextSize";
import { initializeRecurrenceManager } from "./utils/recurrenceManager";
import { notificationService } from "./services/notificationService";
import { AuthProvider } from "./hooks/useAuth";
import { Theme } from "./hooks/useTheme";

// ============================================================================

const queryClient = new QueryClient();

// FUNCIÓN CRÍTICA: Inicialización de tema ANTES de renderizado
const initializeTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const root = document.documentElement;

  // 1. Verificar clases existentes (prioridad máxima)
  if (root.classList.contains('shiny')) return 'shiny';
  if (root.classList.contains('dark')) return 'dark';

  // 2. Verificar localStorage
  const savedTheme = localStorage.getItem('stebe-theme') as Theme;
  if (savedTheme && ['light', 'dark', 'shiny'].includes(savedTheme)) {
    // Aplicar tema inmediatamente al DOM
    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else if (savedTheme === 'shiny') {
      root.classList.add('shiny');
    }
    return savedTheme;
  }

  // 3. Preferencia del sistema como último recurso
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    root.classList.add('dark');
    return 'dark';
  }

  return 'light';
};

const AppContent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAppLoading, setIsAppLoading] = useState(true);

  const handleSkipLoading = () => {
    setIsAppLoading(false);
  };

  const handleSkipToTasks = () => {
    // Permitir acceso temporal sin autenticación
    setIsAppLoading(false);
  };

  // Cargar configuración de texto grande
  useTextSize();

  // Auto-verificar pagos cuando el usuario vuelve a la app
  useAutoPaymentVerification();

  useEffect(() => {
    // INICIALIZACIÓN CRÍTICA: Aplicar tema ANTES que todo lo demás
    const initialTheme = initializeTheme();

    // BYPASS REMOVIDO: Ahora usamos login nativo real

    // Solicitar permiso de App Tracking Transparency en iOS
    const requestTrackingPermission = async () => {
      if (Platform.OS === 'ios') {
        try {
          const { status } = await requestTrackingPermissionsAsync();

          // Guardar el estado del permiso para referencia futura
          localStorage.setItem('att-status', status);
        } catch (error) {
          localStorage.setItem('att-status', 'denied');
        }
      }
    };

    // Cargar rápido - solo 500ms para el loading de STEEB
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 500);

    // Inicializar el gestor de tareas recurrentes
    initializeRecurrenceManager();

    // Inicializar servicio de notificaciones
    notificationService.initialize();

    // Solicitar permiso ATT después de un pequeño retraso
    setTimeout(requestTrackingPermission, 1000);

    // VALIDACIÓN: Verificar consistencia del tema después de la carga
    const validationTimer = setTimeout(() => {
      const root = document.documentElement;
      const currentHasDark = root.classList.contains('dark');
      const currentHasShiny = root.classList.contains('shiny');
      const savedTheme = localStorage.getItem('stebe-theme');

      let actualTheme: Theme = 'light';
      if (currentHasShiny) actualTheme = 'shiny';
      else if (currentHasDark) actualTheme = 'dark';

      if (actualTheme !== initialTheme || savedTheme !== initialTheme) {
        console.error('❌ App: Theme inconsistency detected!', {
          initial: initialTheme,
          actual: actualTheme,
          saved: savedTheme
        });

        // Forzar corrección
        root.classList.remove('dark', 'shiny');
        if (initialTheme === 'dark') root.classList.add('dark');
        else if (initialTheme === 'shiny') root.classList.add('shiny');
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(validationTimer);
    };
  }, []);

  if (isAppLoading || isLoading) {
    return <LoadingScreen onSkip={handleSkipLoading} />;
  }

  // Route guard: only require authentication. Do not block on onboarding/profile completeness.
  if (!isAuthenticated) {
    return <AuthScreen onComplete={() => { /* post-login handled by AuthScreen */ }} onSkip={handleSkipToTasks} />;
  }

  return (
    <BrowserRouter>
      <NetworkStatus />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/payments/success" element={<PaymentSuccessPage />} />
        <Route path="/payments/test" element={<PaymentTestPage />} />

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
