// index.js - Versão com Supabase integrado
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://aeysoqtbencykavivgoe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleXNvcXRiZW5jeWthdml2Z29lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE4MTY1OSwiZXhwIjoyMDY0NzU3NjU5fQ.g64X3iebdB_TY_FWd6AI8mlej4uKMrKiFLG11z6hZlQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS configurado para appvital.com.br
app.use(cors({
  origin: ['https://appvital.com.br', 'https://www.appvital.com.br', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: ' VITAL API - Sistema de Triagem Hospitalar',
    status: 'online',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    supabase: 'conectado'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'supabase_connected'
  });
});

// Cadastrar usuário - com Supabase real
app.post('/api/cadastrar-usuario', async (req, res) => {
  try {
    const { nome, email, role, hospital_id } = req.body;
    
    console.log(' Dados recebidos:', { nome, email, role, hospital_id });
    
    if (!nome || !email || !role) {
      return res.status(400).json({
        error: 'Nome, email e role são obrigatórios'
      });
    }
    
    // Criar usuário na autenticação do Supabase
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: Math.random().toString(36).slice(-8), // Senha temporária
      email_confirm: true,
      user_metadata: {
        nome_completo: nome,
        role: role
      }
    });
    
    if (authError) {
      console.error(' Erro ao criar usuário na auth:', authError);
      return res.status(400).json({
        error: 'Erro ao criar usuário: ' + authError.message
      });
    }
    
    console.log(' Usuário criado na auth:', authUser.user.id);
    
    // Criar perfil do usuário na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        nome_completo: nome,
        email: email,
        role: role,
        hospital_id: hospital_id || null,
        ativo: true
      })
      .select()
      .single();
    
    if (profileError) {
      console.error(' Erro ao criar perfil:', profileError);
      return res.status(400).json({
        error: 'Erro ao criar perfil: ' + profileError.message
      });
    }
    
    console.log(' Perfil criado:', profile.id);
    
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso no banco de dados!',
      data: {
        id: authUser.user.id,
        nome,
        email,
        role,
        hospital_id: hospital_id || null,
        profile_created: true
      }
    });
    
  } catch (error) {
    console.error(' Erro inesperado:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Definir senha inicial - com Supabase real
app.post('/api/definir-senha-inicial', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    console.log(' Definindo senha para:', email);
    
    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }
    
    // Buscar usuário pelo email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error(' Erro ao listar usuários:', listError);
      return res.status(500).json({
        error: 'Erro ao buscar usuário'
      });
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    // Atualizar senha
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: senha }
    );
    
    if (updateError) {
      console.error(' Erro ao atualizar senha:', updateError);
      return res.status(400).json({
        error: 'Erro ao atualizar senha: ' + updateError.message
      });
    }
    
    console.log(' Senha atualizada para:', email);
    
    res.json({
      success: true,
      message: 'Senha definida com sucesso!',
      email,
      userId: user.id
    });
    
  } catch (error) {
    console.error(' Erro inesperado:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Listar usuários
app.get('/api/usuarios', async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      data: profiles
    });
    
  } catch (error) {
    console.error(' Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro ao listar usuários',
      details: error.message
    });
  }
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error(' Erro geral:', error);
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

// Para desenvolvimento local
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(` Servidor rodando na porta ${PORT}`);
    console.log(` Supabase conectado: ${supabaseUrl}`);
  });
}

module.exports = app;
