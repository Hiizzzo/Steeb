
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { lazy, Suspense } from "react";
import LoadingScreen from "./components/LoadingScreen";

// Lazy loading para optimizar el bundle inicial
const Index = lazy(() => import("./pages/Index"));
const StatsNew = lazy(() => import("./pages/StatsNew"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000,   // 10 minutos (antes cacheTime)
    },
  },
});

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carga optimizada: esperar a que los recursos críticos estén listos
    const checkResourcesReady = () => {
      // Verificar que el DOM esté listo y las fuentes cargadas
      if (document.readyState === 'complete') {
        // Pequeño delay para asegurar que todo esté renderizado
        setTimeout(() => {
          setIsLoading(false);
        }, 300); // Reducido de 3000ms a 300ms
      } else {
        // Si aún no está listo, esperar al evento load
        window.addEventListener('load', () => {
          setTimeout(() => {
            setIsLoading(false);
          }, 200);
        }, { once: true });
      }
    };

    checkResourcesReady();
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
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/estadisticas" element={<StatsNew />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
