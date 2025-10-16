# Test MCP Server
Write-Host "Testing STEBE MCP Server..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"

# Test 1: Health Check
Write-Host "1. Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   OK - Status: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Server Info
Write-Host "2. Server Info" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "   OK - Name: $($response.name) v$($response.version)" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: List Resources
Write-Host "3. List Resources" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/mcp/resources" -Method Get
    Write-Host "   OK - Resources: $($response.resources.Count)" -ForegroundColor Green
    foreach ($resource in $response.resources) {
        Write-Host "      - $($resource.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: List Tools
Write-Host "4. List Tools" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/mcp/tools" -Method Get
    Write-Host "   OK - Tools: $($response.tools.Count)" -ForegroundColor Green
    foreach ($tool in $response.tools) {
        Write-Host "      - $($tool.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "MCP Server is running at: $baseUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "To connect ChatGPT:" -ForegroundColor Yellow
Write-Host "1. Open ChatGPT Desktop" -ForegroundColor White
Write-Host "2. Settings > Beta Features > Enable 'Model Context Protocol'" -ForegroundColor White
Write-Host "3. Settings > Integrations > Add Integration" -ForegroundColor White
Write-Host "   Name: STEBE" -ForegroundColor White
Write-Host "   URL: $baseUrl" -ForegroundColor White
Write-Host ""
