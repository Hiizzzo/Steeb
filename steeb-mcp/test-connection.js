// ============================================================================
// Test de Conexión MCP - Verifica que el servidor funciona correctamente
// ============================================================================

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    log(`\n🧪 Testing: ${name}`, 'cyan');
    log(`   ${method} ${url}`, 'blue');
    
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`   ✅ SUCCESS (${response.status})`, 'green');
      log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`, 'reset');
      return true;
    } else {
      log(`   ❌ FAILED (${response.status})`, 'red');
      log(`   Error: ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ❌ ERROR: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  🔍 STEBE MCP Server - Connection Test                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Test 1: Server Info
  if (await testEndpoint('Server Info', `${BASE_URL}/`)) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 2: Health Check
  if (await testEndpoint('Health Check', `${BASE_URL}/health`)) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 3: List Resources
  if (await testEndpoint('List Resources', `${BASE_URL}/mcp/resources`)) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 4: Get Architecture Resource
  if (await testEndpoint(
    'Get Architecture', 
    `${BASE_URL}/mcp/resources/stebe%3A%2F%2Fapp%2Farchitecture`
  )) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 5: List Tools
  if (await testEndpoint('List Tools', `${BASE_URL}/mcp/tools`)) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 6: Execute read_file tool
  if (await testEndpoint(
    'Execute Tool: read_file',
    `${BASE_URL}/mcp/tools/execute`,
    'POST',
    {
      name: 'read_file',
      arguments: { path: 'package.json' }
    }
  )) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 7: Execute list_directory tool
  if (await testEndpoint(
    'Execute Tool: list_directory',
    `${BASE_URL}/mcp/tools/execute`,
    'POST',
    {
      name: 'list_directory',
      arguments: { path: 'src/components' }
    }
  )) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 8: Execute search_code tool
  if (await testEndpoint(
    'Execute Tool: search_code',
    `${BASE_URL}/mcp/tools/execute`,
    'POST',
    {
      name: 'search_code',
      arguments: { 
        query: 'React',
        filePattern: '*.tsx'
      }
    }
  )) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 9: List Prompts
  if (await testEndpoint('List Prompts', `${BASE_URL}/mcp/prompts`)) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  📊 Test Results                                           ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  log(`\n   ✅ Passed: ${results.passed}`, 'green');
  log(`   ❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`   📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`, 'cyan');
  
  if (results.failed === 0) {
    log('🎉 All tests passed! The MCP server is working correctly.', 'green');
    log('✅ ChatGPT can now connect to your STEBE app!', 'green');
  } else {
    log('⚠️  Some tests failed. Check the errors above.', 'yellow');
    log('💡 Make sure the server is running: npm start', 'yellow');
  }
  
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  🔗 Next Steps                                             ║', 'cyan');
  log('╠════════════════════════════════════════════════════════════╣', 'cyan');
  log('║  1. Keep the server running                                ║', 'reset');
  log('║  2. Open ChatGPT Desktop                                   ║', 'reset');
  log('║  3. Go to Settings → Integrations                          ║', 'reset');
  log('║  4. Add MCP Server: http://localhost:3001                  ║', 'reset');
  log('║  5. Mark "I trust this application"                        ║', 'reset');
  log('║  6. Start chatting with full STEBE context!               ║', 'reset');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');
}

// Check if server is running first
log('\n🔍 Checking if MCP server is running...', 'yellow');
fetch(`${BASE_URL}/health`)
  .then(() => {
    log('✅ Server is running!\n', 'green');
    runTests();
  })
  .catch(() => {
    log('❌ Server is not running!', 'red');
    log('\n💡 Start the server first:', 'yellow');
    log('   cd steeb-mcp', 'cyan');
    log('   npm start\n', 'cyan');
    process.exit(1);
  });
