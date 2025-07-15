// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// DB setup
const db = new sqlite3.Database(path.join(__dirname, 'tasks.db'));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    datetime TEXT NOT NULL,
    fcm_token TEXT NOT NULL,
    notified INTEGER DEFAULT 0
  )`);
});

// API: Crear tarea
app.post('/api/tasks', (req, res) => {
  const { title, description, datetime, fcm_token } = req.body;
  if (!title || !datetime || !fcm_token) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  db.run(
    'INSERT INTO tasks (title, description, datetime, fcm_token) VALUES (?, ?, ?, ?)',
    [title, description, datetime, fcm_token],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// API: Listar tareas
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Notificación push via FCM
async function sendPushNotification(token, title, body) {
  const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
  const serverKey = process.env.FCM_SERVER_KEY;
  if (!serverKey) return;
  await axios.post(
    fcmUrl,
    {
      to: token,
      notification: {
        title,
        body,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${serverKey}`,
      },
    }
  );
}

// Cron: Revisar tareas cada minuto
cron.schedule('* * * * *', () => {
  const now = new Date().toISOString();
  db.all(
    'SELECT * FROM tasks WHERE datetime <= ? AND notified = 0',
    [now],
    (err, rows) => {
      if (err) return;
      rows.forEach(async (task) => {
        await sendPushNotification(
          task.fcm_token,
          `Tarea: ${task.title}`,
          task.description || '¡Es hora de tu tarea!'
        );
        db.run('UPDATE tasks SET notified = 1 WHERE id = ?', [task.id]);
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});