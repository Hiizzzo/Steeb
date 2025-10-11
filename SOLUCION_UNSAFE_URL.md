# 🔧 Solución: Error "Unsafe URL" en ChatGPT

## ❌ El Problema

ChatGPT muestra el error **"Error creating connector - Unsafe URL"** cuando intentas conectar con `http://localhost:3001` porque considera que las URLs HTTP (sin cifrado) son inseguras.

## ✅ Solución Rápida (Recomendada)

### Opción 1: Marcar como Confiable

La forma más simple es decirle a ChatGPT que confías en esta aplicación:

1. **En el diálogo de "New Connector"**, verás un checkbox que dice:
   ```
   ☑ I trust this application
   Custom connectors are not verified by OpenAI. Malicious 
   developers may attempt to steal your data.
   ```

2. **Marca el checkbox** ✅

3. **Click en "Create"**

4. **¡Listo!** ChatGPT aceptará la conexión HTTP

### ¿Por qué funciona?

- ChatGPT permite conexiones HTTP a `localhost` si explícitamente confías en la app
- Es seguro porque el servidor solo corre en tu máquina local
- No hay riesgo de seguridad ya que no sale de tu computadora

---

## 🔒 Solución Alternativa: Usar HTTPS

Si prefieres usar HTTPS (más seguro pero más complejo):

### Paso 1: Generar Certificados SSL

```bash
cd steeb-mcp
npm run generate-cert
```

Esto creará certificados autofirmados en `steeb-mcp/certs/`

### Paso 2: Reiniciar el Servidor

```bash
npm start
```

El servidor ahora correrá en `https://localhost:3001`

### Paso 3: Conectar ChatGPT

Usa la URL: `https://localhost:3001`

**Nota:** Tu navegador mostrará una advertencia de seguridad porque el certificado es autofirmado. Esto es normal y seguro para desarrollo local.

---

## 🎯 Configuración en ChatGPT

### Para ChatGPT Desktop

1. **Abre ChatGPT Desktop**

2. **Ve a Settings**
   - Click en tu perfil (esquina superior derecha)
   - Settings → Beta Features

3. **Habilita MCP**
   - Activa "Model Context Protocol"

4. **Agrega el Conector**
   - Settings → Integrations → Add Integration
   - Llena los campos:
     ```
     Name: STEBE
     Description: STEBE productivity app MCP server
     MCP Server URL: http://localhost:3001
     Authentication: No authentication
     ```

5. **Marca "I trust this application"** ✅

6. **Click "Create"**

---

## 🧪 Verificar que Funciona

Una vez conectado, prueba en ChatGPT:

```
"¿Puedes ver mi app STEBE? Muéstrame qué recursos tienes disponibles"
```

ChatGPT debería responder con la lista de recursos:
- App Architecture
- Components List
- State Stores
- Services
- TypeScript Types
- Documentation

---

## 🐛 Solución de Problemas

### Error: "Connection refused"

El servidor no está corriendo. Inícialo:
```bash
cd steeb-mcp
npm start
```

### Error: "Timeout"

1. Verifica que el servidor esté corriendo: `http://localhost:3001/health`
2. Revisa el firewall de Windows
3. Asegúrate de usar el puerto correcto (3001)

### Error: "Invalid certificate" (con HTTPS)

Esto es normal con certificados autofirmados. En ChatGPT:
1. Marca "I trust this application"
2. O usa HTTP en lugar de HTTPS

---

## 📊 Comparación de Opciones

| Opción | Pros | Contras | Recomendado |
|--------|------|---------|-------------|
| **HTTP + Trust** | ✅ Fácil<br>✅ Rápido<br>✅ Sin configuración | ⚠️ Requiere marcar checkbox | ⭐⭐⭐⭐⭐ |
| **HTTPS** | ✅ Más seguro<br>✅ Sin warnings | ❌ Requiere certificados<br>❌ Más complejo | ⭐⭐⭐ |

---

## 🎉 Resumen

**La solución más simple:**

1. Usa `http://localhost:3001` (sin HTTPS)
2. Marca ✅ "I trust this application" en ChatGPT
3. ¡Listo!

**Es seguro porque:**
- El servidor solo corre en tu máquina local
- No hay conexiones externas
- Los datos no salen de tu computadora
- Es solo para desarrollo

---

## 📝 Notas Importantes

- ✅ **Seguro para desarrollo local**: No hay riesgo usando HTTP en localhost
- ✅ **Solo tú tienes acceso**: El servidor no es accesible desde internet
- ✅ **Datos privados**: Todo queda en tu máquina
- ⚠️ **No usar en producción**: Para producción sí necesitarías HTTPS real

---

## 🔗 Más Información

- [Guía Completa de Configuración](MCP_SETUP_GUIDE.md)
- [Cómo Conectar ChatGPT](CONECTAR_CHATGPT.md)
- [README del Servidor](steeb-mcp/README.md)
