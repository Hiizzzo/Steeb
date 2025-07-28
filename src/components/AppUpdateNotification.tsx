import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface AppUpdateNotificationProps {
  isServiceWorkerReady: boolean;
  triggerBackup: () => Promise<any>;
  exportTasks: () => void;
}

const AppUpdateNotification: React.FC<AppUpdateNotificationProps> = ({
  isServiceWorkerReady,
  triggerBackup,
  exportTasks
}) => {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { toast } = useToast();

  // Check for app updates
  useEffect(() => {
    if (!isServiceWorkerReady) return;

    const handleUpdateAvailable = () => {
      console.log('🔄 Actualización de la app disponible');
      setUpdateAvailable(true);
      setShowUpdateNotification(true);
    };

    // Listen for service worker update events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleUpdateAvailable);
      
      // Check for updates periodically
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && registration.waiting) {
            handleUpdateAvailable();
          }
        } catch (error) {
          console.warn('⚠️ Error al verificar actualizaciones:', error);
        }
      };

      // Check immediately and then every 5 minutes
      checkForUpdates();
      const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleUpdateAvailable);
        clearInterval(interval);
      };
    }
  }, [isServiceWorkerReady]);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      await triggerBackup();
      toast({
        title: "✅ Backup creado",
        description: "Tus tareas están respaldadas de forma segura.",
      });
    } catch (error) {
      console.error('Error al crear backup:', error);
      toast({
        title: "⚠️ Error en backup",
        description: "No se pudo crear el backup automático.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExportBackup = () => {
    try {
      exportTasks();
      toast({
        title: "📤 Backup exportado",
        description: "Archivo de respaldo descargado exitosamente.",
      });
    } catch (error) {
      console.error('Error al exportar backup:', error);
      toast({
        title: "❌ Error al exportar",
        description: "No se pudo descargar el archivo de respaldo.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateApp = async () => {
    // Create backup before updating
    await handleCreateBackup();
    
    // Reload the page to activate the new service worker
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setShowUpdateNotification(false);
    
    // Show again in 30 minutes if update is still available
    setTimeout(() => {
      if (updateAvailable) {
        setShowUpdateNotification(true);
      }
    }, 30 * 60 * 1000);
  };

  return (
    <AnimatePresence>
      {showUpdateNotification && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-blue-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">
                  Actualización disponible
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Hay una nueva versión de Stebe disponible. Tus tareas se mantendrán seguras durante la actualización.
            </p>
            
            <div className="space-y-2">
              <Button
                onClick={handleUpdateApp}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={isBackingUp}
              >
                {isBackingUp ? (
                  <>
                    <Shield className="w-4 h-4 mr-2 animate-spin" />
                    Creando backup...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar ahora
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleExportBackup}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar backup
              </Button>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 flex items-center">
              <Shield className="w-3 h-3 mr-1 text-green-500" />
              Tu progreso se guardará automáticamente
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppUpdateNotification;