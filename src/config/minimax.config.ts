// MINIMAX M2 Configuration
// API Key configurada y lista para usar

export const minimaxConfig = {
  provider: 'minimax',
  apiKey: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJzYW50aWFnbyBiZW5pdGV6IiwiVXNlck5hbWUiOiJzYW50aWFnbyBiZW5pdGV6IiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5ODM2NzQ5NzU5NTcwMzMyNDYiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxOTgzNjc0OTc1OTUyODM0ODQ2IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoic2FudHkuYmVuaXRlejIwMjVAZ21haWwuY29tIiwiQ3JlYXRlVGltZSI6IjIwMjUtMTEtMDUgMDI6NTU6MjAiLCJUb2tlblR5cGUiOjEsImlzcyI6Im1pbmltYXgifQ.YeoSjki32p-qm3ubYlUXZllTbkkE2YbBCTTODVoUQAGk2Cng6PEEpFiqW0v-rtQlligxka7pIWS96FzpRIK3ywMxYfMjzfHeO3ljhcjeJhig6VTiBmCpLmVUWwIUSRzYmFSBJP2HJrOPAgXgmHGOkdMntimc9YjBydc_R-t2WdvBMOEIYq9oBOdjEKrK5B4ptWv4aXqAF6SQ1C_vaSNuW7aMqlyekl3DtthrQjmuodURTz22Bwmqo3F7ut_N361gl7Z-C3iM9Kfk8C-lvGWDyRn6HIVB6n3fXCOBx_mz3kARohFvNuirda4GeQX-FpbAGmu7NrEWl-ykUL7ricDuLw',
  baseUrl: 'https://api.minimax.io/v1',
  model: 'MiniMax-M2',
  
  // Parámetros recomendados para Stebe
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxTokens: 1024
};

// Test function para verificar conexión
export async function testMINIMAXConnection() {
  try {
    console.log('🧪 Probando conexión con MINIMAX M2...');
    
    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${minimaxConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: minimaxConfig.model,
        messages: [
          { role: 'system', content: 'Eres un asistente de prueba.' },
          { role: 'user', content: 'Di solo "¡FUNCIONANDO!" si eres MINIMAX M2.' }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('✅ Conexión exitosa con MINIMAX M2');
    console.log('📝 Respuesta:', content);
    
    return {
      success: true,
      message: content,
      model: minimaxConfig.model
    };
    
  } catch (error) {
    console.error('❌ Error conectando con MINIMAX:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

export default minimaxConfig;
