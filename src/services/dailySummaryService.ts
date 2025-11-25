// @ts-nocheck
import { auth, db } from '@/lib/firebase';
import { collection, setDoc, doc, getDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface DailySummary {
  date: string; // YYYY-MM-DD
  summary: string;
  tasksCompleted: number;
  tasksPending: number;
  keyPoints: string[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

const SUMMARIES_COLLECTION = 'dailySummaries';

export const dailySummaryService = {
  /**
   * Generar resumen del día basado en los mensajes del chat
   */
  generateSummary: async (messages: any[]): Promise<string> => {
    // Este resumen será generado por la IA luego
    // Por ahora, es un placeholder
    const userMessages = messages.filter(m => m.role === 'user');
    const keyPoints = userMessages.slice(-5).map(m => m.content);
    
    return `Resumen del ${new Date().toLocaleDateString('es-ES')}: ${keyPoints.join(', ')}`;
  },

  /**
   * Guardar resumen del día (local + opcional Firebase)
   */
  saveDailySummary: async (summary: string, tasksCompleted: number, tasksPending: number, keyPoints: string[] = []): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const uid = auth.currentUser?.uid;

    const dailySummary: DailySummary = {
      date: today,
      summary,
      tasksCompleted,
      tasksPending,
      keyPoints,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(uid && { userId: uid })
    };

    // 1. Guardar localmente siempre
    const localKey = `steeb_summary_${today}`;
    localStorage.setItem(localKey, JSON.stringify(dailySummary));
    ('💾 Resumen guardado localmente:', today);

    // 2. Sincronizar con Firebase solo si hay autenticación
    if (!uid) {
      ('📱 Modo offline - Resumen guardado solo localmente');
      return;
    }

    try {
      const summariesRef = collection(db, SUMMARIES_COLLECTION);
      const docRef = doc(summariesRef, `${uid}_${today}`);
      await setDoc(docRef, {
        ...dailySummary,
        ownerUid: uid
      });
      ('✅ Resumen sincronizado con Firebase:', today);
    } catch (error) {
      ('📱 Error sincronizando resumen, manteniendo solo local:', error.message || error);
      // Continuar sin error - ya está guardado localmente
    }
  },

  /**
   * Obtener resumen del día actual
   */
  getTodaySummary: async (): Promise<DailySummary | null> => {
    const today = new Date().toISOString().split('T')[0];
    const localKey = `steeb_summary_${today}`;
    
    // Intentar obtener del local primero
    const localSummary = localStorage.getItem(localKey);
    if (localSummary) {
      return JSON.parse(localSummary);
    }

    // Si no está localmente, obtener de Firebase
    const uid = auth.currentUser?.uid;
    if (!uid) return null;

    try {
      const summariesRef = collection(db, SUMMARIES_COLLECTION);
      const docRef = doc(summariesRef, `${uid}_${today}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const summary = docSnap.data() as DailySummary;
        // Guardar localmente para próxima vez
        localStorage.setItem(localKey, JSON.stringify(summary));
        return summary;
      }
    } catch (error) {
      console.error('Error obteniendo resumen de Firebase:', error);
    }

    return null;
  },

  /**
   * Obtener resúmenes de los últimos N días
   */
  getLastSummaries: async (days: number = 7): Promise<DailySummary[]> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];

    try {
      // Intentar obtener del localStorage primero
      const summaries: DailySummary[] = [];
      const today = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const localKey = `steeb_summary_${dateStr}`;
        const stored = localStorage.getItem(localKey);
        
        if (stored) {
          summaries.push(JSON.parse(stored));
        }
      }
      
      return summaries;
    } catch (error) {
      console.error('Error obteniendo resúmenes:', error);
      return [];
    }
  },

  /**
   * Obtener contexto de los últimos días para usar en el prompt de Steeb
   */
  getContextFromPreviousDays: async (days: number = 3): Promise<string> => {
    const summaries = await dailySummaryService.getLastSummaries(days);
    
    if (summaries.length === 0) return '';

    let context = 'CONTEXTO DE DÍAS ANTERIORES:\n';
    summaries.forEach(summary => {
      context += `\n📅 ${summary.date}:\n`;
      context += `- ${summary.summary}\n`;
      if (summary.keyPoints.length > 0) {
        context += `- Puntos clave: ${summary.keyPoints.join(', ')}\n`;
      }
    });

    return context;
  }
};

