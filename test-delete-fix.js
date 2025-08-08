const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDeleteFix() {
  console.log('🧪 Testando correção da rota DELETE /api/excluir-usuario...\n');
  
  // Teste o formato que o frontend está enviando
  const payload = { id: 'test-id-123' };
  
  try {
    console.log('📤 Testando payload do frontend:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://vital-backend-eta.vercel.app/api/excluir-usuario', {
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
      console.log('✅ SUCESSO! A correção funcionou!');
      console.log('   Status 500 significa que o parâmetro foi aceito');
      console.log('   (erro de UUID esperado, mas parâmetro foi reconhecido)');
    } else if (response.status === 400 && responseText.includes('ID do usuário é obrigatório')) {
      console.log('❌ FALHA! A correção não funcionou');
      console.log('   Parâmetro ainda não foi aceito');
    } else {
      console.log('🔍 Status inesperado - verificar logs');
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testDeleteFix().catch(console.error);
