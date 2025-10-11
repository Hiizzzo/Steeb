@echo off
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚀 Iniciando STEBE MCP Server                             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo 📦 Verificando dependencias...
if not exist "node_modules\" (
    echo ⚠️  Instalando dependencias...
    call npm install
    echo.
)

echo 🔥 Iniciando servidor MCP en HTTP...
echo.
echo 💡 Para conectar ChatGPT:
echo    1. Usa URL: http://localhost:3001
echo    2. Marca "I trust this application"
echo.

set USE_HTTPS=false
call node server.js

pause
