@echo off
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚀 Iniciando STEBE MCP Server para ChatGPT               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo 💡 Descarga Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js detectado
node --version
echo.

REM Verificar si las dependencias están instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
    echo.
)

echo 🔧 Verificando certificados SSL...
if not exist "certs\key.pem" (
    echo ⚠️  Certificados SSL no encontrados
    echo 💡 Generando certificados autofirmados...
    node generate-cert-simple.js
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️  No se pudieron generar certificados
        echo 💡 El servidor se iniciará en HTTP (requiere marcar 'I trust this application' en ChatGPT)
    ) else (
        echo ✅ Certificados generados
    )
    echo.
)

echo 🚀 Iniciando servidor MCP...
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  INSTRUCCIONES PARA CHATGPT                                ║
echo ╠════════════════════════════════════════════════════════════╣
echo ║  1. Abre ChatGPT Desktop o ChatGPT Web                     ║
echo ║  2. Ve a Settings → Integrations                           ║
echo ║  3. Agrega nueva integración MCP                           ║
echo ║  4. URL: http://localhost:3001                             ║
echo ║  5. Marca "I trust this application"                       ║
echo ║  6. ¡Listo! ChatGPT puede acceder a tu app STEBE          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 💡 Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar el servidor
node server.js

pause
