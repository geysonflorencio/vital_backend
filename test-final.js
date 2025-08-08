const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testExactFrontendFormat() {
  console.log('🎯 Testando EXATO formato do frontend: { user_id }...\n');
  
  // Formato EXATO que o frontend está enviando
  const payload = { user_id: 'test-uuid-123' };
  
  try {
    console.log('📤 Payload frontend:', JSON.stringify(payload, null, 2));
    
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
      console.log('✅ SUCESSO TOTAL! Frontend format funcionando!');
      console.log('   user_id foi aceito corretamente!');
    } else if (response.status === 400) {
      console.log('❌ AINDA HÁ PROBLEMA! user_id não aceito');
    } else {
      console.log('🔍 Status inesperado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testExactFrontendFormat().catch(console.error);
