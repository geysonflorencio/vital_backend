const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFrontendDeleteScenario() {
  console.log('🔍 Testando cenário EXATO do frontend...\n');
  
  // Simulando chamada exata do frontend
  try {
    console.log('📋 Simulando requisição do frontend com ID real...');
    
    // Primeiro, vamos criar um usuário real para testar
    const testUser = {
      nome: `Test User ${Date.now()}`,
      email: `test.${Date.now()}@vital.com.br`,
      role: 'medico',
      hospital_id: '550e8400-e29b-41d4-a716-446655440000' // UUID válido
    };
    
    console.log('1. Criando usuário de teste...');
    const createResponse = await fetch('https://vital-backend-eta.vercel.app/api/cadastrar-usuario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!createResponse.ok) {
      console.log('❌ Falha ao criar usuário de teste');
      console.log('Status:', createResponse.status);
      console.log('Response:', await createResponse.text());
      return;
    }
    
    const createdUser = await createResponse.json();
    console.log('✅ Usuário criado:', createdUser.user?.id || 'ID não retornado');
    
    // Se conseguimos o ID, vamos testar a exclusão
    if (createdUser.user?.id) {
      console.log('\n2. Testando exclusão com ID real...');
      
      const deletePayload = { id: createdUser.user.id };
      console.log('📤 Payload DELETE:', JSON.stringify(deletePayload, null, 2));
      
      const deleteResponse = await fetch('https://vital-backend-eta.vercel.app/api/excluir-usuario', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deletePayload)
      });
      
      console.log(`📥 Status DELETE: ${deleteResponse.status}`);
      const deleteResult = await deleteResponse.text();
      console.log('📋 Response DELETE:', deleteResult);
      
      if (deleteResponse.status === 200) {
        console.log('✅ SUCESSO! Exclusão funcionou perfeitamente!');
      } else if (deleteResponse.status === 400) {
        console.log('❌ FALHA! Ainda há problema com o parâmetro');
      } else {
        console.log('🔍 Status inesperado - verificar logs');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
  }
}

async function testParameterFormats() {
  console.log('\n🧪 Testando diferentes formatos de parâmetro...\n');
  
  const testCases = [
    { name: 'Frontend format (id)', payload: { id: 'test-uuid-123' } },
    { name: 'Backend format (userId)', payload: { userId: 'test-uuid-123' } },
    { name: 'Empty payload', payload: {} },
    { name: 'Both parameters', payload: { id: 'test-1', userId: 'test-2' } }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`📝 Testando: ${testCase.name}`);
      console.log(`📤 Payload:`, JSON.stringify(testCase.payload, null, 2));
      
      const response = await fetch('https://vital-backend-eta.vercel.app/api/excluir-usuario', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });
      
      const result = await response.text();
      console.log(`📥 Status: ${response.status}`);
      console.log(`📋 Response: ${result}`);
      console.log('─'.repeat(50));
      
    } catch (error) {
      console.error(`❌ Erro em ${testCase.name}:`, error.message);
    }
  }
}

// Executar ambos os testes
async function runAllTests() {
  await testParameterFormats();
  await testFrontendDeleteScenario();
}

runAllTests().catch(console.error);
