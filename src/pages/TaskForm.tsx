import React, { useState } from 'react';
import { messaging, getToken } from '../lib/firebase';

const BACKEND_URL = 'http://localhost:4000/api/tasks';

export default function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datetime, setDatetime] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    try {
      // Solicitar token FCM
      const fcm_token = await getToken(messaging, { vapidKey: 'TU_VAPID_KEY' });
      if (!fcm_token) {
        setStatus('No se pudo obtener el token de notificaciones.');
        return;
      }
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, datetime, fcm_token }),
      });
      if (res.ok) {
        setStatus('Tarea creada y notificación programada.');
        setTitle('');
        setDescription('');
        setDatetime('');
      } else {
        setStatus('Error al crear la tarea.');
      }
    } catch (err) {
      setStatus('Error: ' + err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded shadow space-y-4 mt-8">
      <h2 className="text-xl font-bold">Nueva tarea</h2>
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        placeholder="Descripción"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full border p-2 rounded"
      />
      <input
        type="datetime-local"
        value={datetime}
        onChange={e => setDatetime(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Crear tarea</button>
      {status && <div className="text-center text-sm mt-2">{status}</div>}
    </form>
  );
}