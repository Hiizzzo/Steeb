const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';

if (!MINIMAX_API_KEY) {
  console.error('❌ Error: MINIMAX_API_KEY no está definida en .env');
  process.exit(1);
}

// Endpoint para enviar mensajes a MINIMAX
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    console.log('📤 Enviando a MINIMAX M2...');

    const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-M2',
        messages: messages,
        temperature: 0.7,
        top_p: 0.95,
        top_k: 40,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`MINIMAX Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from MINIMAX');
    }

    // Filtrar razonamiento interno si existe
    const thinkMatch = assistantMessage.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
    if (thinkMatch) {
      assistantMessage = thinkMatch[2].trim();
    }

    console.log('✅ Respuesta recibida de MINIMAX M2');

    res.json({ content: assistantMessage });

  } catch (error) {
    console.error('❌ Error en proxy:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error desconocido' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MINIMAX Proxy Server running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 MINIMAX Proxy Server ejecutándose en puerto ${PORT}`);
  console.log(`✅ API Key protegida en servidor`);
});
