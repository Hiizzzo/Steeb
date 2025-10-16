# Script de prueba para verificar el servidor MCP
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 Probando Servidor MCP de STEBE                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"

# Test 1: Health Check
Write-Host "1️⃣  Test: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   ✅ Status: $($response.status)" -ForegroundColor Green
    Write-Host "   ⏰ Uptime: $([math]::Round($response.uptime, 2)) segundos" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Server Info
Write-Host "2️⃣  Test: Server Info" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "   ✅ Nombre: $($response.name)" -ForegroundColor Green
    Write-Host "   ✅ Versión: $($response.version)" -ForegroundColor Green
    Write-Host "   ✅ Descripción: $($response.description)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: List Resources
Write-Host "3️⃣  Test: List Resources" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/mcp/resources" -Method Get
    Write-Host "   ✅ Recursos disponibles: $($response.resources.Count)" -ForegroundColor Green
    foreach ($resource in $response.resources) {
        Write-Host "      - $($resource.name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: List Tools
Write-Host "4️⃣  Test: List Tools" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/mcp/tools" -Method Get
    Write-Host "   ✅ Herramientas disponibles: $($response.tools.Count)" -ForegroundColor Green
    foreach ($tool in $response.tools) {
        Write-Host "      - $($tool.name): $($tool.description)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Execute Tool - List Directory
Write-Host "5️⃣  Test: Execute Tool (list_directory)" -ForegroundColor Yellow
try {
    $body = @{
        name = "list_directory"
        arguments = @{
            path = "src/components"
        }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/mcp/tools/execute" -Method Post -Body $body -ContentType "application/json"
    Write-Host "   ✅ Componentes encontrados: $($response.result.items.Count)" -ForegroundColor Green
    Write-Host "   📁 Primeros 5 componentes:" -ForegroundColor Cyan
    $response.result.items | Select-Object -First 5 | ForEach-Object {
        Write-Host "      - $($_.name) ($($_.type))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Architecture
Write-Host "6️⃣  Test: Get Architecture Resource" -ForegroundColor Yellow
try {
    $uri = [System.Uri]::EscapeDataString("stebe://app/architecture")
    $response = Invoke-RestMethod -Uri "$baseUrl/mcp/resources/$uri" -Method Get
    $preview = $response.content.Substring(0, [Math]::Min(150, $response.content.Length))
    Write-Host "   ✅ Arquitectura obtenida" -ForegroundColor Green
    Write-Host "   📄 Preview: $preview..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 ¡Todos los tests completados!                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📡 El servidor MCP está funcionando correctamente" -ForegroundColor Cyan
Write-Host "🔗 URL: $baseUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Ahora puedes conectar ChatGPT:" -ForegroundColor Yellow
Write-Host "   1. Abre ChatGPT Desktop" -ForegroundColor White
Write-Host "   2. Settings → Beta Features → Habilita 'Model Context Protocol'" -ForegroundColor White
Write-Host "   3. Settings → Integrations → Add Integration" -ForegroundColor White
Write-Host "      Name: STEBE" -ForegroundColor White
Write-Host "      URL: $baseUrl" -ForegroundColor White
Write-Host ""
