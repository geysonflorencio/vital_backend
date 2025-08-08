// Teste de importação dos módulos de rota
try {
    console.log('🔍 Testando importação dos módulos...');
    
    const hospitaisRoutes = require('./routes/hospitais');
    console.log('✅ routes/hospitais.js importado com sucesso');
    
    const usuariosRoutes = require('./routes/usuarios');
    console.log('✅ routes/usuarios.js importado com sucesso');
    
    console.log('🎉 Todas as importações funcionaram!');
    
} catch (error) {
    console.error('❌ Erro na importação:', error.message);
    console.error('Stack:', error.stack);
}
