// index.js - VITAL Backend (VERSÃO CORRIGIDA)
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// CORS - Configuração simplificada e funcional
app.use(cors({
  origin: [
    'https://appvital.com.br',
    'https://www.appvital.com.br',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://vital-deploy.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://aeysoqtbencykavivgoe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleXNvcXRiZW5jeWthdml2Z29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE4MTY1OSwiZXhwIjoyMDY0NzU3NjU5fQ.g64X3iebdB_TY_FWd6AI8mlej4uKMrKiFLG11z6hZlQ';

console.log('🔧 Inicializando Supabase...', { url: supabaseUrl });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'VITAL API - Backend Funcional',
    status: 'online',
    version: '3.0.0-direct',
    timestamp: new Date().toISOString()
  });
});

// ROTA DELETE EXCLUIR USUÁRIO - IMPLEMENTAÇÃO DIRETA
app.delete('/api/excluir-usuario', async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/excluir-usuario chamado');
    console.log('Body recebido:', req.body);

    const { user_id, id, userId } = req.body;
    const userIdToDelete = user_id || id || userId;

    if (!userIdToDelete) {
      return res.status(400).json({
        error: 'ID do usuário é obrigatório',
        expected: 'user_id, id ou userId no body da requisição'
      });
    }

    console.log(`🎯 Excluindo usuário: ${userIdToDelete}`);

    // 1. Deletar referências na tabela user_hospitals
    const { error: userHospitalError } = await supabase
      .from('user_hospitals')
      .delete()
      .eq('user_id', userIdToDelete);

    if (userHospitalError) {
      console.warn('⚠️ Erro ao deletar user_hospitals:', userHospitalError);
    }

    // 2. Deletar solicitações relacionadas
    const { error: solicitacoesError } = await supabase
      .from('solicitacoes')
      .delete()
      .eq('user_id', userIdToDelete);

    if (solicitacoesError) {
      console.warn('⚠️ Erro ao deletar solicitações:', solicitacoesError);
    }

    // 3. Deletar perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete);

    if (profileError) {
      console.error('❌ Erro ao deletar perfil:', profileError);
      return res.status(500).json({
        error: 'Erro ao deletar perfil do usuário',
        details: profileError.message
      });
    }

    // 4. Deletar da autenticação do Supabase
    const { error: authError } = await supabase.auth.admin.deleteUser(userIdToDelete);
    
    if (authError) {
      console.warn('⚠️ Erro ao deletar da auth (perfil já foi removido):', authError.message);
    }

    console.log('✅ Usuário excluído com sucesso:', userIdToDelete);

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso',
      user_id: userIdToDelete,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erro ao excluir usuário:', error);
    res.status(500).json({
      error: 'Erro interno ao excluir usuário',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VITAL API'
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('💥 Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Execução local
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 VITAL API na porta ${PORT}`);
  });
}

module.exports = app;
