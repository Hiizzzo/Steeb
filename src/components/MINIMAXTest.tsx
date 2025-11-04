import React, { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { testMINIMAXConnection, minimaxConfig } from '@/config/minimax.config';

const MINIMAXTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [response, setResponse] = useState<string>('');

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setResponse('');

    try {
      console.log('🧪 Iniciando prueba de MINIMAX M2...');
      const result = await testMINIMAXConnection();
      setResult(result);
      if (result.success) {
        setResponse(result.message);
      }
    } catch (error) {
      console.error('Error en prueba:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDirectTest = async () => {
    setTesting(true);
    setResult(null);
    setResponse('');

    try {
      console.log('🚀 Test directo a MINIMAX M2...');
      
      const response = await fetch('https://api.minimax.io/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${minimaxConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'MiniMax-M2',
          messages: [
            {
              role: 'user',
              content: 'Eres Steeb, asistente anti-procrastinación. Responde en máximo 2 frases motivadoras en español sobre eliminar la procrastinación.'
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error en la API');
      }

      const message = data.choices?.[0]?.message?.content;
      setResponse(message);
      setResult({
        success: true,
        message: message,
        model: 'MiniMax-M2',
        tokens: data.usage
      });

    } catch (error) {
      console.error('Error directo:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          🧪 Test MINIMAX M2
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Verifica que tu API key funciona correctamente
        </p>
      </div>

      {/* API Key Info */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 space-y-2">
        <h3 className="font-bold text-black dark:text-white">📋 Configuración</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 font-mono">
          <p>Modelo: <span className="text-green-600 dark:text-green-400">{minimaxConfig.model}</span></p>
          <p>Endpoint: <span className="text-blue-600 dark:text-blue-400">{minimaxConfig.baseUrl}</span></p>
          <p>API Key: <span className="text-yellow-600 dark:text-yellow-400">Configurada ✓</span></p>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {testing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Probando...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Test con función
            </>
          )}
        </button>

        <button
          onClick={handleDirectTest}
          disabled={testing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {testing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Probando...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Test directo (Recomendado)
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {result.success ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 dark:text-green-100 mb-2">
                    ✅ ¡FUNCIONA PERFECTAMENTE!
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                    Conexión exitosa con MINIMAX M2
                  </p>
                  {response && (
                    <div className="bg-white dark:bg-black p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm text-black dark:text-white italic">
                        "{response}"
                      </p>
                    </div>
                  )}
                  {result.tokens && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                      📊 Tokens: {result.tokens.prompt_tokens} entrada, {result.tokens.completion_tokens} salida
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">
                    ❌ Error de conexión
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {result.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Console Output */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs max-h-40 overflow-auto">
        <p>Abre DevTools (F12) para ver logs detallados en la consola</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
        <h3 className="font-bold text-blue-900 dark:text-blue-100">ℹ️ ¿Qué hace este test?</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Verifica que tu API key de MINIMAX es válida</li>
          <li>Conecta al endpoint oficial: api.minimax.io/v1</li>
          <li>Envía una prueba con el modelo MiniMax-M2</li>
          <li>Muestra la respuesta de IA</li>
          <li>Si funciona, ¡Stebe AI está listo!</li>
        </ul>
      </div>
    </div>
  );
};

export default MINIMAXTest;
