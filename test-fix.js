const baseUrl = 'http://localhost:3000';

async function testDeleteRoute() {
  console.log('🧪 Testando correção da rota DELETE /api/excluir-usuario...\n');
  
  // Teste o formato que o frontend está enviando
  const payload = { id: 'test-id-123' };
  
  try {
    console.log('📤 Testando payload do frontend:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${baseUrl}/api/excluir-usuario`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log(`📥 Status: ${response.status}`);
    console.log('📋 Response:', responseText);
    
    if (response.status === 500) {
      console.log('✅ Sucesso! Status 500 significa que o parâmetro foi aceito (erro de UUID esperado)');
    } else if (response.status === 400) {
      console.log('❌ Ainda há problema - parâmetro não foi aceito');
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testDeleteRoute().catch(console.error);
