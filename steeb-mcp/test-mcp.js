// Script de prueba para el servidor MCP
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

async function testMCP() {
  console.log('🧪 Probando servidor MCP de STEBE...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Test: Health Check');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Health:', health.status);
    console.log('');

    // Test 2: Server info
    console.log('2️⃣ Test: Server Info');
    const infoRes = await fetch(`${BASE_URL}/`);
    const info = await infoRes.json();
    console.log('✅ Server:', info.name, 'v' + info.version);
    console.log('');

    // Test 3: List resources
    console.log('3️⃣ Test: List Resources');
    const resourcesRes = await fetch(`${BASE_URL}/mcp/resources`);
    const resources = await resourcesRes.json();
    console.log('✅ Resources disponibles:', resources.resources.length);
    resources.resources.forEach(r => {
      console.log(`   - ${r.name}`);
    });
    console.log('');

    // Test 4: Get architecture
    console.log('4️⃣ Test: Get Architecture');
    const archRes = await fetch(`${BASE_URL}/mcp/resources/stebe%3A%2F%2Fapp%2Farchitecture`);
    const arch = await archRes.json();
    console.log('✅ Arquitectura obtenida:', arch.content.substring(0, 100) + '...');
    console.log('');

    // Test 5: List tools
    console.log('5️⃣ Test: List Tools');
    const toolsRes = await fetch(`${BASE_URL}/mcp/tools`);
    const tools = await toolsRes.json();
    console.log('✅ Tools disponibles:', tools.tools.length);
    tools.tools.forEach(t => {
      console.log(`   - ${t.name}: ${t.description}`);
    });
    console.log('');

    // Test 6: Execute tool - list directory
    console.log('6️⃣ Test: Execute Tool (list_directory)');
    const listDirRes = await fetch(`${BASE_URL}/mcp/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'list_directory',
        arguments: { path: 'src/components' }
      })
    });
    const listDir = await listDirRes.json();
    console.log('✅ Componentes encontrados:', listDir.result.items.length);
    console.log('   Primeros 5:');
    listDir.result.items.slice(0, 5).forEach(item => {
      console.log(`   - ${item.name} (${item.type})`);
    });
    console.log('');

    // Test 7: Execute tool - search code
    console.log('7️⃣ Test: Execute Tool (search_code)');
    const searchRes = await fetch(`${BASE_URL}/mcp/tools/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'search_code',
        arguments: { 
          query: 'useTaskStore',
          filePattern: '*.tsx'
        }
      })
    });
    const search = await searchRes.json();
    console.log('✅ Resultados de búsqueda:', search.result.totalResults);
    console.log('   Primeros 3:');
    search.result.results.slice(0, 3).forEach(r => {
      console.log(`   - ${r.file}:${r.line}`);
    });
    console.log('');

    console.log('🎉 ¡Todos los tests pasaron exitosamente!');
    console.log('');
    console.log('📡 El servidor MCP está listo para conectarse con ChatGPT');
    
  } catch (error) {
    console.error('❌ Error en los tests:', error.message);
    console.log('');
    console.log('💡 Asegúrate de que el servidor esté corriendo:');
    console.log('   npm start');
  }
}

testMCP();
