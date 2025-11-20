import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DATA = {
  purchases: [],
  updatedAt: null
};

const sortRecordsDesc = (records = []) => {
  return [...records].sort((a, b) => {
    const dateA = new Date(a.approvedAt || a.processedAt || 0).getTime();
    const dateB = new Date(b.approvedAt || b.processedAt || 0).getTime();
    return dateB - dateA;
  });
};

class FilePurchaseStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async init() {
    await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      await fs.promises.writeFile(
        this.filePath,
        JSON.stringify(DEFAULT_DATA, null, 2),
        'utf-8'
      );
    }
  }

  async readAll() {
    try {
      const buffer = await fs.promises.readFile(this.filePath, 'utf-8');
      return JSON.parse(buffer);
    } catch (error) {
      console.error('❌ No se pudo leer purchases.json, se recreará.', error);
      await this.init();
      return DEFAULT_DATA;
    }
  }

  async writeAll(data) {
    await fs.promises.writeFile(this.filePath, JSON.stringify(data, null, 2));
    return data;
  }

  async upsert(record) {
    const data = await this.readAll();
    const idx = data.purchases.findIndex((purchase) => {
      if (record.paymentId && purchase.paymentId === record.paymentId) return true;
      if (record.externalReference && purchase.externalReference === record.externalReference) return true;
      return false;
    });

    if (idx >= 0) {
      data.purchases[idx] = { ...data.purchases[idx], ...record };
    } else {
      data.purchases.push(record);
    }
    data.updatedAt = new Date().toISOString();
    await this.writeAll(data);
    return record;
  }

  async getStatus(planId, userId, email) {
    const data = await this.readAll();
    let matches = data.purchases.filter((purchase) => purchase.planId === planId);

    if (userId) {
      matches = matches.filter((purchase) => purchase.userId === userId);
    } else if (email) {
      matches = matches.filter(
        (purchase) =>
          purchase.email &&
          email &&
          purchase.email.toLowerCase() === email.toLowerCase()
      );
    }

    const sorted = sortRecordsDesc(matches);
    const lastRecord = sorted[0] || null;
    return {
      active: Boolean(lastRecord && lastRecord.status === 'approved'),
      records: sorted,
      lastRecord
    };
  }
}

class FirestorePurchaseStore {
  constructor(options = {}) {
    this.collectionName = options.collectionName || 'purchases';
    this.firestore = null;
  }

  async init() {
    const serviceAccount = await this.loadServiceAccount();
    if (!serviceAccount) {
      throw new Error('Falta FIREBASE_SERVICE_ACCOUNT o FIREBASE_SERVICE_ACCOUNT_PATH para usar Firestore');
    }

    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
    this.FieldValue = FieldValue;

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }

    this.firestore = getFirestore();
    this.collection = this.firestore.collection(this.collectionName);
  }

  async loadServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (error) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT no es un JSON válido', error);
      }
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        const raw = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(raw);
      } catch (error) {
        console.error('❌ No se pudo leer FIREBASE_SERVICE_ACCOUNT_PATH', error);
      }
    }

    return null;
  }

  async upsert(record) {
    if (!this.collection) {
      throw new Error('Firestore no está inicializado');
    }

    const docId =
      record.paymentId ||
      record.externalReference ||
      crypto.randomUUID();

    const data = {
      ...record,
      updatedAt: this.FieldValue.serverTimestamp()
    };

    await this.collection.doc(docId).set(data, { merge: true });
    return record;
  }

  async getStatus(planId, userId, email) {
    if (!this.collection) {
      throw new Error('Firestore no está inicializado');
    }

    let query = this.collection.where('planId', '==', planId);
    if (userId) {
      query = query.where('userId', '==', userId);
    } else if (email) {
      query = query.where('email', '==', email);
    }

    const snapshot = await query
      .orderBy('approvedAt', 'desc')
      .orderBy('processedAt', 'desc')
      .limit(25)
      .get();

    const records = snapshot.docs.map((doc) => doc.data());
    const sorted = sortRecordsDesc(records);
    const lastRecord = sorted[0] || null;

    return {
      active: Boolean(lastRecord && lastRecord.status === 'approved'),
      records: sorted,
      lastRecord
    };
  }
}

export const createPurchaseStore = async () => {
  const prefersFirestore =
    process.env.PURCHASE_STORE === 'firestore' ||
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

  if (prefersFirestore) {
    try {
      const store = new FirestorePurchaseStore({
        collectionName: process.env.PURCHASES_COLLECTION || 'purchases'
      });
      await store.init();
      console.log('✅ Purchase store: Firestore');
      return store;
    } catch (error) {
      console.error('⚠️ No se pudo inicializar Firestore, se usará almacenamiento local.', error);
    }
  }

  const filePath =
    process.env.PURCHASES_FILE_PATH ||
    path.join(__dirname, 'data', 'purchases.json');
  const store = new FilePurchaseStore(filePath);
  await store.init();
  console.log(`✅ Purchase store: archivo JSON (${filePath})`);
  return store;
};
