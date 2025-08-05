
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import CompletedTasksPage from "./pages/CompletedTasksPage";
import ImageManager from "./pages/ImageManager";
import MonthlyCalendarPage from "./pages/MonthlyCalendarPage";
import IPhoneCalendarDemo from "./pages/iPhoneCalendarDemo";
import EnhancedCalendarPage from "./pages/EnhancedCalendarPage";
import ChatPage from "./pages/ChatPage";

import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular tiempo de carga de 3 segundos
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/completed-tasks" element={<CompletedTasksPage />} />
            <Route path="/image-manager" element={<ImageManager />} />
            <Route path="/monthly-calendar" element={<MonthlyCalendarPage />} />
            <Route path="/iphone-calendar-demo" element={<IPhoneCalendarDemo />} />
            <Route path="/enhanced-calendar" element={<EnhancedCalendarPage />} />
            <Route path="/chat" element={<ChatPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
