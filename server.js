import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import 'dotenv/config';
import { createPurchaseStore } from './server/purchaseStore.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.BASE_URL || `http://localhost:${PORT}`;

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const MERCADOPAGO_PUBLIC_KEY = process.env.MERCADOPAGO_PUBLIC_KEY || '';
const MP_NOTIFICATION_URL = process.env.MP_NOTIFICATION_URL || `${APP_BASE_URL}/api/payments/webhook`;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';

const paymentPlansPath = path.join(__dirname, 'config', 'paymentPlans.json');

let PAYMENT_PLANS = [];
try {
  if (fs.existsSync(paymentPlansPath)) {
    const planBuffer = fs.readFileSync(paymentPlansPath, 'utf-8');
    PAYMENT_PLANS = JSON.parse(planBuffer);
  } else {
    console.warn('📦 paymentPlans.json no encontrado en config/.');
  }
} catch (error) {
  console.error('❌ Error leyendo paymentPlans.json:', error);
}

const PAYMENT_PLAN_MAP = PAYMENT_PLANS.reduce((acc, plan) => {
  if (plan?.id) acc[plan.id] = plan;
  return acc;
}, {});

const purchaseStore = await createPurchaseStore();

// Configurar Mercado Pago SDK con ES modules
let client;
try {
  client = new MercadoPagoConfig({
    accessToken: MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
  });
  console.log('✅ Mercado Pago SDK configurado con ES modules');
} catch (error) {
  console.warn('⚠️ Error configurando SDK:', error.message);
}

const getPlan = (planId) => PAYMENT_PLAN_MAP[planId];

const mapPaymentToRecord = (payment) => {
  if (!payment) return null;
  const metadata = payment.metadata || {};
  const additionalInfo = payment.additional_info || {};

  const planId =
    metadata.planId ||
    metadata.plan_id ||
    additionalInfo.items?.[0]?.id ||
    payment.order?.type;

  return {
    paymentId: payment.id?.toString(),
    status: payment.status,
    statusDetail: payment.status_detail,
    planId: planId || 'unknown',
    userId: metadata.userId || metadata.user_id || payment.payer?.id,
    email: metadata.email || payment.payer?.email || additionalInfo.payer?.email,
    externalReference: payment.external_reference,
    preferenceId: payment.preference_id,
    amount: payment.transaction_amount,
    currency: payment.currency_id,
    installments: payment.installments,
    paymentMethod: payment.payment_method_id,
    paymentType: payment.payment_type_id,
    processedAt: payment.date_created,
    approvedAt: payment.date_approved,
  };
};

// Crear preferencia con API directa de Mercado Pago (fallback que funciona)
const createPreference = async (preferenceData) => {
  try {
    console.log('🚀 Creando preferencia con API directa de Mercado Pago...');
    console.log('📋 Datos enviados:', JSON.stringify(preferenceData, null, 2));

    // Usar la API directa que sí funciona
    const url = 'https://api.mercadopago.com/checkout/preferences';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
      },
      body: JSON.stringify(preferenceData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ Preferencia creada con API directa:', result.id);
    console.log('🔗 Sandbox URL:', result.sandbox_init_point);

    return {
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      external_reference: result.external_reference
    };
  } catch (error) {
    console.error('❌ Error con API directa:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);

    // ULTIMO RECURSO: URL directa de checkout manual
    const fallbackId = preferenceData.external_reference || Date.now().toString();
    const sandboxUrl = `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${fallbackId}`;
    const productionUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${fallbackId}`;

    // Usar sandbox para pagos de prueba ($1)
    const fallbackUrl = sandboxUrl;
    console.log('🔄 Usando fallback directo:', fallbackUrl);

    return {
      id: fallbackId,
      init_point: productionUrl,
      sandbox_init_point: fallbackUrl,
      external_reference: preferenceData.external_reference
    };
  }
};

const mpRequest = async (endpoint, options = {}) => {
  const url = `https://api.mercadopago.com${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  return response.json();
};

const fetchPaymentById = async (paymentId) => {
  if (!paymentId) return null;
  return mpRequest(`/v1/payments/${paymentId}`, { method: 'GET' });
};

const searchPayment = async ({ preferenceId, externalReference }) => {
  const params = new URLSearchParams();
  if (externalReference) params.append('external_reference', externalReference);
  if (preferenceId) params.append('preference_id', preferenceId);
  params.append('sort', 'date_created');
  params.append('criteria', 'desc');

  const response = await mpRequest(`/v1/payments/search?${params.toString()}`, {
    method: 'GET',
  });

  return response.results?.[0] || null;
};

const persistPaymentFromMercadoPago = async (payment) => {
  const record = mapPaymentToRecord(payment);
  if (!record) {
    throw new Error('Pago no encontrado en Mercado Pago');
  }
  await purchaseStore.upsert(record);
  return record;
};

// Configurar CORS y JSON
app.use(cors());
app.use(express.json());

// Configurar multer para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'lovable-uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Endpoint uploads
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const filename = req.file.filename;
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const originalUrl = `${baseUrl}/lovable-uploads/${filename}`;

    res.json({
      success: true,
      filename: filename,
      path: `/lovable-uploads/${filename}`,
      original_url: originalUrl,
      message: 'Imagen subida exitosamente'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Servir archivos estáticos
app.use('/lovable-uploads', express.static(path.join(__dirname, 'public', 'lovable-uploads')));

// Listar imágenes
app.get('/api/images', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'public', 'lovable-uploads');

    if (!fs.existsSync(uploadDir)) {
      return res.json({ images: [] });
    }

    const files = fs.readdirSync(uploadDir);
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    }).map(file => ({
      filename: file,
      path: `/lovable-uploads/${file}`,
      original_url: `${baseUrl}/lovable-uploads/${file}`,
      size: fs.statSync(path.join(uploadDir, file)).size
    }));

    res.json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Error al listar imágenes' });
  }
});

// ================================
// MERCADO PAGO ENDPOINTS (PRODUCCIÓN)
// ================================

app.post('/api/payments/create-preference', async (req, res) => {
  try {
    const { planId, quantity = 1, userId, email, name } = req.body || {};

    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }

    const plan = getPlan(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({
        error: 'Mercado Pago no está configurado correctamente en el servidor.'
      });
    }

    const externalReference = `${plan.id}_${userId || 'anon'}_${Date.now()}`;

    const payer = {};
    if (email) payer.email = email;
    if (name) payer.name = name;

    const preferencePayload = {
      items: [
        {
          title: plan.title,
          quantity: Number(quantity) || 1,
          unit_price: Number(plan.price),
          currency_id: plan.currency || 'ARS'
        }
      ],
      back_urls: {
        success: `${APP_BASE_URL}/payments/success`,
        pending: `${APP_BASE_URL}/payments/pending`,
        failure: `${APP_BASE_URL}/payments/failure`
      },
      auto_return: 'approved',
      external_reference: externalReference
    };

    const preference = await createPreference(preferencePayload);

    res.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
      externalReference,
      plan
    });
  } catch (error) {
    console.error('❌ Error creando preferencia Mercado Pago:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'No se pudo crear la preferencia'
    });
  }
});

app.post('/api/payments/verify', async (req, res) => {
  try {
    const { paymentId, externalReference, preferenceId } = req.body || {};

    if (!paymentId && !externalReference && !preferenceId) {
      return res
        .status(400)
        .json({ error: 'Debes enviar paymentId o externalReference/preferenceId' });
    }

    let payment = null;

    if (paymentId) {
      payment = await fetchPaymentById(paymentId);
    } else {
      payment = await searchPayment({ preferenceId, externalReference });
    }

    if (!payment) {
      return res.status(404).json({ error: 'No se encontraron pagos registrados todavía.' });
    }

    const record = await persistPaymentFromMercadoPago(payment);
    res.json({
      ...record,
      message: record.status === 'approved'
        ? 'Pago aprobado'
        : `Estado actual: ${record.status}`
    });
  } catch (error) {
    console.error('❌ Error verificando pago Mercado Pago:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'No se pudo verificar el pago'
    });
  }
});

app.get('/api/payments/status', async (req, res) => {
  try {
    const { planId, userId, email } = req.query;

    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }

    if (!userId && !email) {
      return res
        .status(400)
        .json({ error: 'Envía userId o email para consultar el estado de compra.' });
    }

    const status = await purchaseStore.getStatus(planId, userId, email);
    res.json(status);
  } catch (error) {
    console.error('❌ Error obteniendo estado de pagos:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'No se pudo obtener el estado de pago'
    });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    if (MP_WEBHOOK_SECRET) {
      const provided = req.query.secret || req.headers['x-webhook-secret'];
      if (provided !== MP_WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Token de webhook inválido' });
      }
    }

    const event = req.body || {};
    const query = req.query || {};

    const topic = event.type || query.type || query.topic;
    const resourceId =
      event.data?.id ||
      event.resource ||
      query['data.id'] ||
      query.data_id ||
      query.id ||
      event.id;

    if (topic && topic.includes('payment') && resourceId) {
      try {
        const payment = await fetchPaymentById(resourceId);
        await persistPaymentFromMercadoPago(payment);
        console.log('✅ Webhook Mercado Pago procesado:', resourceId);
      } catch (error) {
        console.error('❌ Error procesando webhook de Mercado Pago:', error);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error en webhook Mercado Pago:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor STEEB corriendo en http://localhost:${PORT}`);
  console.log(`💰 Plan configurado: $${PAYMENT_PLANS[0]?.price} ARS`);
  console.log(`📁 Directorio de uploads: ${path.join(__dirname, 'public', 'lovable-uploads')}`);
});