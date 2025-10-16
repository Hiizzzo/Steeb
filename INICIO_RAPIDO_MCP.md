# 🚀 Inicio Rápido - Conectar ChatGPT con STEBE

## ⚡ 3 Pasos para Conectar

### 1️⃣ Iniciar el Servidor MCP

**Opción A - Doble clic:**
```
steeb-mcp/start-for-chatgpt.bat
```

**Opción B - Terminal:**
```bash
cd steeb-mcp
npm install  # Solo la primera vez
npm start
```

### 2️⃣ Configurar ChatGPT

**ChatGPT Desktop:**
1. Settings → Integrations
2. Add MCP Server
3. URL: `http://localhost:3001`
4. Marca "I trust this application" ✅

**Windsurf (ya configurado):**
- El servidor MCP ya está en tu configuración de Windsurf
- Solo asegúrate de que esté corriendo

### 3️⃣ Verificar Conexión

Pregúntale a ChatGPT:
> "Lista los componentes de mi app STEBE"

Si funciona, ChatGPT te mostrará la lista real de componentes.

---

## 📚 Documentación Completa

Ver: **[GUIA_CONECTAR_CHATGPT_STEBE.md](./GUIA_CONECTAR_CHATGPT_STEBE.md)**

---

## 💬 Ejemplos de Uso

### Debugging
> "Analiza el componente TaskCard y dime por qué no se muestran las fechas"

### Buscar Código
> "Busca dónde se usa Firebase en el proyecto"

### Explicaciones
> "Explícame cómo funciona el sistema de autenticación"

### Mejoras
> "¿Cómo puedo optimizar el rendimiento del calendario?"

---

## 🔧 Solución de Problemas

### El servidor no inicia
```bash
# Verifica Node.js
node --version  # Debe ser v18+

# Instala dependencias
cd steeb-mcp
npm install
```

### ChatGPT no se conecta
1. Verifica que el servidor esté corriendo: http://localhost:3001/health
2. Marca "I trust this application" en ChatGPT
3. Reinicia ChatGPT Desktop

---

## ✅ Test de Conexión

```bash
cd steeb-mcp
npm test
```

Esto verificará que todo funcione correctamente.

---

**¡Listo! Ahora ChatGPT tiene acceso completo a tu app STEBE** 🎉
