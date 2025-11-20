import { useEffect, useState } from 'react';

type SdkStatus = 'idle' | 'loading' | 'ready' | 'error';

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => any;
  }
}

export interface UseMercadoPagoResult {
  status: SdkStatus;
  instance: any | null;
  error: string | null;
}

const SDK_URL = 'https://sdk.mercadopago.com/js/v2';
const SCRIPT_ID = 'mercado-pago-sdk';

export const useMercadoPago = (
  publicKey?: string | null,
  shouldLoad = true
): UseMercadoPagoResult => {
  const [status, setStatus] = useState<SdkStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<any | null>(null);

  useEffect(() => {
    if (!publicKey || !shouldLoad) {
      setInstance(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;

    const instantiate = () => {
      if (typeof window === 'undefined') return;
      if (!window.MercadoPago) return;
      try {
        const mp = new window.MercadoPago(publicKey, { locale: 'es-AR' });
        if (!cancelled) {
          setInstance(mp);
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error inicializando Mercado Pago'
          );
          setStatus('error');
        }
      }
    };

    const ensureScript = () => {
      if (typeof document === 'undefined') return;
      const existingScript = document.getElementById(
        SCRIPT_ID
      ) as HTMLScriptElement | null;

      if (existingScript) {
        if (window.MercadoPago) {
          instantiate();
        } else {
          setStatus('loading');
          existingScript.addEventListener('load', instantiate, { once: true });
        }
        return;
      }

      setStatus('loading');
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => {
        if (!cancelled) {
          instantiate();
        }
      };
      script.onerror = () => {
        if (!cancelled) {
          setError('No se pudo cargar el SDK de Mercado Pago.');
          setStatus('error');
        }
      };
      document.body.appendChild(script);
    };

    ensureScript();

    return () => {
      cancelled = true;
    };
  }, [publicKey, shouldLoad]);

  return { status, instance, error };
};
