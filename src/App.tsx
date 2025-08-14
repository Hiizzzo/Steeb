
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import MonthlyCalendarPage from "./pages/MonthlyCalendarPage";
import ChatPage from "./pages/ChatPage";
import MisionesPage from "./pages/MisionesPage";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";
import ProductivityStatsPage from "./pages/ProductivityStatsPage";
import ImagesPage from "./pages/ImagesPage";
import ThemeToggle from "./components/ThemeToggle";

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
        {/* Removed global VersionIndicator; version now shown on LoadingScreen */}
        <BrowserRouter>
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/monthly-calendar" element={<MonthlyCalendarPage />} />
            <Route path="/productivity-stats" element={<ProductivityStatsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/misiones" element={<MisionesPage />} />
            <Route path="/images" element={<ImagesPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
