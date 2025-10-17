/**
 * ============================================================================
 * ⚠️  ADMIN BACKFILL SCREEN - TEMPORAL ⚠️
 * ============================================================================
 *
 * 🚨 MUY IMPORTANTE: Este componente es TEMPORAL y debe ser ELIMINADO
 * después de ejecutar el backfill UNA SOLA VEZ.
 *
 * PROPÓSITO:
 * - Proporcionar una interfaz para ejecutar el backfill de ownerUid
 * - Mostrar estado actual de las colecciones
 * - Reportar progreso y resultados de la operación
 *
 * USO:
 * 1. Navega a /admin/backfill (solo visible en desarrollo)
 * 2. Verifica el estado actual con el botón correspondiente
 * 3. Ejecuta el backfill si es necesario
 * 4. Espera a que complete
 * 5. ELIMINA este archivo y su ruta
 *
 * SEGURIDAD:
 * - Solo funciona si ADMIN_MODE=true
 * - Requiere usuario autenticado
 * - No está disponible en producción
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertCircle,
  Database,
  Play,
  RefreshCw,
  Info,
  Shield,
  Trash2
} from 'lucide-react';

import {
  backfillOwnerUid,
  checkBackfillStatus,
  isBackfillNeeded,
} from '@/admin/backfillOwnerUid';

interface CollectionStatus {
  collection: string;
  total: number;
  hasOwnerUid: number;
  needsOwnerUid: number;
}

interface BackfillResult {
  success: boolean;
  message: string;
  results: {
    collection: string;
    totalDocs: number;
    updatedDocs: number;
    skippedDocs: number;
    errors: string[];
  }[];
}

export default function AdminBackfillScreen() {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<CollectionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [progress, setProgress] = useState<{ collection: string; processed: number; total: number } | null>(null);

  // Verificar si estamos en modo admin
  const isAdminMode = import.meta.env.VITE_ADMIN_MODE === 'true' || import.meta.env.DEV;

  // Verificar si el backfill es necesario al montar
  useEffect(() => {
    if (isAuthenticated && isAdminMode) {
      loadStatus();
    }
  }, [isAuthenticated, isAdminMode]);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      const collectionStatus = await checkBackfillStatus();
      setStatus(collectionStatus);
    } catch (error) {
      console.error('Error cargando estado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBackfill = async () => {
    if (!user) return;

    try {
      setIsRunning(true);
      setResult(null);
      setProgress(null);

      const backfillResult = await backfillOwnerUid((collection, processed, total) => {
        setProgress({ collection, processed, total });
      });

      setResult(backfillResult);

      // Recargar estado después del backfill
      await loadStatus();
    } catch (error) {
      console.error('Error ejecutando backfill:', error);
      setResult({
        success: false,
        message: `Error ejecutando backfill: ${error}`,
        results: [],
      });
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  // Si no estamos en modo admin o no hay usuario autenticado, no mostrar nada
  if (!isAdminMode || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-8">
        <Alert className="max-w-2xl mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acceso denegado. Esta herramienta requiere modo administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalNeedsBackfill = status.reduce((sum, s) => sum + s.needsOwnerUid, 0);
  const isNeeded = totalNeedsBackfill > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header con advertencias */}
        <div className="space-y-4">
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>⚠️ HERRAMIENTA TEMPORAL - USAR UNA SOLA VEZ</strong>
              <br />
              Este componente debe ser eliminado después de ejecutar el backfill correctamente.
            </AlertDescription>
          </Alert>

          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Usuario actual:</strong> {user.email} ({user.id})
              <br />
              <strong>Colecciones a procesar:</strong> tasks, statsDaily, streaks (si existen)
            </AlertDescription>
          </Alert>
        </div>

        {/* Estado actual */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Estado Actual de Colecciones</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStatus}
              disabled={isLoading || isRunning}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin mb-2" />
              <p>Cargando estado de colecciones...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {status.map((collection) => (
                <div key={collection.collection} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{collection.collection}</h3>
                    <div className="flex gap-2">
                      <Badge variant={collection.needsOwnerUid > 0 ? 'destructive' : 'default'}>
                        {collection.needsOwnerUid > 0 ? 'Necesita backfill' : 'OK'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {collection.total} docs
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <span className="ml-2 font-medium">{collection.total}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Con ownerUid:</span>
                      <span className="ml-2 font-medium text-green-600">{collection.hasOwnerUid}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sin ownerUid:</span>
                      <span className="ml-2 font-medium text-red-600">{collection.needsOwnerUid}</span>
                    </div>
                  </div>
                </div>
              ))}

              {status.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No se encontraron colecciones para procesar
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Progreso durante ejecución */}
        {progress && (
          <Card className="p-6 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <h3 className="font-medium mb-2">Ejecutando Backfill...</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Colección: {progress.collection}</span>
                <span>{progress.processed} / {progress.total}</span>
              </div>
              <Progress
                value={(progress.processed / progress.total) * 100}
                className="w-full"
              />
            </div>
          </Card>
        )}

        {/* Resultados */}
        {result && (
          <Card className={`p-6 ${result.success ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}`}>
            <div className="flex items-center gap-2 mb-4">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <h3 className="font-semibold">Resultados del Backfill</h3>
            </div>

            <p className="mb-4">{result.message}</p>

            {result.results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Detalles por colección:</h4>
                {result.results.map((collectionResult) => (
                  <div key={collectionResult.collection} className="border rounded p-3 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{collectionResult.collection}</span>
                      {collectionResult.errors.length === 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <span>Total: {collectionResult.totalDocs}</span>
                      <span className="text-green-600">Actualizados: {collectionResult.updatedDocs}</span>
                      <span className="text-gray-600">Omitidos: {collectionResult.skippedDocs}</span>
                      <span className="text-red-600">Errores: {collectionResult.errors.length}</span>
                    </div>

                    {collectionResult.errors.length > 0 && (
                      <div className="mt-2 text-xs text-red-600">
                        <strong>Errores:</strong>
                        <ul className="list-disc list-inside">
                          {collectionResult.errors.slice(0, 3).map((error, i) => (
                            <li key={i} className="truncate">{error}</li>
                          ))}
                          {collectionResult.errors.length > 3 && (
                            <li>...y {collectionResult.errors.length - 3} más</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Acciones */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-semibold mb-2">Acciones de Backfill</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isNeeded
                  ? `Hay ${totalNeedsBackfill} documentos que necesitan ownerUid.`
                  : 'Todos los documentos ya tienen ownerUid.'
                }
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRunBackfill}
                disabled={!isNeeded || isRunning || isLoading}
                className="min-w-[140px]"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {isNeeded ? 'Correr Backfill' : 'Backfill Completo'}
                  </>
                )}
              </Button>

              {result?.success && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres eliminar este componente temporal?')) {
                      alert('Elimina manualmente:\n- src/screens/admin/AdminBackfillScreen.tsx\n- src/admin/backfillOwnerUid.ts\n- La ruta /admin/backfill\n- El flag ADMIN_MODE del .env');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Guía de Eliminación
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Instrucciones finales */}
        {result?.success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>✅ Backfill completado exitosamente.</strong>
              <br />
              Ahora puedes eliminar este componente temporal y el archivo de backfill.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}